from app.core import security
from app.models import User
from app.db.session import SessionLocal

def test_login():
    db = SessionLocal()
    try:
        email = "admin@kindsteps.com"
        password = "admin123" 
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print("User not found")
            return
        
        verified = security.verify_password(password, user.hashed_password)
        print(f"Password verified: {verified}")
        
        token = security.create_access_token(data={"sub": user.email}, expires_minutes=30)
        print(f"Token created: {token[:10]}...")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_login()
