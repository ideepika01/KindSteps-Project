# This script sets up the essential data our app needs to run properly from day one.
from sqlalchemy.orm import Session
from app.core import security
from app.models.user import User, UserRole

# This function adds initial accounts (like the Admin) if they don't already exist
def init_db(db: Session) -> None:
    # Creating a default Admin account so you can log in immediately
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

    # Creating a default Rescue Team account for testing assignments
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
    
    # Making sure all reports have a team assigned so nothing gets missed
    from app.models.report import Report
    unassigned_reports = db.query(Report).filter(Report.assigned_team_id == None).all()
    for report in unassigned_reports:
        report.assigned_team_id = team.id
    
    db.commit()
