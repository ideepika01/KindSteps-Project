from app.db.session import SessionLocal
from app.models.user import User
from app.models.report import Report

def check_system_state():
    db = SessionLocal()
    try:
        print("--- USERS ---")
        users = db.query(User).all()
        for u in users:
            print(f"ID: {u.id} | Email: {u.email} | Name: {u.full_name} | Role: {u.role}")

        print("\n--- REPORTS ---")
        reports = db.query(Report).all()
        for r in reports:
            print(f"ID: {r.id} | Condition: {r.condition} | Assigned To (ID): {r.assigned_team_id} | Status: {r.status}")
            
    finally:
        db.close()

if __name__ == "__main__":
    check_system_state()
