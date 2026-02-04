from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List, Optional
import base64

from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.report import Report, ReportStatus, ReportPriority
from app.models.user import User, UserRole
from app.schemas.report import ReportResponse, ReportStatusUpdate, ReportUpdate

router = APIRouter()


# -------- HELPER --------
def file_to_base64(file: UploadFile | None) -> Optional[str]:
    if not file:
        return None

    content = file.file.read()
    encoded = base64.b64encode(content).decode("utf-8")
    mime = file.content_type or "image/jpeg"
    return f"data:{mime};base64,{encoded}"


# -------- CREATE REPORT --------
@router.post("/", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def create_report(
    condition: str = Form(...),
    description: str = Form(...),
    location: str = Form(...),
    contact_name: str = Form(...),
    contact_phone: str = Form(...),
    priority: ReportPriority = Form(ReportPriority.medium),
    photo: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    photo_url = file_to_base64(photo)

    report = Report(
        reporter_id=current_user.id,
        condition=condition,
        description=description,
        location=location,
        contact_name=contact_name,
        contact_phone=contact_phone,
        priority=priority,
        photo_url=photo_url
    )

    db.add(report)
    db.commit()
    db.refresh(report)

    return report


# -------- LIST REPORTS --------
@router.get("/", response_model=List[ReportResponse])
def list_reports(
    status: Optional[ReportStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Normal users see only their reports
    if current_user.role == UserRole.user:
        return db.query(Report)\
                 .filter(Report.reporter_id == current_user.id)\
                 .all()

    # Admin / Rescue Team see all
    query = db.query(Report)
    if status:
        query = query.filter(Report.status == status)

    return query.all()


# -------- RESCUE TEAM ASSIGNMENTS --------
@router.get("/my-assignments", response_model=List[ReportResponse])
def my_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.rescue_team:
        raise HTTPException(status_code=403, detail="Not authorized")

    active_statuses = [
        ReportStatus.received,
        ReportStatus.active,
        ReportStatus.in_progress
    ]

    return db.query(Report)\
             .filter(Report.status.in_(active_statuses))\
             .all()


# -------- SINGLE REPORT --------
@router.get("/{id}", response_model=ReportResponse)
def get_report(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = db.query(Report).filter(Report.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    return report


# -------- PUBLIC TRACKING --------
@router.get("/track/{id}", response_model=ReportResponse)
def track_report(
    id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = db.query(Report).filter(Report.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Security check: Only owner, admin, or rescue team can track
    if current_user.role == UserRole.user and report.reporter_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only track your own reports")

    return report


# -------- UPDATE REPORT (ADMIN/TEAM) --------
@router.put("/{id}", response_model=ReportResponse)
def update_report(
    id: int,
    report_update: ReportUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.admin, UserRole.rescue_team]:
        raise HTTPException(status_code=403, detail="Not authorized")

    report = db.query(Report).filter(Report.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Update fields if provided
    update_data = report_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(report, key, value)

    db.commit()
    db.refresh(report)
    return report
