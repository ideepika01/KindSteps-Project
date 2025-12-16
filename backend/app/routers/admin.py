# =========================================================
# ADMIN ROUTER
# Endpoints specifically for the Admin Dashboard.
# =========================================================

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.report import Report, ReportStatus
from app.schemas.user import UserResponse
from app.dependencies import get_current_user

router = APIRouter()

# HELPER: Check if user is Admin
def require_admin(user: User) -> None:
    """Stops the request if the user is not an admin."""
    if user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Not authorized (Admins only)")

# ---------------------------------------------------------
# 1. DASHBOARD STATISTICS
# ---------------------------------------------------------
@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Returns counts of reports and users for the dashboard charts.
    """
    # 1. Check Permission
    require_admin(current_user)

    # 2. Count Reports
    total_reports = db.query(Report).count()
    completed = db.query(Report).filter(Report.status == ReportStatus.resolved).count()
    active = db.query(Report).filter(Report.status == ReportStatus.active).count()
    pending = db.query(Report).filter(Report.status == ReportStatus.received).count()

    # 3. Count Users
    total_users = db.query(User).count()
    volunteers = db.query(User).filter(User.role == UserRole.rescue_team).count()

    # 4. Return as JSON
    return {
        "reports": {
            "total": total_reports,
            "completed": completed,
            "active": active,
            "pending": pending,
        },
        "users": {
            "total": total_users,
            "volunteers": volunteers,
        },
    }

# ---------------------------------------------------------
# 2. LIST ALL REPORTS (Already in reports.py, but specific admin view logic could go here)
# ---------------------------------------------------------
# Note: Admin usually uses the main /reports endpoint, but let's keep a user list endpoint.

@router.get("/users", response_model=List[UserResponse])
def get_all_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """List all registered users (Admin only)."""
    require_admin(current_user)
    return db.query(User).all()
# ---------------------------------------------------------
# 3. ADMIN LIST ALL REPORTS ENDPOINT - ADDED FOR COMPLETENESS
# ---------------------------------------------------------
@router.get("/reports")
def get_all_reports_for_admin(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    require_admin(current_user)
    return db.query(Report).all()
