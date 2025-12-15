"""Admin-only endpoints used for dashboard and user management."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.report import Report, ReportStatus
from app.schemas.user import UserResponse
from app.dependencies import get_current_user

router = APIRouter()


def require_admin(user: User) -> None:
    """Raise an HTTP 403 if the user is not an admin."""
    if user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Not authorized")

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Return simple summary stats for admin dashboards."""
    require_admin(current_user)

    total_reports = db.query(Report).count()
    completed_reports = db.query(Report).filter(Report.status == ReportStatus.resolved).count()
    active_reports = db.query(Report).filter(Report.status == ReportStatus.active).count()
    pending_reports = db.query(Report).filter(Report.status == ReportStatus.received).count()

    total_users = db.query(User).count()
    active_volunteers = db.query(User).filter(User.role == UserRole.rescue_team).count()

    return {
        "reports": {
            "total": total_reports,
            "completed": completed_reports,
            "active": active_reports,
            "pending": pending_reports,
        },
        "users": {
            "total": total_users,
            "volunteers": active_volunteers,
        },
    }

@router.get("/users", response_model=List[UserResponse])
def get_all_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> List[User]:
    """Return all users. Admin-only."""
    require_admin(current_user)
    return db.query(User).all()
