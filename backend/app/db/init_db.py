from sqlalchemy.orm import Session
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.report import Report


def get_user_by_email(db: Session, email: str):
    return db.query(User).filter_by(email=email).first()  # Fetch user by email


def create_user(db: Session, full_name: str, email: str, password: str, role: str, phone: str):
    user = User(
        full_name=full_name,
        email=email,
        hashed_password=hash_password(password),  # Store hashed password
        role=role,
        phone=phone
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_or_create_user(db: Session, full_name: str, email: str, password: str, role: str, phone: str):
    user = get_user_by_email(db, email)
    return user or create_user(db, full_name, email, password, role, phone)  # Reuse existing user if found


def assign_unassigned_reports(db: Session, team_id: int):
    # Assign all reports without a team
    db.query(Report).filter(Report.assigned_team_id == None).update(
        {Report.assigned_team_id: team_id}
    )
    db.commit()


def init_db(db: Session):
    admin = get_or_create_user(
        db, "KindSteps Admin", "admin@kindsteps.com", "admin123",
        UserRole.admin.value, "1234567890"
    )

    team = get_or_create_user(
        db, "Team Alpha", "team@kindsteps.com", "team123",
        UserRole.rescue_team.value, "0987654321"
    )

    assign_unassigned_reports(db, team.id)