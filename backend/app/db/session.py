# =========================================================
# DATABASE CONNECTION
# This file handles the connection to our PostgreSQL database.
# =========================================================

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# 1. CREATE THE ENGINE
# The "engine" is the core connection to the database.
# We get the connection URL from our settings (which comes from .env file).
engine = create_engine(
    settings.SQLALCHEMY_DATABASE_URI, 
    pool_pre_ping=True # Helps prevent connection timeout errors
)

# 2. CREATE A SESSION FACTORY
# A "Session" is a temporary workspace for database operations.
# "autocommit=False" means we must explicitly say "save" (db.commit()) to save changes.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 3. BASE MODEL
# All our database models (User, Report) will inherit from this "Base".
Base = declarative_base()

# 4. DEPENDENCY FUNCTION
# This function is used by API "routers" to get a database session.
# It ensures the session is closed after the request is finished.
def get_db():
    db = SessionLocal() # Open a session
    try:
        yield db # Give the session to the requester
    finally:
        db.close() # Always close it when done!
