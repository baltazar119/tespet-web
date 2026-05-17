from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.claim import ClaimStatus, DamageCategory, PriorityLevel


class ClaimCreate(BaseModel):
    policy_id: int
    disaster_type: str
    description: str
    incident_lat: float
    incident_lon: float
    disaster_id: Optional[int] = None


class ClaimApprove(BaseModel):
    approved_amount: float
    insurer_notes: Optional[str] = None


class ClaimReject(BaseModel):
    insurer_notes: str


class ClaimOut(BaseModel):
    id: int
    claim_number: str
    policy_id: int
    customer_id: int
    disaster_id: Optional[int] = None
    disaster_type: str
    description: str
    incident_lat: float
    incident_lon: float
    image_path: Optional[str] = None
    damage_score: Optional[float] = None
    damage_category: Optional[DamageCategory] = None
    affected_area_m2: Optional[float] = None
    ai_confidence: Optional[float] = None
    estimated_min_cost: Optional[float] = None
    estimated_max_cost: Optional[float] = None
    field_inspection_required: Optional[bool] = None
    priority_level: Optional[PriorityLevel] = None
    ai_notes: Optional[str] = None
    expert_report: Optional[str] = None
    satellite_image_path: Optional[str] = None
    vlm_score: Optional[float] = None
    satellite_score: Optional[float] = None
    satellite_category: Optional[str] = None
    satellite_confidence: Optional[float] = None
    satellite_class: Optional[str] = None
    status: ClaimStatus
    approved_amount: Optional[float] = None
    insurer_notes: Optional[str] = None
    payment_simulated: bool
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
