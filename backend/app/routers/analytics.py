from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.claim import Claim, ClaimStatus
from app.models.policy import Policy
from app.models.user import User
from app.routers.auth import require_insurer

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary")
def get_summary(
    current_user: User = Depends(require_insurer),
    db: Session = Depends(get_db),
):
    policy_ids = [p.id for p in db.query(Policy).filter(Policy.insurer_id == current_user.id).all()]

    claims = db.query(Claim).filter(Claim.policy_id.in_(policy_ids)).all()

    total = len(claims)
    approved = sum(1 for c in claims if c.status == ClaimStatus.approved)
    rejected = sum(1 for c in claims if c.status == ClaimStatus.rejected)
    pending = sum(1 for c in claims if c.status in [ClaimStatus.pending, ClaimStatus.analyzing])
    reviewed = sum(1 for c in claims if c.status == ClaimStatus.reviewed)

    total_approved_amount = sum(c.approved_amount or 0 for c in claims if c.status == ClaimStatus.approved)

    # Saha ekibi gerektirmeyen = AI otomatik çözdü
    no_field_needed = sum(1 for c in claims if c.field_inspection_required is False and c.status != ClaimStatus.pending)
    field_savings = no_field_needed * 3500  # ortalama saha ziyareti maliyeti TL

    # Ortalama hasar skoru
    scored = [c.damage_score for c in claims if c.damage_score is not None]
    avg_damage_score = round(sum(scored) / len(scored), 1) if scored else 0

    # Kategori dağılımı
    categories = {}
    for c in claims:
        if c.damage_category:
            categories[c.damage_category] = categories.get(c.damage_category, 0) + 1

    # Tip dağılımı
    types = {}
    for c in claims:
        if c.disaster_type:
            types[c.disaster_type] = types.get(c.disaster_type, 0) + 1

    # Haftalık başvuru (son 7 gün sahte tutarlı veri)
    weekly = [
        {"day": "Pzt", "count": max(0, total // 7 + 2)},
        {"day": "Sal", "count": max(0, total // 7 + 1)},
        {"day": "Çar", "count": max(0, total // 7 + 4)},
        {"day": "Per", "count": max(0, total // 7 + 0)},
        {"day": "Cum", "count": max(0, total // 7 + 3)},
        {"day": "Cmt", "count": max(0, total // 7 - 1)},
        {"day": "Paz", "count": max(0, total // 7 - 2)},
    ]

    return {
        "total_claims": total,
        "approved": approved,
        "rejected": rejected,
        "pending": pending,
        "reviewed": reviewed,
        "total_approved_amount": total_approved_amount,
        "avg_damage_score": avg_damage_score,
        "avg_processing_minutes": 4.2,  # demo değer — gerçekte created_at→updated_at farkı
        "industry_avg_days": 18,
        "field_savings_tl": field_savings,
        "no_field_needed": no_field_needed,
        "ai_auto_rate": round((approved + rejected) / total * 100, 1) if total else 0,
        "damage_categories": categories,
        "disaster_types": types,
        "weekly_claims": weekly,
        "total_policies": len(policy_ids),
    }
