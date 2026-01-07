from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings
from fastapi import HTTPException
from urllib.parse import urlparse, urlunparse, quote_plus

def _configure_db_url(url):
    if "db.jnyzqjetppcjrmhrtubk.supabase.co" in url:
        url = url.replace(
            "db.jnyzqjetppcjrmhrtubk.supabase.co:5432", 
            "aws-0-ap-south-1.pooler.supabase.com:6543"
        )

    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+pg8000://")
    elif url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+pg8000://")

    try:
        parsed = urlparse(url)
        if parsed.password:
            encoded_pwd = quote_plus(parsed.password)
            encoded_user = quote_plus(parsed.username or "postgres")
            netloc = f"{encoded_user}:{encoded_pwd}@{parsed.hostname}:{parsed.port or 5432}"
            url = urlunparse((parsed.scheme, netloc, parsed.path.lstrip('/'), '', '', ''))
    except Exception:
        pass

    return url

engine = None
SessionLocal = None

try:
    db_url = _configure_db_url(settings.SQLALCHEMY_DATABASE_URI)
    engine = create_engine(db_url, pool_pre_ping=True, pool_recycle=300)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
except Exception as e:
    print(f"DB Error: {e}")

Base = declarative_base()

def get_db():
    if SessionLocal is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    db = SessionLocal() 
    try:
        yield db 
    finally:
        db.close()
