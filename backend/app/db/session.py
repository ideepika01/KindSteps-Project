from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings


import ssl
from sqlalchemy.pool import NullPool

# create database engine
connect_args = {}
# Add SSL context if connecting to remote Supabase/postgres with pg8000
if "supabase" in settings.SQLALCHEMY_DATABASE_URI and "pg8000" in settings.SQLALCHEMY_DATABASE_URI:
    context = ssl.create_default_context()
    context.check_hostname = False
    context.verify_mode = ssl.CERT_NONE  # Prevent cert verification errors on serverless
    connect_args["ssl_context"] = context

engine = create_engine(settings.SQLALCHEMY_DATABASE_URI, connect_args=connect_args, poolclass=NullPool)


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