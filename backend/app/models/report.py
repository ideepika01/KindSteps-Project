from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
import enum

class ReportStatus(str, enum.Enum):
    received = "received"
    in_progress = "in_progress"
    active = "active"
    resolved = "resolved"

class ReportPriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id"))
    condition = Column(String)
    description = Column(Text)
    location = Column(String)
    photo_url = Column(String, nullable=True)
    contact_name = Column(String)
    contact_phone = Column(String)
    status = Column(String, default=ReportStatus.received.value)
    assigned_team_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    priority = Column(String, default=ReportPriority.medium.value)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    reporter = relationship("User", back_populates="reports", foreign_keys=[reporter_id])
    assigned_team = relationship("User", back_populates="assigned_reports", foreign_keys=[assigned_team_id])
