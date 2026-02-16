from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List, Optional
import base64

from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.report import Report, ReportStatus, ReportPriority
from app.models.user import User, UserRole
from app.schemas.report import ReportResponse, ReportUpdate
from app.core.ai import analyze_image_for_description

router = APIRouter()


# -------- AI Analysis --------


@router.post("/ai-analyze")
async def ai_analyze_report(
    photo: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    Analyzes an uploaded image and returns a text description.
    """
    content = await photo.read()
    analysis = analyze_image_for_description(content)
    return analysis


# Convert uploaded file to base64 string
def file_to_base64(file: UploadFile):
    if not file:
        return None

    content = file.file.read()
    encoded = base64.b64encode(content).decode("utf-8")
    return encoded


# -------- Create Report --------


@router.post("/", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def create_report(
    condition: str = Form(...),
    description: str = Form(...),
    location: str = Form(...),
    location_details: Optional[str] = Form(None),
    contact_name: str = Form(...),
    contact_phone: str = Form(...),
    priority: ReportPriority = Form(ReportPriority.medium),
    latitude: Optional[str] = Form(None),
    longitude: Optional[str] = Form(None),
    photo: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    photo_data = file_to_base64(photo)

    team = db.query(User).filter(User.email == "team@kindsteps.com").first()

    report = Report(
        reporter_id=current_user.id,
        condition=condition,
        description=description,
        location=location,
        location_details=location_details,
        contact_name=contact_name,
        contact_phone=contact_phone,
        priority=priority,
        latitude=latitude,
        longitude=longitude,
        photo_url=photo_data,
        status=ReportStatus.received,
        assigned_team_id=team.id if team else None,
    )

    db.add(report)
    db.commit()
    db.refresh(report)

    return report


# -------- List Reports --------


@router.get("/", response_model=List[ReportResponse])
def list_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    # Normal user sees only their reports
    if current_user.role == UserRole.user:
        return db.query(Report).filter(Report.reporter_id == current_user.id).all()

    # Admin and rescue team see all reports
    return db.query(Report).all()


# -------- My Assignments --------


@router.get("/my-assignments", response_model=List[ReportResponse])
def my_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    if current_user.role not in (UserRole.admin, UserRole.rescue_team):
        raise HTTPException(status_code=403, detail="Access denied")

    return db.query(Report).filter(Report.assigned_team_id == current_user.id).all()


# -------- Get Single Report --------


@router.get("/{id}", response_model=ReportResponse)
def get_report(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    report = db.query(Report).filter(Report.id == id).first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Normal user can only see their own report
    if current_user.role == UserRole.user and report.reporter_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return report


# -------- Track Report --------


@router.get("/track/{id}", response_model=ReportResponse)
def track_report(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Alias for get_report for tracking page compatibility."""
    return get_report(id, db, current_user)


# -------- Update Report --------


@router.put("/{id}", response_model=ReportResponse)
def update_report(
    id: int,
    report_update: ReportUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    if current_user.role not in (UserRole.admin, UserRole.rescue_team):
        raise HTTPException(status_code=403, detail="Only staff can update")

    report = db.query(Report).filter(Report.id == id).first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Update only provided fields
    update_data = report_update.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(report, key, value)

    db.commit()
    db.refresh(report)

    return report
