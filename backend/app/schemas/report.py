from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.report import ReportStatus, ReportPriority

class ReportBase(BaseModel):
    condition: str
    description: str
    location: str
    contact_name: str
    contact_phone: str
    priority: ReportPriority = ReportPriority.medium

class ReportCreate(ReportBase):
    pass
    # photo_url will be handled separately via file upload

class ReportStatusUpdate(BaseModel):
    status: ReportStatus

class ReportResponse(ReportBase):
    id: int
    reporter_id: int
    photo_url: Optional[str] = None
    status: ReportStatus
    created_at: datetime
    assigned_team_id: Optional[int] = None

    class Config:
        from_attributes = True
