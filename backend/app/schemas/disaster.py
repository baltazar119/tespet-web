from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.disaster import DisasterType, DisasterStatus


class DisasterCreate(BaseModel):
    name: str
    disaster_type: DisasterType
    center_lat: float
    center_lon: float
    radius_km: float
    city: str
    district: Optional[str] = None
    magnitude: Optional[float] = None
    severity_score: float
    description: Optional[str] = None
    source: Optional[str] = None
    occurred_at: datetime


class DisasterOut(BaseModel):
    id: int
    name: str
    disaster_type: DisasterType
    status: DisasterStatus
    center_lat: float
    center_lon: float
    radius_km: float
    city: str
    district: Optional[str] = None
    magnitude: Optional[float] = None
    severity_score: float
    satellite_damage_score: Optional[float] = None
    affected_buildings_estimate: Optional[int] = None
    satellite_image_path: Optional[str] = None
    description: Optional[str] = None
    source: Optional[str] = None
    occurred_at: datetime
    created_at: Optional[datetime] = None
    affected_policy_count: Optional[int] = None  # computed field

    model_config = {"from_attributes": True}
