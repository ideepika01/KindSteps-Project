from app.db.session import SessionLocal
from app.models.report import Report
from app.models.user import User

def check_all_assignees():
    db = SessionLocal()
    try:
        reports = db.query(Report).all()
        assignees = {}
        for r in reports:
            if r.assigned_team_id:
                assignees[r.assigned_team_id] = assignees.get(r.assigned_team_id, 0) + 1
        
        for uid, count in assignees.items():
            user = db.query(User).filter(User.id == uid).first()
            email = user.email if user else "Unknown"
            print(f"User ID: {uid}, Email: {email}, Count: {count}")
    finally:
        db.close()

if __name__ == "__main__":
    check_all_assignees()
