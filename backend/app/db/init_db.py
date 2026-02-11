# This script sets up the essential data our app needs to run properly from day one.
from sqlalchemy.orm import Session
from app.core import security
from app.models.user import User, UserRole

# This function adds initial accounts (like the Admin) if they don't already exist
def init_db(db: Session) -> None:
    # 1. Ensure Admin exists
    admin = db.query(User).filter(User.email == "admin@kindsteps.com").first()
    if not admin:
        print("Creating default admin account...")
        admin = User(
            full_name="KindSteps Admin",
            email="admin@kindsteps.com",
            hashed_password=security.hash_password("admin123"),
            role=UserRole.admin.value,
            phone="1234567890"
        )
        db.add(admin)

    # 2. Ensure Team Alpha exists
    team = db.query(User).filter(User.email == "team@kindsteps.com").first()
    if not team:
        print("Creating default team account...")
        team = User(
            full_name="Team Alpha",
            email="team@kindsteps.com",
            hashed_password=security.hash_password("team123"),
            role=UserRole.rescue_team.value,
            phone="0987654321"
        )
        db.add(team)
    
    db.commit()
    db.refresh(team)

    # 3. Clean up unassigned reports
    from app.models.report import Report
    unassigned_count = db.query(Report).filter(Report.assigned_team_id == None).count()
    if unassigned_count > 0:
        print(f"Assigning {unassigned_count} unassigned reports to {team.full_name}")
        db.query(Report).filter(Report.assigned_team_id == None).update({Report.assigned_team_id: team.id})
    
    db.commit()
