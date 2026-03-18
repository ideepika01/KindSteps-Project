# Handles Incident Reporting and Case Management

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


# Convert uploaded image to base64
def convert_to_b64(photo: UploadFile):
    if not photo:
        return None
    return base64.b64encode(photo.file.read()).decode("utf-8")


# Check if user is admin or rescue team
def check_staff(user: User):
    if user.role not in [UserRole.admin, UserRole.rescue_team]:
        raise HTTPException(status_code=403, detail="Access denied")


# AI image analysis
@router.post("/ai-analyze")
async def ai_analyze(
    photo: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    return analyze_image_for_description(
        await photo.read(), mime_type=photo.content_type
    )


# Create new report
@router.post("/", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def create_report(
    condition: str = Form(...),
    description: str = Form(...),
    location: str = Form(...),
    contact_name: str = Form(...),
    contact_phone: str = Form(...),
    priority: ReportPriority = Form(ReportPriority.medium),
    photo: UploadFile = File(None),
    latitude: Optional[str] = Form(None),
    longitude: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    team = db.query(User).filter(User.email == "team@kindsteps.com").first()

    report = Report(
        reporter_id=current_user.id,
        condition=condition,
        description=description,
        location=location,
        contact_name=contact_name,
        contact_phone=contact_phone,
        priority=priority.value,
        latitude=latitude,
        longitude=longitude,
        photo_url=convert_to_b64(photo),
        status=ReportStatus.received.value,
        assigned_team_id=team.id if team else None,
    )

    db.add(report)
    db.commit()
    db.refresh(report)

    return report


# Get reports
@router.get("/", response_model=List[ReportResponse])
def list_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    if current_user.role == UserRole.user:
        return db.query(Report).filter(Report.reporter_id == current_user.id).all()

    return db.query(Report).all()


# Get reports assignments (Move above generic ID route)
@router.get("/my-assignments", response_model=List[ReportResponse])
def my_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_staff(current_user)
    return db.query(Report).filter(Report.assigned_team_id == current_user.id).all()


# Get report by ID
@router.get("/{id}", response_model=ReportResponse)
def get_report(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = db.query(Report).filter(Report.id == id).first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if current_user.role == UserRole.user and report.reporter_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return report




# Update report
@router.put("/{id}", response_model=ReportResponse)
def update_report(
    id: int,
    report_update: ReportUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    check_staff(current_user)

    report = db.query(Report).filter(Report.id == id).first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    for key, value in report_update.model_dump(exclude_unset=True).items():
        setattr(report, key, value.value if hasattr(value, "value") else value)

    db.commit()
    db.refresh(report)

    return report
