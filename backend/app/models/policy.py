from sqlalchemy import Column, Integer, String, Float, Date, Enum as SAEnum, ForeignKey
from app.database import Base
import enum


class PolicyType(str, enum.Enum):
    deprem = "deprem"
    sel = "sel"
    yangin = "yangin"
    dolu = "dolu"
    tarim = "tarim"
    konut = "konut"


class PolicyStatus(str, enum.Enum):
    active = "active"
    expired = "expired"
    suspended = "suspended"


class Policy(Base):
    __tablename__ = "policies"

    id = Column(Integer, primary_key=True, index=True)
    policy_number = Column(String, unique=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"))
    insurer_id = Column(Integer, ForeignKey("users.id"))

    policy_type = Column(SAEnum(PolicyType))
    status = Column(SAEnum(PolicyStatus), default=PolicyStatus.active)

    # Sigortalı mülk bilgileri
    property_address = Column(String)
    property_city = Column(String)
    property_district = Column(String)
    property_lat = Column(Float)
    property_lon = Column(Float)
    property_area_m2 = Column(Float)

    coverage_amount = Column(Float)  # TL cinsinden teminat
    premium_amount = Column(Float)   # Prim tutarı
    start_date = Column(String)
    end_date = Column(String)
