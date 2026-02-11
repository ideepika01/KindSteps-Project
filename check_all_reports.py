from app.db.session import SessionLocal
from app.models.report import Report
from app.models.user import User

def check_all():
    db = SessionLocal()
    try:
        reports = db.query(Report).all()
        print(f"Total reports: {len(reports)}")
        for r in reports:
            print(f"ID: {r.id}, AssignedTo: {r.assigned_team_id}, Status: '{r.status}'")
    finally:
        db.close()

if __name__ == "__main__":
    check_all()
