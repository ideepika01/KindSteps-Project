# Admin Router - Handles Management and Global Statistics
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.user import User, UserRole
from app.models.report import Report, ReportStatus
from app.schemas.user import UserResponse
from app.schemas.report import ReportResponse

router = APIRouter()

# --- SECURITY HELPERS ---


# Ensure only administrators can access a route
def require_admin(user: User):
    if user.role != UserRole.admin.value:
        raise HTTPException(status_code=403, detail="Admins only")


# Ensure only admins or rescue team members can access a route
def require_staff(user: User):
    if user.role not in [UserRole.admin.value, UserRole.rescue_team.value]:
        raise HTTPException(status_code=403, detail="Access denied")


# --- ADMIN ROUTES ---


# Get public statistics about reports and rescues for the landing page
@router.get("/public/stats")
def get_public_stats(db: Session = Depends(get_db)):
    return {
        "total_reports": db.query(Report).count(),
        "total_rescues": db.query(Report).filter(Report.status == "resolved").count(),
        "active_missions": db.query(Report)
        .filter(Report.status == "in_progress")
        .count(),
        "volunteers_online": db.query(User)
        .filter(User.role == UserRole.rescue_team)
        .count(),
    }


# Get detailed dashboard statistics for staff members
@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    require_staff(current_user)
    return {
        "reports": {
            "total": db.query(Report).count(),
            "resolved": db.query(Report)
            .filter(Report.status == ReportStatus.resolved.value)
            .count(),
            "active": db.query(Report)
            .filter(Report.status == ReportStatus.active.value)
            .count(),
            "received": db.query(Report)
            .filter(Report.status == ReportStatus.received.value)
            .count(),
            "in_progress": db.query(Report)
            .filter(Report.status == ReportStatus.in_progress.value)
            .count(),
        },
        "users": {
            "total": db.query(User).count(),
            "volunteers": db.query(User)
            .filter(User.role == UserRole.rescue_team)
            .count(),
        },
    }


# Retrieve a list of all registered users (Admin only)
@router.get("/users", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    require_admin(current_user)
    return db.query(User).all()


# Retrieve a list of all submitted rescue reports (Admin only)
@router.get("/reports", response_model=List[ReportResponse])
def list_all_reports(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    require_admin(current_user)
    return db.query(Report).all()


# Assign a specific report to a rescue team (Admin only)
@router.post("/reports/{report_id}/assign")
def assign_report(
    report_id: int,
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_admin(current_user)
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(404, "Report not found")

    team = (
        db.query(User)
        .filter(User.id == team_id, User.role == UserRole.rescue_team)
        .first()
    )
    if not team:
        raise HTTPException(400, "Invalid team ID")

    report.assigned_team_id, report.status = team_id, "in_progress"
    db.commit()
    db.refresh(report)
    return {"message": f"Assigned to {team.full_name}", "report_id": report.id}


# Delete a user account from the platform (Admin only)
@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_admin(current_user)
    if user_id == current_user.id:
        raise HTTPException(400, "Cannot delete yourself")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    if user.email == "team@kindsteps.com":
        raise HTTPException(400, "Cannot delete default team")

    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}


# Delete a rescue report from the platform (Admin only)
@router.delete("/reports/{report_id}")
def delete_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_admin(current_user)
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(404, "Report not found")

    db.delete(report)
    db.commit()
    return {"message": "Report deleted successfully"}
