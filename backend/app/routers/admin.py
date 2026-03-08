from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.user import User, UserRole
from app.schemas.user import UserResponse
from app.schemas.report import ReportResponse
from app.services import admin_service

router = APIRouter()


# admin only dependency
def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.admin:
        raise HTTPException(403, "Admins only")
    return current_user


# staff dependency
def require_staff(current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.admin, UserRole.rescue_team]:
        raise HTTPException(403, "Access denied")
    return current_user


@router.get("/public/stats")
def get_public_stats(db: Session = Depends(get_db)):
    return admin_service.get_public_stats(db)


@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    return admin_service.get_dashboard_stats(db)


@router.get("/users", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return admin_service.list_users(db)


@router.get("/reports", response_model=List[ReportResponse])
def list_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return admin_service.list_reports(db)


@router.post("/reports/{report_id}/assign")
def assign_report(
    report_id: int,
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return admin_service.assign_report(db, report_id, team_id)


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return admin_service.delete_user(db, user_id, current_user)


@router.delete("/reports/{report_id}")
def delete_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return admin_service.delete_report(db, report_id)