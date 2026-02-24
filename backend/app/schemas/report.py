from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.report import ReportPriority


class ReportBase(BaseModel):
    condition: str
    description: str
    location: str
    location_details: Optional[str] = None
    contact_name: str
    contact_phone: str
    latitude: Optional[str] = None
    longitude: Optional[str] = None
    priority: ReportPriority = ReportPriority.medium


class ReportCreate(ReportBase):
    pass


class ReportUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_team_id: Optional[int] = None
    rescued_location: Optional[str] = None
    field_review: Optional[str] = None


class ReportStatusUpdate(BaseModel):
    status: str


class ReportResponse(BaseModel):
    id: int
    reporter_id: int
    condition: str
    description: str
    location: str
    location_details: Optional[str] = None
    contact_name: str
    contact_phone: str
    photo_url: Optional[str] = None
    status: str
    priority: str
    created_at: datetime
    updated_at: datetime
    assigned_team_id: Optional[int] = None
    assigned_team_name: Optional[str] = None
    assigned_team_phone: Optional[str] = None
    rescued_location: Optional[str] = None
    latitude: Optional[str] = None
    longitude: Optional[str] = None
    field_review: Optional[str] = None

    class Config:
        from_attributes = True
