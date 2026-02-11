from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from fastapi import HTTPException
from app.core.config import settings


# ===== DATABASE ENGINE =====

# We pull the connection string from our settings
DATABASE_URL = settings.SQLALCHEMY_DATABASE_URI

# 1. Driver Selection: We always use 'pg8000' here because it's pure Python 
# and works seamlessly in serverless environments like Vercel.
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+pg8000://", 1)
elif DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+pg8000://", 1)

# 2. Parameter Stripping: The pg8000 driver is very strict. It doesn't allow 
# query parameters like '?pgbouncer=true' in the URL string.
# Since Supabase handles the pooling on its end, we strip these for compatibility.
if "?" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.split("?")[0]

# Masking the password and printing the final URL to the logs for verification
safe_url = DATABASE_URL.split("@")[-1] if "@" in DATABASE_URL else DATABASE_URL
print(f"DATABASE CONNECTION: Connecting to {safe_url}")

# Creating the core engine that talks to our database
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Checks if the connection is still alive before using it
    pool_recycle=300    # Refreshes connections every 5 minutes
)


# ===== SESSION SETUP =====

# This factory creates new session objects for us whenever we need to query data
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


# ===== BASE MODEL =====

# All our database tables will inherit from this base
Base = declarative_base()


# ===== FASTAPI DEPENDENCY =====

# A helper function that gives us a database session and makes sure it's closed safely
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
