from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.report import Report
from app.models.user import User

def check_assignments():
    db = SessionLocal()
    try:
        users = db.query(User).filter(User.role == "rescue_team").all()
        print(f"Found {len(users)} rescue team users:")
        for u in users:
            reports_count = db.query(Report).filter(Report.assigned_team_id == u.id).count()
            print(f"ID: {u.id}, Email: {u.email}, Name: {u.full_name}, Assigned: {reports_count}")
            
    finally:
        db.close()

if __name__ == "__main__":
    check_assignments()
