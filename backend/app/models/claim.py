from sqlalchemy import Column, Integer, String, Float, DateTime, Enum as SAEnum, ForeignKey, Text, Boolean
from sqlalchemy.sql import func
from app.database import Base
import enum


class ClaimStatus(str, enum.Enum):
    pending = "pending"          # AI analiz bekleniyor
    analyzing = "analyzing"      # AI analiz yapılıyor
    reviewed = "reviewed"        # AI analiz tamamlandı, sigorta onayı bekleniyor
    approved = "approved"        # Onaylandı, ödeme yapıldı
    rejected = "rejected"        # Reddedildi
    more_info = "more_info"      # Ek bilgi istendi


class DamageCategory(str, enum.Enum):
    none = "none"
    minor = "minor"
    moderate = "moderate"
    severe = "severe"
    total = "total"


class PriorityLevel(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class Claim(Base):
    __tablename__ = "claims"

    id = Column(Integer, primary_key=True, index=True)
    claim_number = Column(String, unique=True, index=True)
    policy_id = Column(Integer, ForeignKey("policies.id"))
    customer_id = Column(Integer, ForeignKey("users.id"))
    disaster_id = Column(Integer, ForeignKey("disasters.id"), nullable=True)

    # Müşteri bildirimi
    disaster_type = Column(String)
    description = Column(Text)
    incident_lat = Column(Float)
    incident_lon = Column(Float)
    image_path = Column(String, nullable=True)

    # AI analiz sonuçları — NVIDIA VLM (görsel)
    damage_score = Column(Float, nullable=True)          # 0-100
    damage_category = Column(SAEnum(DamageCategory), nullable=True)
    affected_area_m2 = Column(Float, nullable=True)
    ai_confidence = Column(Float, nullable=True)
    estimated_min_cost = Column(Float, nullable=True)
    estimated_max_cost = Column(Float, nullable=True)
    field_inspection_required = Column(Boolean, nullable=True)
    priority_level = Column(SAEnum(PriorityLevel), nullable=True)
    ai_notes = Column(Text, nullable=True)
    expert_report = Column(Text, nullable=True)

    # xView2 uydu analizi sonuçları
    satellite_score = Column(Float, nullable=True)       # 0-100
    satellite_category = Column(String, nullable=True)
    satellite_confidence = Column(Float, nullable=True)
    satellite_class = Column(String, nullable=True)

    # Sigorta şirketi kararı
    status = Column(SAEnum(ClaimStatus), default=ClaimStatus.pending)
    approved_amount = Column(Float, nullable=True)
    insurer_notes = Column(Text, nullable=True)
    payment_simulated = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
