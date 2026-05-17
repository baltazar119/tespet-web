import uuid
import asyncio
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.claim import Claim, ClaimStatus
from app.models.policy import Policy
from app.models.user import User
from app.schemas.claim import ClaimOut, ClaimApprove, ClaimReject
from app.routers.auth import get_current_user, require_insurer
from app.services.nvidia_service import analyze_damage_with_vision, generate_expert_report
from app.services.satellite_service import fetch_satellite_image, fetch_esri_satellite_tile
from app.services.geo_service import score_to_priority
from app.services.xview2_service import predict_satellite_damage
from app.services.pdf_service import generate_claim_pdf

router = APIRouter(prefix="/claims", tags=["claims"])


async def _run_ai_analysis(claim_id: int, db_url: str):
    """Arka planda AI analizi çalıştır."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    is_sqlite = db_url.startswith("sqlite")
    connect_args = {"check_same_thread": False} if is_sqlite else {"sslmode": "require"}
    engine = create_engine(db_url, connect_args=connect_args)
    Session = sessionmaker(bind=engine)
    db = Session()

    try:
        claim = db.query(Claim).filter(Claim.id == claim_id).first()
        if not claim:
            return

        claim.status = ClaimStatus.analyzing
        db.commit()

        # 1) Uydu görüntüsü al ve kaydet
        image_bytes = await fetch_satellite_image(claim.incident_lat, claim.incident_lon)
        if image_bytes:
            from pathlib import Path
            sat_dir = Path("uploads/satellite")
            sat_dir.mkdir(parents=True, exist_ok=True)
            sat_path = sat_dir / f"claim_{claim_id}.jpg"
            with open(sat_path, "wb") as f:
                f.write(image_bytes)
            claim.satellite_image_path = str(sat_path)
            db.commit()

        # 2) xView2 uydu analizi (senkron — CPU inference)
        sat_result = predict_satellite_damage(image_bytes)
        claim.satellite_score      = sat_result.get("satellite_score")
        claim.satellite_category   = sat_result.get("satellite_category")
        claim.satellite_confidence = sat_result.get("satellite_confidence")
        claim.satellite_class      = sat_result.get("satellite_class")
        db.commit()

        # 3) NVIDIA VLM analizi (uydu görüntüsü üzerinde)
        analysis = await analyze_damage_with_vision(
            image_bytes, claim.disaster_type, claim.description,
            claim.incident_lat, claim.incident_lon
        )

        # 4) İki skoru birleştir — VLM %70, uydu %30
        # VLM müşteri açıklamasını da okur → daha bağlamsal
        # Uydu mevcut görüntü gösterir (hasar yılından sonra yenilenmiş olabilir)
        vlm_score_raw = int(analysis.get("damage_score") or 50)
        sat_score = int(sat_result.get("satellite_score") or vlm_score_raw)
        combined_score = round(sat_score * 0.7 + vlm_score_raw * 0.3)
        print(f"[AI] vlm={vlm_score_raw} sat={sat_score} combined={combined_score}")

        # 5) Poliçe bilgilerini al
        policy = db.query(Policy).filter(Policy.id == claim.policy_id).first()
        policy_data = {
            "policy_number":    policy.policy_number if policy else "N/A",
            "policy_type":      "DASK Zorunlu Deprem Sigortası",
            "property_address": policy.property_address if policy else "N/A",
            "property_city":    policy.property_city if policy else "N/A",
            "coverage_amount":  policy.coverage_amount if policy else 0,
        }

        # 6) Nemotron ekspertiz raporu oluştur
        report = await generate_expert_report(
            claim.claim_number, policy_data, analysis, claim.disaster_type
        )

        # 7) Tüm sonuçları kaydet
        cost = analysis.get("estimated_repair_cost_range", {})
        claim.vlm_score                = vlm_score_raw
        claim.damage_score             = combined_score
        claim.damage_category          = analysis.get("damage_category")
        claim.affected_area_m2         = analysis.get("affected_area_m2")
        claim.ai_confidence            = analysis.get("confidence")
        claim.estimated_min_cost       = cost.get("min")
        claim.estimated_max_cost       = cost.get("max")
        claim.field_inspection_required = analysis.get("field_inspection_required", False)
        claim.priority_level           = analysis.get("priority_level", "medium")
        claim.ai_notes                 = analysis.get("expert_notes")
        claim.expert_report            = report
        claim.status                   = ClaimStatus.reviewed

        db.commit()
    except Exception as e:
        db = Session()
        claim = db.query(Claim).filter(Claim.id == claim_id).first()
        if claim:
            claim.status = ClaimStatus.pending
            db.commit()
    finally:
        db.close()


@router.post("/", response_model=ClaimOut)
async def create_claim(
    background_tasks: BackgroundTasks,
    policy_id: int = Form(...),
    disaster_type: str = Form(...),
    description: str = Form(...),
    incident_lat: float = Form(...),
    incident_lon: float = Form(...),
    disaster_id: Optional[int] = Form(None),
    image: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Poliçe kontrolü
    policy = db.query(Policy).filter(
        Policy.id == policy_id,
        Policy.customer_id == current_user.id
    ).first()
    if not policy:
        raise HTTPException(404, "Poliçe bulunamadı veya yetkiniz yok")

    # Görsel kaydet
    image_path = None
    if image:
        from pathlib import Path
        upload_dir = Path("uploads")
        upload_dir.mkdir(exist_ok=True)
        image_path = str(upload_dir / f"{uuid.uuid4()}.jpg")
        with open(image_path, "wb") as f:
            f.write(await image.read())

    claim = Claim(
        claim_number=f"TES-{uuid.uuid4().hex[:8].upper()}",
        policy_id=policy_id,
        customer_id=current_user.id,
        disaster_id=disaster_id,
        disaster_type=disaster_type,
        description=description,
        incident_lat=incident_lat,
        incident_lon=incident_lon,
        image_path=image_path,
        status=ClaimStatus.pending,
    )
    db.add(claim)
    db.commit()
    db.refresh(claim)

    # Arka planda AI analizi başlat
    import os
    db_url = os.getenv("DATABASE_URL", "sqlite:///./tespet.db")
    background_tasks.add_task(_run_ai_analysis, claim.id, db_url)

    return claim


@router.get("/", response_model=list[ClaimOut])
def list_claims(
    status: Optional[str] = None,
    disaster_type: Optional[str] = None,
    priority_level: Optional[str] = None,
    city: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Claim)

    if current_user.role == "customer":
        query = query.filter(Claim.customer_id == current_user.id)
    else:
        # insurer: kendi şirketinin poliçelerine ait hasarlar
        policy_ids = [p.id for p in db.query(Policy).filter(Policy.insurer_id == current_user.id).all()]
        query = query.filter(Claim.policy_id.in_(policy_ids))

    if status:
        query = query.filter(Claim.status == status)
    if disaster_type:
        query = query.filter(Claim.disaster_type == disaster_type)
    if priority_level:
        query = query.filter(Claim.priority_level == priority_level)

    return query.order_by(Claim.created_at.desc()).all()


@router.get("/{claim_id}", response_model=ClaimOut)
def get_claim(
    claim_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(404, "Hasar kaydı bulunamadı")
    return claim


@router.post("/{claim_id}/approve", response_model=ClaimOut)
def approve_claim(
    claim_id: int,
    body: ClaimApprove,
    current_user: User = Depends(require_insurer),
    db: Session = Depends(get_db),
):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(404, "Hasar kaydı bulunamadı")
    claim.status = ClaimStatus.approved
    claim.approved_amount = body.approved_amount
    claim.insurer_notes = body.insurer_notes
    claim.payment_simulated = True
    db.commit()
    db.refresh(claim)
    return claim


@router.post("/{claim_id}/reject", response_model=ClaimOut)
def reject_claim(
    claim_id: int,
    body: ClaimReject,
    current_user: User = Depends(require_insurer),
    db: Session = Depends(get_db),
):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(404, "Hasar kaydı bulunamadı")
    claim.status = ClaimStatus.rejected
    claim.insurer_notes = body.insurer_notes
    db.commit()
    db.refresh(claim)
    return claim


@router.get("/{claim_id}/satellite.jpg")
async def get_satellite_image(
    claim_id: int,
    db: Session = Depends(get_db),
):
    """Hasar kaydının uydu görüntüsünü döndür (public)."""
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(404, "Hasar kaydı bulunamadı")

    # Kaydedilmiş uydu görüntüsü varsa döndür
    if claim.satellite_image_path:
        try:
            with open(claim.satellite_image_path, "rb") as f:
                return Response(content=f.read(), media_type="image/jpeg")
        except Exception:
            pass

    # Yoksa koordinattan gerçek zamanlı çek
    if claim.incident_lat and claim.incident_lon:
        img = await fetch_esri_satellite_tile(claim.incident_lat, claim.incident_lon, zoom=16)
        if img:
            return Response(content=img, media_type="image/jpeg")

    raise HTTPException(404, "Uydu görüntüsü bulunamadı")


@router.get("/{claim_id}/report.pdf")
async def download_report(
    claim_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Hasar kaydı için PDF ekspertiz raporu üret ve indir."""
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(404, "Hasar kaydı bulunamadı")

    # Yetki kontrolü: müşteri sadece kendi hasarını, sigorta şirketi kendi poliçelerini görebilir
    if current_user.role == "customer" and claim.customer_id != current_user.id:
        raise HTTPException(403, "Bu rapora erişim yetkiniz yok")

    policy = db.query(Policy).filter(Policy.id == claim.policy_id).first() if claim.policy_id else None

    # Hasar fotoğrafı
    image_bytes = None
    if claim.image_path:
        try:
            with open(claim.image_path, "rb") as f:
                image_bytes = f.read()
        except Exception:
            pass

    # Uydu görüntüsü (koordinattan gerçek zamanlı çek)
    satellite_bytes = None
    if claim.incident_lat and claim.incident_lon:
        try:
            satellite_bytes = await fetch_esri_satellite_tile(
                claim.incident_lat, claim.incident_lon, zoom=17
            )
        except Exception:
            pass

    pdf_bytes = generate_claim_pdf(
        claim=claim,
        policy=policy,
        image_bytes=image_bytes,
        satellite_bytes=satellite_bytes,
    )

    filename = f"tespet-ekspertiz-{claim.claim_number}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
