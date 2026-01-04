# =========================================================
# DATABASE CONNECTION
# This file handles the connection to our PostgreSQL database.
# =========================================================

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings
from fastapi import HTTPException # Added missing import

import socket

# Force IPv4 to avoid "Cannot assign requested address" on Vercel IPv6
# This filters out IPv6 addresses from DNS resolution
old_getaddrinfo = socket.getaddrinfo
def new_getaddrinfo(*args, **kwargs):
    responses = old_getaddrinfo(*args, **kwargs)
    return [response for response in responses if response[0] == socket.AF_INET]
socket.getaddrinfo = new_getaddrinfo

engine = None
SessionLocal = None

try:
    # 1. Prepare URL
    # settings.SQLALCHEMY_DATABASE_URI already handles the postgres:// -> postgresql:// fix
    final_db_url = settings.SQLALCHEMY_DATABASE_URI

    # FIX: Explicitly resolve hostname to IPv4 to bypass Vercel/Supabase IPv6 issues
    # psycopg2 often bypasses socket monkey-patches, so we inject the IP directly.
    try:
        from urllib.parse import urlparse, urlunparse
        
        parsed = urlparse(final_db_url)
        hostname = parsed.hostname
        if hostname:
            # Resolve to IPv4
            ipv4_addr = socket.gethostbyname(hostname)
            print(f"Resolved {hostname} to {ipv4_addr}")
            
            # Replace hostname with IP in the URL
            # We must keep the port if present
            netloc = parsed.netloc.replace(hostname, ipv4_addr)
            
            # Reconstruct URL
            parsed = parsed._replace(netloc=netloc)
            final_db_url = urlunparse(parsed)
    except Exception as dns_err:
        print(f"DNS Resolution failed: {dns_err}")

    # 2. Create Engine
    engine = create_engine(
        final_db_url, 
        pool_pre_ping=True,
        pool_recycle=300,
        connect_args={
            "keepalives": 1,
            "keepalives_idle": 30,
            "keepalives_interval": 10,
            "keepalives_count": 5,
            "prepare_threshold": None
        }
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
except Exception as e:
    print(f"Engine creation failed: {e}")

# 3. BASE MODEL
# All our database models (User, Report) will inherit from this "Base".
Base = declarative_base()

# 4. DEPENDENCY FUNCTION
# This function is used by API "routers" to get a database session.
# It ensures the session is closed after the request is finished.
def get_db():
    if SessionLocal is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    db = SessionLocal() # Open a session
    try:
        yield db # Give the session to the requester
    finally:
        db.close() # Always close it when done!
