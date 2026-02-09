# Admin Router: Handles administrative functions and system statistics.
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


# ===== ROLE CHECK HELPERS =====

def admin_only(user: User):
    if user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admins only")


def admin_or_rescue(user: User):
    if user.role not in [UserRole.admin, UserRole.rescue_team]:
        raise HTTPException(status_code=403, detail="Not authorized")


# ===== DASHBOARD STATS =====

@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    admin_or_rescue(current_user)

    return {
        "reports": {
            "total": db.query(Report).count(),
            "resolved": db.query(Report)
                .filter(Report.status == ReportStatus.resolved).count(),
            "active": db.query(Report)
                .filter(Report.status == ReportStatus.active).count(),
            "in_progress": db.query(Report)
                .filter(Report.status == ReportStatus.in_progress).count(),
            "received": db.query(Report)
                .filter(Report.status == ReportStatus.received).count(),
        },
        "users": {
            "total": db.query(User).count(),
            "volunteers": db.query(User)
                .filter(User.role == UserRole.rescue_team).count(),
        }
    }


# ===== USERS (ADMIN) =====

@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    admin_only(current_user)
    return db.query(User).all()


# ===== REPORTS (ADMIN) =====

@router.get("/reports", response_model=List[ReportResponse])
def get_all_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    admin_only(current_user)
    return db.query(Report).all()
