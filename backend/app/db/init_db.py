from sqlalchemy.orm import Session
from app.core import security
from app.models.user import User, UserRole
from app.models.webinar import Webinar
from app.core.config import settings
from datetime import datetime, timedelta

def init_db(db: Session) -> None:
    # Seed Admin
    admin = db.query(User).filter(User.email == "admin@kindsteps.com").first()
    if not admin:
        admin_in = User(
            full_name="KindSteps Admin",
            email="admin@kindsteps.com",
            hashed_password=security.hash_password("admin123"),
            role=UserRole.admin.value,
            phone="1234567890"
        )
        db.add(admin_in)

    # Seed Team
    team = db.query(User).filter(User.email == "team@kindsteps.com").first()
    if not team:
        team_in = User(
            full_name="Team Alpha",
            email="team@kindsteps.com",
            hashed_password=security.hash_password("team123"),
            role=UserRole.rescue_team.value,
            phone="0987654321"
        )
        db.add(team_in)
        db.commit()
        db.refresh(team_in)
        team = team_in
    elif team.full_name != "Team Alpha":
        team.full_name = "Team Alpha"
        db.commit()
    
    # Auto-assign all unassigned reports to Team Alpha
    from app.models.report import Report
    unassigned_reports = db.query(Report).filter(Report.assigned_team_id == None).all()
    for report in unassigned_reports:
        report.assigned_team_id = team.id
    db.commit()

    # Seed Webinars
    if db.query(Webinar).count() == 0:
        webinars = [
            Webinar(
                title="Compassionate Intervention",
                description="Learn the basics of identifying and approaching vulnerable individuals with kindness and safety.",
                expert_name="Dr. Sarah Chen",
                date_time=datetime.now() + timedelta(days=2),
                is_live=True
            ),
            Webinar(
                title="Community Resilience",
                description="How neighborhood watch programs can collaborate with KindSteps for a safer community.",
                expert_name="Mark Wilson",
                date_time=datetime.now() + timedelta(days=10),
                is_live=False
            ),
            Webinar(
                title="First Response Basics",
                description="Recorded session on the first steps to take when you encounter an emergency situation.",
                expert_name="KindSteps Team",
                date_time=datetime.now() - timedelta(days=5),
                is_live=False,
                recording_url="https://example.com/recording"
            )
        ]
        db.add_all(webinars)
        db.commit()
