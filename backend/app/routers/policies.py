from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.policy import Policy
from app.models.user import User
from app.schemas.policy import PolicyOut
from app.routers.auth import get_current_user

router = APIRouter(prefix="/policies", tags=["policies"])


@router.get("/", response_model=list[PolicyOut])
def list_policies(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role == "customer":
        return db.query(Policy).filter(Policy.customer_id == current_user.id).all()
    # insurer: kendi şirketinin poliçeleri
    return db.query(Policy).filter(Policy.insurer_id == current_user.id).all()


@router.get("/{policy_id}", response_model=PolicyOut)
def get_policy(
    policy_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        from fastapi import HTTPException
        raise HTTPException(404, "Poliçe bulunamadı")
    return policy
