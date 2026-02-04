from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from typing import Optional
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
    
    latitude = Column(String, nullable=True)
    longitude = Column(String, nullable=True)
    
    status = Column(String, default=ReportStatus.received.value)
    priority = Column(String, default=ReportPriority.medium.value)
    
    assigned_team_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    rescued_location = Column(String, nullable=True)
    field_review = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    reporter = relationship("User", back_populates="reports", foreign_keys=[reporter_id])
    assigned_team = relationship("User", back_populates="assigned_reports", foreign_keys=[assigned_team_id])

    @property
    def assigned_team_name(self) -> Optional[str]:
        return self.assigned_team.full_name if self.assigned_team else "Unassigned"

    @property
    def assigned_team_phone(self) -> Optional[str]:
        return self.assigned_team.phone if self.assigned_team else "N/A"
