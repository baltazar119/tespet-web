from sqlalchemy import Column, Integer, String, Float, DateTime, Enum as SAEnum, Text
from sqlalchemy.sql import func
from app.database import Base
import enum


class DisasterType(str, enum.Enum):
    deprem = "deprem"
    sel = "sel"
    yangin = "yangin"
    dolu = "dolu"
    heyelan = "heyelan"


class DisasterStatus(str, enum.Enum):
    active = "active"
    monitoring = "monitoring"
    closed = "closed"


class Disaster(Base):
    __tablename__ = "disasters"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    disaster_type = Column(SAEnum(DisasterType))
    status = Column(SAEnum(DisasterStatus), default=DisasterStatus.active)

    center_lat = Column(Float)
    center_lon = Column(Float)
    radius_km = Column(Float)     # Etki yarıçapı
    city = Column(String)
    district = Column(String, nullable=True)

    magnitude = Column(Float, nullable=True)   # Deprem için
    severity_score = Column(Float)             # 0-100 genel şiddet

    # AI uydu analizi
    satellite_damage_score = Column(Float, nullable=True)
    affected_buildings_estimate = Column(Integer, nullable=True)
    satellite_image_path = Column(String, nullable=True)

    description = Column(Text, nullable=True)
    source = Column(String, nullable=True)    # AFAD, NASA FIRMS, vs.

    occurred_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
