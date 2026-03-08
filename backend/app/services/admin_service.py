from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.models.report import Report, ReportStatus
from fastapi import HTTPException

def get_public_stats(db: Session):
    total_count = db.query(Report).count()
    resolved_count = db.query(Report).filter(Report.status == ReportStatus.resolved.value).count()
    active_count = db.query(Report).filter(Report.status != ReportStatus.resolved.value).count()
    
    return {
        "total_reports": total_count,
        "total_rescues": resolved_count,
        "active_missions": active_count
    }

def get_dashboard_stats(db: Session):
    return {
        "users": {
            "total": db.query(User).count(),
            "rescue_teams": db.query(User).filter(User.role == UserRole.rescue_team).count()
        },
        "reports": {
            "total": db.query(Report).count(),
            "received": db.query(Report).filter(Report.status == ReportStatus.received.value).count(),
            "active": db.query(Report).filter(Report.status == ReportStatus.active.value).count(),
            "in_progress": db.query(Report).filter(Report.status == ReportStatus.in_progress.value).count(),
            "resolved": db.query(Report).filter(Report.status == ReportStatus.resolved.value).count()
        }
    }

def list_users(db: Session):
    return db.query(User).all()

def list_reports(db: Session):
    return db.query(Report).all()

def assign_report(db: Session, report_id: int, team_id: int):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    team = db.query(User).filter(User.id == team_id, User.role == UserRole.rescue_team).first()
    if not team:
        raise HTTPException(status_code=400, detail="Invalid rescue team ID")
    
    report.assigned_team_id = team_id
    report.status = ReportStatus.in_progress.value
    db.commit()
    db.refresh(report)
    return report

def delete_user(db: Session, user_id: int, current_user: User):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    db.delete(user)
    db.commit()
    return {"detail": "User deleted"}

def delete_report(db: Session, report_id: int):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    db.delete(report)
    db.commit()
    return {"detail": "Report deleted"}
