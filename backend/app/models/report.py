from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
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

    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    condition = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    location = Column(String, nullable=False)
    location_details = Column(String)
    photo_url = Column(String)

    contact_name = Column(String, nullable=False)
    contact_phone = Column(String, nullable=False)

    latitude = Column(String)
    longitude = Column(String)

    status = Column(String, default=ReportStatus.received.value, index=True)
    priority = Column(String, default=ReportPriority.medium.value, index=True)

    assigned_team_id = Column(Integer, ForeignKey("users.id"), index=True)
    rescued_location = Column(String)
    field_review = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # relationships
    reporter = relationship("User", back_populates="reports", foreign_keys=[reporter_id])
    assigned_team = relationship("User", back_populates="assigned_reports", foreign_keys=[assigned_team_id])

    # return assigned team name
    @property
    def assigned_team_name(self):
        return self.assigned_team.full_name if self.assigned_team else "Unassigned"

    # return assigned team phone
    @property
    def assigned_team_phone(self):
        return self.assigned_team.phone if self.assigned_team else "N/A"