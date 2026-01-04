# =========================================================
# DATABASE CONNECTION
# This file handles the connection to our PostgreSQL database.
# =========================================================

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings
from fastapi import HTTPException
from urllib.parse import urlparse, urlunparse, quote_plus

# CLEAN, SIMPLE SETUP
# We use the 'pg8000' driver because it works best on Vercel.
# We do not use complex auto-discovery scripts anymore.

engine = None
SessionLocal = None
DEBUG_DNS_LOG = "Initializing..."

try:
    # 1. Get URL from settings
    final_db_url = settings.SQLALCHEMY_DATABASE_URI

    # 2. Ensure we use pg8000 driver
    if final_db_url.startswith("postgresql://"):
        final_db_url = final_db_url.replace("postgresql://", "postgresql+pg8000://")
    elif final_db_url.startswith("postgres://"):
        final_db_url = final_db_url.replace("postgres://", "postgresql+pg8000://")

    # 3. Safe Password Encoding (Prevents errors with special chars)
    try:
        parsed = urlparse(final_db_url)
        if parsed.password:
            # Reconstruct URL with encoded password
            user = parsed.username or "postgres"
            pwd = parsed.password
            host = parsed.hostname
            port = parsed.port or 5432
            dbname = parsed.path.lstrip('/')
            
            encoded_pwd = quote_plus(pwd)
            encoded_user = quote_plus(user)
            
            # Rebuild safely
            # Scheme depends on what we set above (postgresql+pg8000)
            scheme = parsed.scheme
            netloc = f"{encoded_user}:{encoded_pwd}@{host}:{port}"
            final_db_url = urlunparse((scheme, netloc, dbname, '', '', ''))
    except Exception as e:
        print(f"Warning: URL parsing failed, using original. Error: {e}")

    print(f"Connecting to Database...")
    DEBUG_DNS_LOG = "Attempting standard connection..."

    # 4. Create Engine
    engine = create_engine(
        final_db_url, 
        pool_pre_ping=True, 
        pool_recycle=300
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    DEBUG_DNS_LOG = "Engine initialized successfully."

except Exception as e:
    print(f"CRITICAL DATABASE ERROR: {e}")
    DEBUG_DNS_LOG = f"CRITICAL DATABASE ERROR: {e}"

# 3. BASE MODEL
Base = declarative_base()

# 4. DEPENDENCY FUNCTION
def get_db():
    if SessionLocal is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    db = SessionLocal() 
    try:
        yield db 
    finally:
        db.close()
