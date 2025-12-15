from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine
from app.models.user import User, UserRole
from app.core.security import get_password_hash
from app.models.report import Report

def create_test_users():
    db = SessionLocal()
    try:
        # 1. Admin
        admin_email = "admin@kindsteps.com"
        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            print("Creating Admin user...")
            admin = User(
                full_name="Admin User",
                email=admin_email,
                hashed_password=get_password_hash("admin123"),
                phone="1112223333",
                role=UserRole.admin.value 
            )
            db.add(admin)
        else:
            # Update password to ensure it uses the new hash
            print("Updating Admin user password...")
            admin.hashed_password = get_password_hash("admin123")

        # 2. Rescue Team
        team_email = "team@kindsteps.com"
        team = db.query(User).filter(User.email == team_email).first()
        if not team:
            print("Creating Rescue Team user...")
            team = User(
                full_name="Rescue Team Alpha",
                email=team_email,
                hashed_password=get_password_hash("team123"),
                phone="4445556666",
                role=UserRole.rescue_team.value
            )
            db.add(team)
        else:
            # Update password
            print("Updating Rescue Team user password...")
            team.hashed_password = get_password_hash("team123")
            
        db.commit()
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_users()
