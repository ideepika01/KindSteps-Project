from sqlalchemy.orm import Session
from app.core import security
from app.models.user import User, UserRole
from app.core.config import settings

def init_db(db: Session) -> None:
    admin = db.query(User).filter(User.email == "admin@kindsteps.com").first()
    if not admin:
        admin_in = User(
            full_name="KindSteps Admin",
            email="admin@kindsteps.com",
            hashed_password=security.get_password_hash("admin123"),
            role=UserRole.admin.value,
            phone="1234567890"
        )
        db.add(admin_in)
        db.commit()
        db.refresh(admin_in)

    team = db.query(User).filter(User.email == "team@kindsteps.com").first()
    if not team:
        team_in = User(
            full_name="KindSteps Rescue Team",
            email="team@kindsteps.com",
            hashed_password=security.get_password_hash("team123"),
            role=UserRole.rescue_team.value,
            phone="0987654321"
        )
        db.add(team_in)
        db.commit()
        db.refresh(team_in)
