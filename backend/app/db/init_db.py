from sqlalchemy.orm import Session
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.report import Report


def create_user_if_not_exists(db: Session, full_name: str, email: str, password: str, role: str, phone: str):
    # Check if user already exists using email
    user = db.query(User).filter(User.email == email).first()

    # If user exists, return that user
    if user:
        return user

    # Create new user object
    new_user = User(
        full_name=full_name,
        email=email,
        hashed_password=hash_password(password),  # Convert password into hashed value
        role=role,
        phone=phone,
    )

    # Add user to database
    db.add(new_user)

    # Save changes permanently
    db.commit()

    # Refresh to get updated data (like id)
    db.refresh(new_user)

    # Return newly created user
    return new_user


def assign_unassigned_reports(db: Session, team: User):
    # Update all reports where assigned_team_id is empty
    db.query(Report)\
        .filter(Report.assigned_team_id == None)\
        .update({Report.assigned_team_id: team.id})

    # Save changes to database
    db.commit()


def init_db(db: Session):
    # Create admin user if not exists
    create_user_if_not_exists(
        db,
        "KindSteps Admin",
        "admin@kindsteps.com",
        "admin123",
        UserRole.admin.value,
        "1234567890",
    )

    # Create team user if not exists
    team = create_user_if_not_exists(
        db,
        "Team Alpha",
        "team@kindsteps.com",
        "team123",
        UserRole.rescue_team.value,
        "0987654321",
    )

    # Assign all unassigned reports to the team
    assign_unassigned_reports(db, team)
