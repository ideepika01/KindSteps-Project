from app.db.session import SessionLocal
from app.models.user import User
from app.models.report import Report

db = SessionLocal()
try:
    team = db.query(User).filter(User.email == "team@kindsteps.com").first()
    if not team:
        print("Team user not found.")
    else:
        print(f"Team User ID: {team.id}, Role: {team.role}")
        assignments = db.query(Report).filter(Report.assigned_team_id == team.id).all()
        print(f"Number of assignments: {len(assignments)}")
        for r in assignments:
            print(f"- Report ID: {r.id}, Condition: {r.condition}, Status: {r.status}")
finally:
    db.close()
