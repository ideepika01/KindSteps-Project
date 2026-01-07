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
import pathlib
import base64

# Setup upload folder (Kept for compatibility, though we use Base64 now)
UPLOAD_DIR = "/tmp/uploads" if os.environ.get("VERCEL") or not os.access("/", os.W_OK) else "uploads"
try:
    os.makedirs(UPLOAD_DIR, exist_ok=True)
except Exception:
    pass

router = APIRouter()

def _file_to_base64(file: UploadFile) -> Optional[str]:
    """
    Converts an uploaded file to a Base64 string for database storage.
    This avoids filesystem issues on Vercel.
    """
    if not file:
        return None
    
    try:
        # Read file content
        content = file.file.read()
        
        # Convert to base64
        encoded_string = base64.b64encode(content).decode("utf-8")
        
        # Determine mime type (default to jpeg if unknown)
        mime_type = file.content_type or "image/jpeg"
        
        # Return full data URI
        return f"data:{mime_type};base64,{encoded_string}"
    except Exception as e:
        print(f"Error processing image: {e}")
        return None


@router.post("/", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def create_report(
    condition: str = Form(...),
    description: str = Form(...),
    location: str = Form(...),
    contact_name: str = Form(...),
    contact_phone: str = Form(...),
    priority: ReportPriority = Form(ReportPriority.medium),
    photo: UploadFile = File(None), 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new report of an injured animal.
    Anyone logged in can create a report.
    """
    # Convert photo to Base64 string directly
    photo_url = _file_to_base64(photo) if photo else None

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
    """
    List reports.
    - Regular users: See only their own reports.
    - Admin/Rescue Team: See all reports (optionally filtered by status).
    """
    if current_user.role == UserRole.user:
         return db.query(Report).filter(Report.reporter_id == current_user.id).all()
    
    query = db.query(Report)
    
    if status:
        query = query.filter(Report.status == status)
        
    return query.all()

@router.get("/my-assignments", response_model=List[ReportResponse])
def get_my_assignments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Get reports relevant to the Rescue Team (Received, Active, In Progress).
    Only accessible by Rescue Team members.
    """
    if current_user.role != UserRole.rescue_team:
         return [] 

    # Filter for active statuses
    active_statuses = [ReportStatus.received, ReportStatus.active, ReportStatus.in_progress]
    return db.query(Report).filter(Report.status.in_(active_statuses)).all()

@router.get("/{id}", response_model=ReportResponse)
def get_report(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Get details of a specific report by ID.
    """
    report = db.query(Report).filter(Report.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    return report

@router.get("/track/{id}")
def track_report_status(id: int, db: Session = Depends(get_db)):
    """
    Public endpoint to track the status of a report by ID.
    No login required.
    """
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
    """
    Update the status of a report.
    Only Admin and Rescue Team can perform this action.
    """
    if current_user.role not in [UserRole.rescue_team, UserRole.admin]:
        raise HTTPException(status_code=403, detail="Not authorized to update status")
        
    report = db.query(Report).filter(Report.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    report.status = status_update.status
    
    db.commit()
    db.refresh(report)
    return report



