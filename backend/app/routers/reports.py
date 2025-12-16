# =========================================================
# REPORTS ROUTER
# Handles:
# 1. Submitting a new report (with photo)
# 2. Viewing reports
# 3. Tracking status
# 4. Updating status (Rescue Team)
# =========================================================

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

# HELPER: Save Uploaded Photo
def _save_upload(file: UploadFile | None) -> Optional[str]:
    """saves the file to 'uploads/' and returns the URL path."""
    if not file:
        return None

    # explicit unique naming
    file_extension = file.filename.split(".")[-1]
    unique_name = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)
    
    # Write to disk
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return f"/uploads/{unique_name}"


# ---------------------------------------------------------
# 1. SUBMIT REPORT
# ---------------------------------------------------------
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
    """
    Saves a new report to the database.
    Note: We use 'Form(...)' instead of JSON because we might be uploading a photo.
    """
    
    # 1. Handle Photo Upload
    photo_url = _save_upload(photo)

    # 2. Create Report Object
    new_report = Report(
        reporter_id=current_user.id,
        condition=condition,
        description=description,
        location=location,
        contact_name=contact_name,
        contact_phone=contact_phone,
        priority=priority,
        photo_url=photo_url
        # status and created_at are set automatically
    )
    
    # 3. Save to DB
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    
    return new_report

# ---------------------------------------------------------
# 2. LIST REPORTS (For Dashboard)
# ---------------------------------------------------------
@router.get("/", response_model=List[ReportResponse])
def list_reports(
    status: Optional[ReportStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a list of reports.
    - Rescue Team / Admin: Can see ALL reports.
    - Regular Users: Can ONLY see reports they submitted.
    """
    
    # Filter for regular users
    if current_user.role == UserRole.user:
         return db.query(Report).filter(Report.reporter_id == current_user.id).all()
    
    # Team/Admin can see everyone's reports
    query = db.query(Report)
    
    # Optional filtering by status (e.g. ?status=received)
    if status:
        query = query.filter(Report.status == status)
        
    return query.all()

# ---------------------------------------------------------
# 3. GET SINGLE REPORT
# ---------------------------------------------------------
@router.get("/{id}", response_model=ReportResponse)
def get_report(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get details of ONE specific report."""
    report = db.query(Report).filter(Report.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    # Optional: Logic to prevent users from seeing others' reports if sensitive
    # For now, we allow reading if you have the ID (common for sharing).
    # But strictly, we should probably check ownership if user.role == 'user'.
    
    return report

# ---------------------------------------------------------
# 4. TRACK STATUS (Public/Authenticated)
# ---------------------------------------------------------
@router.get("/track/{id}")
def track_report_status(id: int, db: Session = Depends(get_db)):
    """
    Simple check to see the status of a report. 
    Does NOT require login (Public Tracking).
    """
    report = db.query(Report).filter(Report.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    # Only return safe info
    return {"id": report.id, "status": report.status}

# ---------------------------------------------------------
# 5. UPDATE STATUS (Rescue Team Only)
# ---------------------------------------------------------
@router.put("/{id}/status", response_model=ReportResponse)
def update_report_status(
    id: int, 
    status_update: ReportStatusUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Change the status (e.g., received -> in_progress -> resolved).
    Only Rescue Team and Admin can do this.
    """
    # 1. Check permissions
    if current_user.role not in [UserRole.rescue_team, UserRole.admin]:
        raise HTTPException(status_code=403, detail="Not authorized to update status")
        
    # 2. Find Report
    report = db.query(Report).filter(Report.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    # 3. Update Status
    report.status = status_update.status
    
    # 4. Save
    db.commit()
    db.refresh(report)
    return report


# ---------------------------------------------------------
# 6. MY ASSIGNMENTS (For Rescue Team Dashboard)
# ---------------------------------------------------------
@router.get("/my-assignments", response_model=List[ReportResponse])
def get_my_assignments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Returns reports assigned to the current rescue team member OR active reports.
    (Simplified logic: Show all 'active' or 'in_progress' reports for any team member to pick up)
    """
    if current_user.role != UserRole.rescue_team:
         return [] # Or error

    # Show reports that are in progress or active
    # In a real app, we filter by Report.assigned_team_id == current_user.id
    # But here we treat it as a pool of tasks.
    return db.query(Report).filter(Report.status.in_([ReportStatus.active, ReportStatus.in_progress])).all()
