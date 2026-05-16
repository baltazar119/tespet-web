from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.disaster import Disaster
from app.models.user import User
from app.schemas.disaster import DisasterCreate, DisasterOut
from app.routers.auth import get_current_user
from app.services.geo_service import find_affected_policies

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
            "policy_id": item["policy"].id,
            "policy_number": item["policy"].policy_number,
            "property_address": item["policy"].property_address,
            "property_city": item["policy"].property_city,
            "coverage_amount": item["policy"].coverage_amount,
            "policy_type": item["policy"].policy_type,
            "distance_km": item["distance_km"],
            "priority_score": item["priority_score"],
        }
        for item in affected
    ]


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
