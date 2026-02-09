from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.webinar import Webinar
from app.schemas.webinar import WebinarResponse

router = APIRouter()

@router.get("/", response_model=List[WebinarResponse])
def list_webinars(db: Session = Depends(get_db)):
    return db.query(Webinar).order_by(Webinar.date_time.desc()).all()

@router.get("/{id}", response_model=WebinarResponse)
def get_webinar(id: int, db: Session = Depends(get_db)):
    webinar = db.query(Webinar).filter(Webinar.id == id).first()
    if not webinar:
        raise HTTPException(status_code=404, detail="Webinar not found")
    return webinar
