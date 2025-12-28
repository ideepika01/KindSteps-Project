from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.report import Report, ReportStatus
from app.schemas.user import UserResponse
from app.dependencies import get_current_user
from app.schemas.report import ReportResponse

router = APIRouter()

def require_admin(user: User) -> None:
    if user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Not authorized (Admins only)")

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.admin, UserRole.rescue_team]:
        raise HTTPException(status_code=403, detail="Not authorized")

    total_reports = db.query(Report).count()
    completed = db.query(Report).filter(Report.status == ReportStatus.resolved).count()
    active = db.query(Report).filter(Report.status == ReportStatus.active).count()
    pending = db.query(Report).filter(Report.status == ReportStatus.received).count()

    total_users = db.query(User).count()
    volunteers = db.query(User).filter(User.role == UserRole.rescue_team).count()

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

@router.get("/users", response_model=List[UserResponse])
def get_all_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    require_admin(current_user)
    return db.query(User).all()

@router.get("/reports", response_model=List[ReportResponse])
def get_all_reports_for_admin(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    require_admin(current_user)
    return db.query(Report).all()
