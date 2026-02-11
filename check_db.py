from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.report import Report
from app.models.user import User

def check_reports():
    db = SessionLocal()
    try:
        team = db.query(User).filter(User.email == "team@kindsteps.com").first()
        if not team:
            print("Team Alpha not found.")
            return
        
        reports = db.query(Report).filter(Report.assigned_team_id == team.id).all()
        print(f"Checking reports for {team.full_name} (ID: {team.id})...")
        print(f"Total found: {len(reports)}")
        
        for r in reports:
            print(f"ID: {r.id}, Status: '{r.status}', Updated At: {r.updated_at}")
            
    finally:
        db.close()

if __name__ == "__main__":
    check_reports()
