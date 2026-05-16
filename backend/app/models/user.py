from sqlalchemy import Column, Integer, String, Enum as SAEnum
from app.database import Base
import enum


class UserRole(str, enum.Enum):
    customer = "customer"
    insurer = "insurer"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String)
    hashed_password = Column(String)
    role = Column(SAEnum(UserRole), default=UserRole.customer)
    company_name = Column(String, nullable=True)  # sigorta şirketleri için
    phone = Column(String, nullable=True)
