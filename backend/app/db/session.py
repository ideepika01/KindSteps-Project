from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings


# create database engine
engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)


# create session factory
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


# base class for all models
Base = declarative_base()


# dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()