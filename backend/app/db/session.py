# =========================================================
# DATABASE CONNECTION
# This file handles the connection to our PostgreSQL database.
# =========================================================

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings
from fastapi import HTTPException # Added missing import

engine = None
SessionLocal = None

try:
    # 1. Prepare URL
    # settings.SQLALCHEMY_DATABASE_URI already handles the postgres:// -> postgresql:// fix
    final_db_url = settings.SQLALCHEMY_DATABASE_URI
    
    # 2. Create Engine
    engine = create_engine(
        final_db_url, 
        pool_pre_ping=True,
        pool_recycle=300,
        connect_args={
            "keepalives": 1,
            "keepalives_idle": 30,
            "keepalives_interval": 10,
            "keepalives_count": 5
        }
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
except Exception as e:
    print(f"Engine creation failed: {e}")

# 3. BASE MODEL
# All our database models (User, Report) will inherit from this "Base".
Base = declarative_base()

# 4. DEPENDENCY FUNCTION
# This function is used by API "routers" to get a database session.
# It ensures the session is closed after the request is finished.
def get_db():
    if SessionLocal is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    db = SessionLocal() # Open a session
    try:
        yield db # Give the session to the requester
    finally:
        db.close() # Always close it when done!
