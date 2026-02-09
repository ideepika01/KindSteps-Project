from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class WebinarBase(BaseModel):
    title: str
    description: str
    expert_name: str
    date_time: datetime
    is_live: bool = False
    recording_url: Optional[str] = None

class WebinarCreate(WebinarBase):
    pass

class WebinarResponse(WebinarBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
