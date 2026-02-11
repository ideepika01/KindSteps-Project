# This router handles all the "behind the scenes" admin work like checking stats.
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

# Making sure only real admins can access certain parts of the site
def admin_only(user: User):
    if user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Sorry, this section is for admins only.")

# Allowing both admins and rescue staff to see core data
def admin_or_rescue(user: User):
    if user.role not in [UserRole.admin, UserRole.rescue_team]:
        raise HTTPException(status_code=403, detail="You don't have permission to view this.")

# Gathering all the numbers for the dashboard (Total Reports, Active Cases, etc.)
@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    admin_or_rescue(current_user)

    return {
        "reports": {
            "total": db.query(Report).count(),
            "resolved": db.query(Report).filter(Report.status == "resolved").count(),
            "active": db.query(Report).filter(Report.status == "active").count(),
            "in_progress": db.query(Report).filter(Report.status == "in_progress").count(),
            "received": db.query(Report).filter(Report.status == "received").count(),
        },
        "users": {
            "total": db.query(User).count(),
            "volunteers": db.query(User).filter(User.role == "rescue_team").count(),
        }
    }

# Fetching a list of every user registered in our system
@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    admin_only(current_user)
    return db.query(User).all()

# Pulling up every single report ever filed
@router.get("/reports", response_model=List[ReportResponse])
def get_all_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    admin_only(current_user)
    return db.query(Report).all()
