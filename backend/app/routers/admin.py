from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.report import Report, ReportStatus
from app.schemas.user import UserResponse
from app.dependencies import get_current_user

router = APIRouter()

def check_admin(user: User):
    if user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Not authorized")

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    check_admin(current_user)
    
    total_reports = db.query(Report).count()
    completed_reports = db.query(Report).filter(Report.status == ReportStatus.resolved).count()
    active_reports = db.query(Report).filter(Report.status == ReportStatus.active).count() # or in_progress + active
    pending_reports = db.query(Report).filter(Report.status == ReportStatus.received).count()
    
    total_users = db.query(User).count()
    active_volunteers = db.query(User).filter(User.role == UserRole.rescue_team).count()
    
    return {
        "reports": {
            "total": total_reports,
            "completed": completed_reports,
            "active": active_reports,
            "pending": pending_reports
        },
        "users": {
            "total": total_users,
            "volunteers": active_volunteers
        }
    }

@router.get("/users", response_model=List[UserResponse])
def get_all_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    check_admin(current_user)
    users = db.query(User).all()
    return users
