# =========================================================
# DATABASE CONNECTION
# This file handles the connection to our PostgreSQL database.
# =========================================================

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings
from fastapi import HTTPException # Added missing import

import socket

# Clean session.py - using pg8000 driver for Vercel compatibility
engine = None
SessionLocal = None

try:
    # 1. Prepare URL
    # settings.SQLALCHEMY_DATABASE_URI already handles the postgres:// -> postgresql:// fix
    # We explicitly switch to the pg8000 driver which handles Vercel networking better
    final_db_url = settings.SQLALCHEMY_DATABASE_URI
    
    if final_db_url.startswith("postgresql://"):
        final_db_url = final_db_url.replace("postgresql://", "postgresql+pg8000://")
    elif final_db_url.startswith("postgres://"):
        final_db_url = final_db_url.replace("postgres://", "postgresql+pg8000://")

    print(f"Connecting with driver: pg8000")
    DEBUG_DNS_LOG = "Using pg8000 driver (no manual DNS resolution needed)"

    # 2. Create Engine
    # pg8000 doesn't support 'keepalives' connect_args in the same way, nor prepare_threshold
    # It is a pure python driver that works well with standard settings.
    engine = create_engine(
        final_db_url, 
        pool_pre_ping=True,
        pool_recycle=300
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
except Exception as e:
    print(f"Engine creation failed: {e}")
    DEBUG_DNS_LOG = f"Engine creation failed: {e}"

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
