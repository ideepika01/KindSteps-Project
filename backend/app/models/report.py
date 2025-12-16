# =========================================================
# REPORT MODEL
# This file defines what a "Report" (Rescue Case) looks like.
# =========================================================

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
import enum

# 1. STATUS OPTIONS
class ReportStatus(str, enum.Enum):
    received = "received"
    in_progress = "in_progress"
    active = "active"
    resolved = "resolved"

# 2. PRIORITY OPTIONS
class ReportPriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"

# 3. THE REPORT TABLE
class Report(Base):
    __tablename__ = "reports"

    # -- Basic Info --
    id = Column(Integer, primary_key=True, index=True)
    # Who reported it? (Links to User table)
    reporter_id = Column(Integer, ForeignKey("users.id"))
    
    condition = Column(String)      # e.g., "Injured Leg"
    description = Column(Text)      # Full details
    location = Column(String)       # Address or coordinates
    photo_url = Column(String, nullable=True) # Path to uploaded image
    
    # Contact Info (for this specific report)
    contact_name = Column(String)
    contact_phone = Column(String)
    
    # Status & Assignment
    status = Column(String, default=ReportStatus.received.value)
    priority = Column(String, default=ReportPriority.medium.value)
    
    # Who is fixing it? (Links to User table, specifically rescue team members)
    assigned_team_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # -- Relationships --
    # Python helpers to jump between tables
    
    # "report.reporter" gives us the User object of the person who reported it
    reporter = relationship("User", back_populates="reports", foreign_keys=[reporter_id])
    
    # "report.assigned_team" gives us the User object of the rescue team member
    assigned_team = relationship("User", back_populates="assigned_reports", foreign_keys=[assigned_team_id])
