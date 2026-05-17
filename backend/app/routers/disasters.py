import asyncio
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.disaster import Disaster
from app.models.user import User
from app.schemas.disaster import DisasterCreate, DisasterOut
from app.routers.auth import get_current_user, require_insurer
from app.services.geo_service import find_affected_policies
from app.services.satellite_service import fetch_satellite_image
from app.services.xview2_service import predict_satellite_damage

router = APIRouter(prefix="/disasters", tags=["disasters"])


@router.get("/", response_model=list[DisasterOut])
def list_disasters(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Disaster)
    if status:
        query = query.filter(Disaster.status == status)

    disasters = query.order_by(Disaster.occurred_at.desc()).all()

    result = []
    for d in disasters:
        affected = find_affected_policies(
            db, d.center_lat, d.center_lon, d.radius_km,
            insurer_id=current_user.id if current_user.role == "insurer" else None
        )
        d_dict = DisasterOut.model_validate(d).model_dump()
        d_dict["affected_policy_count"] = len(affected)
        result.append(d_dict)

    return result


@router.get("/{disaster_id}", response_model=DisasterOut)
def get_disaster(
    disaster_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    disaster = db.query(Disaster).filter(Disaster.id == disaster_id).first()
    if not disaster:
        raise HTTPException(404, "Afet bulunamadı")
    return disaster


@router.get("/{disaster_id}/affected-policies")
def get_affected_policies(
    disaster_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    disaster = db.query(Disaster).filter(Disaster.id == disaster_id).first()
    if not disaster:
        raise HTTPException(404, "Afet bulunamadı")

    affected = find_affected_policies(
        db, disaster.center_lat, disaster.center_lon, disaster.radius_km,
        insurer_id=current_user.id if current_user.role == "insurer" else None
    )

    return [
        {
            "policy_id":       item["policy"].id,
            "policy_number":   item["policy"].policy_number,
            "property_address": item["policy"].property_address,
            "property_city":   item["policy"].property_city,
            "coverage_amount": item["policy"].coverage_amount,
            "policy_type":     item["policy"].policy_type,
            "distance_km":     item["distance_km"],
            "priority_score":  item["priority_score"],
            "lat":             item["policy"].property_lat,
            "lon":             item["policy"].property_lon,
        }
        for item in affected
    ]


@router.post("/{disaster_id}/analyze")
async def analyze_disaster_satellite(
    disaster_id: int,
    current_user: User = Depends(require_insurer),
    db: Session = Depends(get_db),
):
    """
    Afet bölgesindeki poliçeleri PARALEL olarak uydu + AI analizi ile değerlendir.
    Hasar skoru >= 15 olan mülkler için otomatik hasar kaydı oluştur.
    """
    from app.models.claim import Claim, ClaimStatus, DamageCategory, PriorityLevel
    from app.services.nvidia_service import analyze_damage_with_vision, generate_expert_report

    disaster = db.query(Disaster).filter(Disaster.id == disaster_id).first()
    if not disaster:
        raise HTTPException(404, "Afet bulunamadı")

    affected = find_affected_policies(
        db, disaster.center_lat, disaster.center_lon, disaster.radius_km,
        insurer_id=current_user.id,
    )

    if not affected:
        return {
            "disaster_id": disaster_id,
            "disaster_name": disaster.name,
            "summary": {
                "total_policies": 0, "total_risk_tl": 0, "auto_claims": 0,
                "destroyed": 0, "major_damage": 0, "minor_damage": 0,
                "no_damage": 0, "avg_score": 0,
            },
            "results": [],
        }

    disaster_type_str = (
        disaster.disaster_type.value
        if hasattr(disaster.disaster_type, "value")
        else str(disaster.disaster_type)
    )

    # ── Her poliçeyi bağımsız olarak analiz eden coroutine ────────────
    async def analyze_one(item: dict) -> dict:
        policy = item["policy"]
        dist   = item["distance_km"]

        auto_description = (
            f"{disaster.name} nedeniyle {disaster.city} bölgesinde meydana gelen "
            f"{disaster_type_str} afetinden etkilenen mülk. "
            f"Merkeze {dist:.1f} km uzaklıkta. Otomatik tarama kaydı."
        )

        # 1) Uydu görüntüsü — async HTTP
        image_bytes = await fetch_satellite_image(policy.property_lat, policy.property_lon)

        # 2) xView2 hasar tahmini — CPU-bound, thread pool'da çalıştır
        sat = await asyncio.to_thread(predict_satellite_damage, image_bytes)
        sat_score = int(sat.get("satellite_score") or 0)

        # 3) NVIDIA VLM — async HTTP / mock
        analysis = await analyze_damage_with_vision(
            image_bytes, disaster_type_str, auto_description,
            policy.property_lat, policy.property_lon,
        )

        # 4) Birleşik skor: uydu %70 + VLM %30
        vlm_score     = int(analysis.get("damage_score") or sat_score)
        combined_score = round(sat_score * 0.7 + vlm_score * 0.3)
        analysis["damage_score"] = combined_score

        estimated_loss = round(policy.coverage_amount * combined_score / 100)

        # 5) Ekspertiz raporu (sadece anlamlı hasarda)
        report      = None
        claim_num   = f"TES-{uuid.uuid4().hex[:8].upper()}"
        if combined_score >= 30:
            policy_data = {
                "policy_number":    policy.policy_number,
                "policy_type":      str(policy.policy_type.value if hasattr(policy.policy_type, "value") else policy.policy_type),
                "property_address": policy.property_address,
                "property_city":    policy.property_city,
                "coverage_amount":  policy.coverage_amount,
            }
            report = await generate_expert_report(claim_num, policy_data, analysis, disaster_type_str)

        return {
            "policy":           policy,
            "dist":             dist,
            "sat":              sat,
            "sat_score":        sat_score,
            "analysis":         analysis,
            "combined_score":   combined_score,
            "estimated_loss":   estimated_loss,
            "auto_description": auto_description,
            "report":           report,
            "claim_num":        claim_num,
            "has_image":        image_bytes is not None,
        }

    # ── Tüm poliçeleri AYNI ANDA analiz et ───────────────────────────
    raw = await asyncio.gather(
        *[analyze_one(item) for item in affected],
        return_exceptions=True,
    )

    # ── Sonuçları işle, DB kayıtlarını sırayla oluştur ───────────────
    cat_map = {
        "none":     DamageCategory.none,
        "minor":    DamageCategory.minor,
        "moderate": DamageCategory.moderate,
        "severe":   DamageCategory.severe,
        "total":    DamageCategory.total,
    }
    pri_map = {
        "low":      PriorityLevel.low,
        "medium":   PriorityLevel.medium,
        "high":     PriorityLevel.high,
        "critical": PriorityLevel.critical,
    }

    results    = []
    total_risk = 0.0

    for pr in raw:
        if isinstance(pr, Exception):
            continue

        policy         = pr["policy"]
        analysis       = pr["analysis"]
        sat            = pr["sat"]
        combined_score = pr["combined_score"]

        existing = db.query(Claim).filter(
            Claim.policy_id  == policy.id,
            Claim.disaster_id == disaster.id,
        ).first()

        claim_number = None
        auto_created = False

        if not existing and combined_score >= 30:
            cost = analysis.get("estimated_repair_cost_range", {})
            new_claim = Claim(
                claim_number              = pr["claim_num"],
                policy_id                 = policy.id,
                customer_id               = policy.customer_id,
                disaster_id               = disaster.id,
                disaster_type             = disaster_type_str,
                description               = pr["auto_description"],
                incident_lat              = policy.property_lat,
                incident_lon              = policy.property_lon,
                satellite_score           = pr["sat_score"],
                satellite_class           = sat.get("satellite_class"),
                satellite_category        = sat.get("satellite_category"),
                satellite_confidence      = sat.get("satellite_confidence"),
                damage_score              = combined_score,
                damage_category           = cat_map.get(analysis.get("damage_category", "minor"), DamageCategory.minor),
                affected_area_m2          = analysis.get("affected_area_m2"),
                ai_confidence             = analysis.get("confidence"),
                estimated_min_cost        = cost.get("min"),
                estimated_max_cost        = cost.get("max"),
                field_inspection_required = analysis.get("field_inspection_required", False),
                priority_level            = pri_map.get(analysis.get("priority_level", "medium"), PriorityLevel.medium),
                ai_notes                  = analysis.get("expert_notes"),
                expert_report             = pr["report"],
                status                    = ClaimStatus.reviewed,
                payment_simulated         = False,
            )
            db.add(new_claim)
            db.flush()
            claim_number = new_claim.claim_number
            auto_created = True
        elif existing:
            claim_number = existing.claim_number

        total_risk += pr["estimated_loss"]
        results.append({
            "policy_id":            policy.id,
            "policy_number":        policy.policy_number,
            "property_address":     policy.property_address,
            "property_city":        policy.property_city,
            "coverage_amount":      policy.coverage_amount,
            "policy_type":          str(policy.policy_type.value if hasattr(policy.policy_type, "value") else policy.policy_type),
            "lat":                  policy.property_lat,
            "lon":                  policy.property_lon,
            "distance_km":          pr["dist"],
            "priority_score":       0,
            "satellite_score":      pr["sat_score"],
            "satellite_class":      sat.get("satellite_class"),
            "satellite_category":   sat.get("satellite_category"),
            "satellite_confidence": sat.get("satellite_confidence"),
            "combined_score":       combined_score,
            "estimated_loss":       pr["estimated_loss"],
            "image_source":         "satellite" if pr["has_image"] else "mock",
            "claim_number":         claim_number,
            "auto_created":         auto_created,
        })

    db.commit()

    summary = {
        "total_policies": len(results),
        "total_risk_tl":  round(total_risk),
        "auto_claims":    sum(1 for r in results if r["auto_created"]),
        "destroyed":      sum(1 for r in results if r["satellite_class"] == "destroyed"),
        "major_damage":   sum(1 for r in results if r["satellite_class"] == "major-damage"),
        "minor_damage":   sum(1 for r in results if r["satellite_class"] == "minor-damage"),
        "no_damage":      sum(1 for r in results if r["satellite_class"] == "no-damage"),
        "avg_score":      round(sum(r["combined_score"] for r in results) / len(results)) if results else 0,
    }

    return {
        "disaster_id":   disaster_id,
        "disaster_name": disaster.name,
        "summary":       summary,
        "results":       results,
    }


@router.post("/", response_model=DisasterOut)
def create_disaster(
    body: DisasterCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    disaster = Disaster(**body.model_dump())
    db.add(disaster)
    db.commit()
    db.refresh(disaster)
    return disaster
