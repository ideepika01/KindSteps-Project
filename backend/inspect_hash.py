from app.models.user import User
from app.models.report import Report
from app.db.session import SessionLocal

db = SessionLocal()
try:
    admin = db.query(User).filter(User.email == "admin@kindsteps.com").first()
    if admin:
        print(f"Admin Hash: '{admin.hashed_password}'")
    else:
        print("Admin user not found.")
finally:
    db.close()
