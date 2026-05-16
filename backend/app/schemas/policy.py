from pydantic import BaseModel
from app.models.policy import PolicyType, PolicyStatus


class PolicyOut(BaseModel):
    id: int
    policy_number: str
    policy_type: PolicyType
    status: PolicyStatus
    property_address: str
    property_city: str
    property_district: str
    property_lat: float
    property_lon: float
    property_area_m2: float
    coverage_amount: float
    premium_amount: float
    start_date: str
    end_date: str
    customer_id: int
    insurer_id: int

    model_config = {"from_attributes": True}
