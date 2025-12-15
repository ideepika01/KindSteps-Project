from sqlalchemy import Boolean, Column, Integer, String, Enum, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
import enum

class UserRole(str, enum.Enum):
    user = "user"
    rescue_team = "rescue_team"
    admin = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    phone = Column(String)
    role = Column(String, default=UserRole.user.value) # Storing as string for simplicity
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    # Relationships
    reports = relationship("Report", back_populates="reporter", foreign_keys="Report.reporter_id")
    assigned_reports = relationship("Report", back_populates="assigned_team", foreign_keys="Report.assigned_team_id")
