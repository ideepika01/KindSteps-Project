from app.models.user import User
from app.models.report import Report
from app.db.session import SessionLocal
from app.core import security

db = SessionLocal()
try:
    # 1. Reset Admin
    admin = db.query(User).filter(User.email == "admin@kindsteps.com").first()
    if admin:
        print("Updating admin password...")
        # Force update with current hashing scheme
        admin.hashed_password = security.get_password_hash("admin123")
        db.commit()
        print("Admin password updated to 'admin123' (pbkdf2_sha256).")
    else:
        print("Admin user not found. Run init_db first.")

    # 2. Reset Team (just in case)
    team = db.query(User).filter(User.email == "team@kindsteps.com").first()
    if team:
        print("Updating team password...")
        team.hashed_password = security.get_password_hash("team123")
        db.commit()
        print("Team password updated to 'team123' (pbkdf2_sha256).")

finally:
    db.close()
