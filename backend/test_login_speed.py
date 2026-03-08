from sqlalchemy import text
import time
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timezone, timedelta

# Mocking settings
DATABASE_URL = "postgresql+psycopg2://postgres:AcademyRootPassword@127.0.0.1:5432/kindsteps_fullstack_db"
SECRET_KEY = "secretkey123"
ALGORITHM = "HS256"

def test_login_flow():
    print("Testing Login Flow Components...")
    
    # 1. DB Connection
    start = time.time()
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    print(f"DB Connection established in: {time.time() - start:.4f}s")
    
    # 2. User Query
    email = "team@kindsteps.com" # Just a test email
    try:
        start = time.time()
        db.execute(text("SELECT 1"))
        print(f"Simple query (SELECT 1) took: {time.time() - start:.4f}s")
        
        start = time.time()
        res = db.execute(text(f"SELECT * FROM users")).first() # Just count or get first
        print(f"Fetch first user took: {time.time() - start:.4f}s")

        start = time.time()
        res = db.execute(text(f"SELECT * FROM users WHERE email = :email"), {"email": email}).first()
        print(f"User query by email took: {time.time() - start:.4f}s")
    except Exception as e:
        print(f"Query error: {e}")
    finally:
        db.close()

    # 3. Token Generation
    start = time.time()
    expire = datetime.now(timezone.utc) + timedelta(minutes=30)
    to_encode = {"sub": email, "exp": expire}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    print(f"Token generation took: {time.time() - start:.4f}s")

if __name__ == "__main__":
    test_login_flow()

if __name__ == "__main__":
    test_login_flow()
