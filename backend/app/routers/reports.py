from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.models.report import Report, ReportStatus, ReportPriority
from app.models.user import User, UserRole
from app.schemas.report import ReportResponse, ReportStatusUpdate
from app.dependencies import get_current_user
import shutil
import os
import uuid

# Setup upload folder
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter()

def _save_upload(file: UploadFile | None) -> Optional[str]:
    """saves the file to 'uploads/' and returns the URL path."""
    if not file:
        return None

    file_extension = file.filename.split(".")[-1]
    unique_name = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return f"/uploads/{unique_name}"


@router.post("/", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def create_report(
    condition: str = Form(...),
    description: str = Form(...),
    location: str = Form(...),
    contact_name: str = Form(...),
    contact_phone: str = Form(...),
    priority: ReportPriority = Form(ReportPriority.medium),
    photo: UploadFile = File(None), # Optional
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    photo_url = _save_upload(photo)

    new_report = Report(
        reporter_id=current_user.id,
        condition=condition,
        description=description,
        location=location,
        contact_name=contact_name,
        contact_phone=contact_phone,
        priority=priority,
        photo_url=photo_url
    )
    
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    
    return new_report

@router.get("/", response_model=List[ReportResponse])
def list_reports(
    status: Optional[ReportStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == UserRole.user:
         return db.query(Report).filter(Report.reporter_id == current_user.id).all()
    
    query = db.query(Report)
    
    if status:
        query = query.filter(Report.status == status)
        
    return query.all()

@router.get("/my-assignments", response_model=List[ReportResponse])
def get_my_assignments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.rescue_team:
         return [] 

    return db.query(Report).filter(Report.status.in_([ReportStatus.received, ReportStatus.active, ReportStatus.in_progress])).all()

@router.get("/{id}", response_model=ReportResponse)
def get_report(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    report = db.query(Report).filter(Report.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    return report

@router.get("/track/{id}")
def track_report_status(id: int, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    return {"id": report.id, "status": report.status}

@router.put("/{id}/status", response_model=ReportResponse)
def update_report_status(
    id: int, 
    status_update: ReportStatusUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.rescue_team, UserRole.admin]:
        raise HTTPException(status_code=403, detail="Not authorized to update status")
        
    report = db.query(Report).filter(Report.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    report.status = status_update.status
    
    db.commit()
    db.refresh(report)
    return report



