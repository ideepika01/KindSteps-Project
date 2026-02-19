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


# -------- ROLE CHECK HELPERS --------


def require_admin(user: User):
    if user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admins only")


def require_admin_or_rescue(user: User):
    if user.role not in [UserRole.admin, UserRole.rescue_team]:
        raise HTTPException(status_code=403, detail="Access denied")


# -------- PUBLIC STATS --------


@router.get("/public/stats")
def get_public_stats(db: Session = Depends(get_db)):

    total_reports = db.query(Report).count()

    total_rescues = db.query(Report).filter(Report.status == "resolved").count()

    active_missions = db.query(Report).filter(Report.status == "in_progress").count()

    volunteers_online = db.query(User).filter(User.role == UserRole.rescue_team).count()

    return {
        "total_reports": total_reports,
        "total_rescues": total_rescues,
        "active_missions": active_missions,
        "volunteers_online": volunteers_online,
    }


# -------- DASHBOARD STATS --------


@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    require_admin_or_rescue(current_user)

    return {
        "reports": {
            "total": db.query(Report).count(),
            "resolved": db.query(Report).filter(Report.status == "resolved").count(),
            "active": db.query(Report).filter(Report.status == "active").count(),
            "in_progress": db.query(Report)
            .filter(Report.status == "in_progress")
            .count(),
            "received": db.query(Report).filter(Report.status == "received").count(),
        },
        "users": {
            "total": db.query(User).count(),
            "volunteers": db.query(User)
            .filter(User.role == UserRole.rescue_team)
            .count(),
        },
    }


# -------- USERS --------


@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    require_admin(current_user)

    return db.query(User).all()


# -------- REPORTS --------


@router.get("/reports", response_model=List[ReportResponse])
def get_all_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    require_admin(current_user)

    return db.query(Report).all()


# -------- RESCUE TEAMS --------


@router.get("/rescue-teams", response_model=List[UserResponse])
def get_rescue_teams(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    require_admin(current_user)

    teams = db.query(User).filter(User.role == UserRole.rescue_team).all()

    return teams


# -------- ASSIGN REPORT --------


@router.post("/reports/{report_id}/assign")
def assign_report_to_team(
    report_id: int,
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    require_admin(current_user)

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
    report.status = "in_progress"

    db.commit()
    db.refresh(report)

    return {
        "message": f"Assigned to {team.full_name}",
        "report_id": report.id,
    }
