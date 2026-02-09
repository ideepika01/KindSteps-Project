from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.sql import func
from app.db.session import Base

class Webinar(Base):
    __tablename__ = "webinars"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    expert_name = Column(String)
    date_time = Column(DateTime(timezone=True))
    is_live = Column(Boolean, default=False)
    recording_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
