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


# -------- HELPER FUNCTIONS --------


def convert_file_to_base64(photo: UploadFile):

    if not photo:
        return None

    content = photo.file.read()
    mime_type = photo.content_type or "image/jpeg"
    b64_str = base64.b64encode(content).decode("utf-8")
    return f"data:{mime_type};base64,{b64_str}"


def get_default_team(db: Session):

    return db.query(User).filter(User.email == "team@kindsteps.com").first()


def get_report_or_404(db: Session, report_id: int):

    report = db.query(Report).filter(Report.id == report_id).first()

    if not report:
        raise HTTPException(404, "Report not found")

    return report


def check_staff_access(user: User):

    if user.role not in (UserRole.admin, UserRole.rescue_team):
        raise HTTPException(403, "Access denied")


# -------- AI ANALYZE --------


@router.post("/ai-analyze")
async def ai_analyze_report(
    photo: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    print(f"DEBUG: AI Analyze endpoint hit by user: {current_user.email}")
    content = await photo.read()

    mime_type = photo.content_type or "image/jpeg"
    result = analyze_image_for_description(content, mime_type=mime_type)
    print(f"DEBUG: AI Analysis Result: {str(result)[:200]}...")
    return result


# -------- CREATE REPORT --------


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

    try:
        photo_data = convert_file_to_base64(photo)

        team = get_default_team(db)

        report = Report(
            reporter_id=current_user.id,
            condition=condition,
            description=description,
            location=location,
            location_details=location_details,
            contact_name=contact_name,
            contact_phone=contact_phone,
            priority=priority.value if hasattr(priority, "value") else priority,
            latitude=latitude,
            longitude=longitude,
            photo_url=photo_data,
            status=ReportStatus.received.value,
            assigned_team_id=team.id if team else None,
        )

        db.add(report)
        db.commit()
        db.refresh(report)

        return report

    except Exception as e:
        print(f"CRITICAL ERROR creating report: {str(e)}")
        import traceback

        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Failed to create report: {str(e)}"
        )


# -------- LIST REPORTS --------


@router.get("/", response_model=List[ReportResponse])
def list_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    if current_user.role == UserRole.user:
        return db.query(Report).filter(Report.reporter_id == current_user.id).all()

    return db.query(Report).all()


# -------- MY ASSIGNMENTS --------


@router.get("/my-assignments", response_model=List[ReportResponse])
def my_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    check_staff_access(current_user)

    return db.query(Report).filter(Report.assigned_team_id == current_user.id).all()


# -------- GET REPORT --------


@router.get("/{id}", response_model=ReportResponse)
def get_report(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    report = get_report_or_404(db, id)

    if current_user.role == UserRole.user:
        if report.reporter_id != current_user.id:
            raise HTTPException(403, "Access denied")

    return report


# -------- TRACK REPORT --------


@router.get("/track/{id}", response_model=ReportResponse)
def track_report(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    return get_report(id, db, current_user)


# -------- UPDATE REPORT --------


@router.put("/{id}", response_model=ReportResponse)
def update_report(
    id: int,
    report_update: ReportUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    check_staff_access(current_user)

    report = get_report_or_404(db, id)

    update_data = report_update.model_dump(exclude_unset=True)

    for key in update_data:
        setattr(report, key, update_data[key])

    db.commit()
    db.refresh(report)

    return report
