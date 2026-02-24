# Reports Router - Handles Incident Reporting and Case Management
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

# --- HELPERS ---


# Convert an uploaded image file to a Base64 string for database storage
def convert_to_b64(photo: UploadFile):
    if not photo:
        return None
    content = photo.file.read()
    b64_str = base64.b64encode(content).decode("utf-8")
    return f"data:{photo.content_type or 'image/jpeg'};base64,{b64_str}"


# Verify if the user is an admin or part of the rescue team
def check_staff(user: User):
    if user.role not in (UserRole.admin, UserRole.rescue_team):
        raise HTTPException(403, "Access denied")


# --- ROUTES ---


# Use AI to automatically describe an uploaded photo (Rescue Assistance)
@router.post("/ai-analyze")
async def ai_analyze(
    photo: UploadFile = File(...), current_user: User = Depends(get_current_user)
):
    return analyze_image_for_description(
        await photo.read(), mime_type=photo.content_type
    )


# Create a new rescue report (Incident Submission)
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
    try:
        new_report = Report(
            reporter_id=current_user.id,
            condition=condition,
            description=description,
            location=location,
            contact_name=contact_name,
            contact_phone=contact_phone,
            priority=priority.value if hasattr(priority, "value") else priority,
            latitude=latitude,
            longitude=longitude,
            photo_url=convert_to_b64(photo),
            status=ReportStatus.received.value,
        )
        db.add(new_report)
        db.commit()
        db.refresh(new_report)
        return new_report
    except Exception as e:
        raise HTTPException(500, f"Error creating report: {str(e)}")


# Get all reports (Users see their own, Staff see everything)
@router.get("/", response_model=List[ReportResponse])
def list_reports(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    if current_user.role == UserRole.user:
        return db.query(Report).filter(Report.reporter_id == current_user.id).all()
    return db.query(Report).all()


# Get a specific report's details by ID
@router.get("/{id}", response_model=ReportResponse)
def get_report(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = db.query(Report).filter(Report.id == id).first()
    if not report:
        raise HTTPException(404, "Report not found")
    if current_user.role == UserRole.user and report.reporter_id != current_user.id:
        raise HTTPException(403, "Access denied")
    return report


# Track a report's progress (Direct alias for get_report)
@router.get("/track/{id}", response_model=ReportResponse)
def track_report(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_report(id, db, current_user)


# Update a report's status or assigned team (Staff only)
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
        raise HTTPException(404, "Report not found")

    for key, val in report_update.model_dump(exclude_unset=True).items():
        setattr(report, key, val)

    db.commit()
    db.refresh(report)
    return report
