from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.user import User, UserRole
from app.models.report import Report
from app.schemas.user import UserResponse
from app.schemas.report import ReportResponse

router = APIRouter()


# -------- Public Impact Stats --------


@router.get("/public/stats")
def get_public_stats(db: Session = Depends(get_db)):
    """Anonymized stats for the home page."""
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


# -------- Dashboard Stats --------


@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Allow only admin or rescue team
    if current_user.role not in [UserRole.admin, UserRole.rescue_team]:
        raise HTTPException(status_code=403, detail="Access denied")

    return {
        "reports": {
            "total": db.query(Report).count(),  # Total reports
            "resolved": db.query(Report).filter(Report.status == "resolved").count(),
            "active": db.query(Report).filter(Report.status == "active").count(),
            "in_progress": db.query(Report)
            .filter(Report.status == "in_progress")
            .count(),
            "received": db.query(Report).filter(Report.status == "received").count(),
        },
        "users": {
            "total": db.query(User).count(),  # Total users
            "volunteers": db.query(User)
            .filter(User.role == UserRole.rescue_team)
            .count(),
        },
    }


# -------- Get All Users --------


@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Allow only admin
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admins only")

    return db.query(User).all()


# -------- Get All Reports --------


@router.get("/reports", response_model=List[ReportResponse])
def get_all_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Allow only admin
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admins only")

    return db.query(Report).all()


# -------- Team Dispatch --------


@router.get("/rescue-teams", response_model=List[UserResponse])
def get_rescue_teams(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch all available rescue teams."""
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admins only")

    return db.query(User).filter(User.role == UserRole.rescue_team).all()


@router.post("/reports/{report_id}/assign")
def assign_report_to_team(
    report_id: int,
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Assigns a rescue team to a report and sets status to in_progress."""
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admins only")

    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    team = (
        db.query(User)
        .filter(User.id == team_id, User.role == UserRole.rescue_team)
        .first()
    )
    if not team:
        raise HTTPException(status_code=400, detail="Invalid team ID")

    report.assigned_team_id = team_id
    report.status = "in_progress"  # Direct string since Enum handled by SQLAlchemy

    db.commit()
    db.refresh(report)
    return {
        "message": f"Successfully assigned report to {team.full_name}",
        "report_id": report.id,
    }
