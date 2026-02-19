from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings


# Create database engine using database URL
connect_args = {}

# Only use SSL if NOT connecting to localhost
if "pg8000" in settings.SQLALCHEMY_DATABASE_URI:
    # Check if host is not local
    if (
        "@localhost" not in settings.SQLALCHEMY_DATABASE_URI
        and "@127.0.0.1" not in settings.SQLALCHEMY_DATABASE_URI
    ):
        try:
            import ssl

            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE
            connect_args["ssl_context"] = ssl_context
        except ImportError:
            pass

engine = create_engine(
    settings.SQLALCHEMY_DATABASE_URI,
    pool_pre_ping=True,
    connect_args=connect_args,
)


# Create session factory
SessionLocal = sessionmaker(
    bind=engine,  # Connect session to engine
    autocommit=False,  # Changes must be committed manually
    autoflush=False,  # Don't auto-save before commit
)


# Base class for all database models
Base = declarative_base()


# Dependency for getting database session in FastAPI
def get_db():
    db = SessionLocal()  # Create new database session
    try:
        yield db  # Use session
    finally:
        db.close()  # Close session after request
