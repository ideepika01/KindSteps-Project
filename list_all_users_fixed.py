from app.db.session import SessionLocal
from app.models.user import User
from app.models.report import Report

def list_users():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        print(f"Total users: {len(users)}")
        for u in users:
            assigned = db.query(Report).filter(Report.assigned_team_id == u.id).count()
            print(f"ID: {u.id}, Role: {u.role}, Email: {u.email}, Assignments: {assigned}")
    finally:
        db.close()

if __name__ == "__main__":
    list_users()
