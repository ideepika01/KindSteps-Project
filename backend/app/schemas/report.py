# =========================================================
# REPORT SCHEMAS
# Validating inputs and outputs for Reports.
# =========================================================

from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.report import ReportStatus, ReportPriority

# 1. BASE SCHEMA (Shared Fields)
class ReportBase(BaseModel):
    condition: str
    description: str
    location: str
    contact_name: str
    contact_phone: str
    # Default priority is Medium
    priority: ReportPriority = ReportPriority.medium

# 2. CREATE REPORT (Inputs)
class ReportCreate(ReportBase):
    pass 
    # NOTE: "photo" is handled separately because it is a file upload, 
    # not a simple JSON text field.

# 3. UPDATE STATUS (Inputs)
class ReportStatusUpdate(BaseModel):
    status: ReportStatus

# 4. REPORT RESPONSE (Outputs)
# This is what the frontend receives.
class ReportResponse(ReportBase):
    id: int
    reporter_id: int
    photo_url: Optional[str] = None
    status: ReportStatus
    created_at: datetime
    assigned_team_id: Optional[int] = None

    class Config:
        from_attributes = True # Allows reading from database models
