from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from fastapi import HTTPException
from app.core.config import settings


# ===== DATABASE ENGINE =====

DATABASE_URL = settings.SQLALCHEMY_DATABASE_URI

# 1. Supabase Connection Strategy (Redirect to Pooler for Vercel)
if "db.jnyzqjetppcjrmhrtubk.supabase.co" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace(
        "db.jnyzqjetppcjrmhrtubk.supabase.co:5432", 
        "aws-0-ap-south-1.pooler.supabase.com:6543"
    )

# 2. Driver Selection (Use pg8000 for pure-Python support)
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+pg8000://", 1)
elif DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+pg8000://", 1)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True
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
