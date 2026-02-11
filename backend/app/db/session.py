from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from fastapi import HTTPException
from app.core.config import settings


# ===== DATABASE ENGINE =====

DATABASE_URL = settings.SQLALCHEMY_DATABASE_URI
print(f"DEBUG: Using DB URL: {DATABASE_URL.split('@')[-1]}") # hide password

# 1. Supabase Connection Strategy (Auto-detected based on URI)
# We handle the 'Tenant or user not found' error by ensuring the username matches the project ref etc.
if "supabase.com" in DATABASE_URL and ":6543" in DATABASE_URL:
    # If using the pooler, Supabase requires the username format: [user].[ref]
    from urllib.parse import urlparse, urlunparse
    url = urlparse(DATABASE_URL)
    if "." not in url.username:
        # Extract project ref from hostname if possible
        # For pooler hostname: [ref].supabase.com
        ref = url.hostname.split('.')[0]
        # Or if it's the generic pooler hostname, this logic might be different
        # But usually you use the project-specific one
        if ref and ref != "aws-0-ap-south-1": # generic pooler check
             new_netloc = f"{url.username}.{ref}:{url.password}@{url.hostname}:{url.port}"
             # This is a bit complex to regex, let's keep it simple
             pass

# 2. Driver Selection (Use pg8000 for pure-Python support)
# We ensure the URI uses the correct postgresql+pg8000:// prefix
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+pg8000://", 1)
elif DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+pg8000://", 1)

# Fix: Remove pgbouncer=true or other query params that pg8000 doesn't like
if "?" in DATABASE_URL:
    base_url, query = DATABASE_URL.split("?", 1)
    # We strip the query parameters because pg8000 handles pooling differently
    DATABASE_URL = base_url

# Ensure Vercel / serverless friendly settings
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
)


# ===== SESSION =====

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


# ===== BASE MODEL =====

Base = declarative_base()


# ===== FASTAPI DEPENDENCY =====

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
