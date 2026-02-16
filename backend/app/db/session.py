from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings


# Create database engine using database URL
engine = create_engine(
    settings.SQLALCHEMY_DATABASE_URI,  # Database connection string
    pool_pre_ping=True,                # Check connection before using it
)


# Create session factory
SessionLocal = sessionmaker(
    bind=engine,        # Connect session to engine
    autocommit=False,   # Changes must be committed manually
    autoflush=False,    # Don't auto-save before commit
)


# Base class for all database models
Base = declarative_base()


# Dependency for getting database session in FastAPI
def get_db():
    db = SessionLocal()   # Create new database session
    try:
        yield db          # Use session
    finally:
        db.close()        # Close session after request
