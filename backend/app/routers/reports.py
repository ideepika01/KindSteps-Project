# This router handles all the core tasks for reports, like submitting a new case and tracking its status.
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

# Helper function to turn an uploaded photo into a format our database can store easily
def file_to_base64(file: UploadFile | None) -> Optional[str]:
    if not file:
        return None
    content = file.file.read()
    encoded = base64.b64encode(content).decode("utf-8")
    mime = file.content_type or "image/jpeg"
    return f"data:{mime};base64,{encoded}"

# Creating a brand new rescue report from the citizen form
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

    # We automatically assign new cases to "Team Alpha" for immediate attention
    team = db.query(User).filter(User.email == "team@kindsteps.com").first()
    team_id = team.id if team else None

    report = Report(
        reporter_id=current_user.id,
        condition=condition,
        description=description,
        location=location,
        contact_name=contact_name,
        contact_phone=contact_phone,
        priority=priority,
        photo_url=photo_url,
        assigned_team_id=team_id
    )

    db.add(report)
    db.commit()
    db.refresh(report)
    return report

# Showing a list of reports, usually limited to just the ones you filed yourself
@router.get("/", response_model=List[ReportResponse])
def list_reports(
    status: Optional[ReportStatus] = None,
    all_reports: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Unless otherwise asked, we only show you your own personal reports
    if not all_reports:
        return db.query(Report).filter(Report.reporter_id == current_user.id).all()

    # Admins and Rescue Teams can see everything if they use the right filter
    if current_user.role not in [UserRole.admin, UserRole.rescue_team]:
        raise HTTPException(status_code=403, detail="You can only view your own report history.")

    query = db.query(Report)
    if status:
        query = query.filter(Report.status == status)

    return query.all()

# Providing rescue team members with a list of the specific cases assigned to them
@router.get("/my-assignments", response_model=List[ReportResponse])
def my_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Both staff and admins can view assignments (admins see their own if assigned, or others via admin dash)
    if current_user.role not in [UserRole.rescue_team, UserRole.admin]:
        raise HTTPException(status_code=403, detail="Assignments are only visible to staff.")

    from fastapi.responses import JSONResponse
    from fastapi.encoders import jsonable_encoder
    
    assignments = db.query(Report).filter(Report.assigned_team_id == current_user.id).all()
    
    # We return a JSONResponse with No-Cache headers to ensure the browser doesn't show old data
    return JSONResponse(
        content=jsonable_encoder(assignments),
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        }
    )

# Fetching the details for a single specific report
@router.get("/{id}", response_model=ReportResponse)
def get_report(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = db.query(Report).filter(Report.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="We couldn't find a report with that ID.")

    # Only the person who filed it or the staff can see the details
    if current_user.role == UserRole.user and report.reporter_id != current_user.id:
        raise HTTPException(status_code=403, detail="You don't have permission to view this report.")

    return report

# Allowing citizens to track a report's progress using its unique ID
@router.get("/track/{id}", response_model=ReportResponse)
def track_report(
    id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = db.query(Report).filter(Report.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="That tracking ID doesn't appear to be valid.")

    # For safety, you must be the owner of the report to track its live status
    if current_user.role == UserRole.user and report.reporter_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only track reports that you personally filed.")

    return report

# Letting admins and teams update a report (like changing the status or adding notes)
@router.put("/{id}", response_model=ReportResponse)
def update_report(
    id: int,
    report_update: ReportUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only staff and admins can make changes to case files
    if current_user.role not in [UserRole.admin, UserRole.rescue_team]:
        raise HTTPException(status_code=403, detail="Only rescue staff can update report details.")

    report = db.query(Report).filter(Report.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="We couldn't find that report to update it.")

    # Updating the fields with the new information provided
    update_data = report_update.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        if key == "status" and value:
            # Explicitly use the status value as a lowercase string
            old_status = report.status
            new_status = str(value.value if hasattr(value, 'value') else value).lower().strip()
            report.status = new_status
            print(f"REPORT UPDATE: ID {id} | {old_status} -> {new_status}")
        else:
            setattr(report, key, value)

    # Save the changes
    db.commit()
    db.refresh(report)
    return report
