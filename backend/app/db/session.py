# =========================================================
# DATABASE CONNECTION
# This file handles the connection to our PostgreSQL database.
# =========================================================

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

import socket
from urllib.parse import urlparse, urlunparse

# UNCOMMENT to debug if needed
# import logging
# logging.basicConfig()
# logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)

# FIX FOR VERCEL + SUPABASE IPV6 ISSUE
DEBUG_DNS_LOG = []

def resolve_to_ipv4(url_str):
    """
    Supabase/Vercel often fail with IPv6. This attempts to force IPv4.
    """
    try:
        parsed = urlparse(url_str)
        if parsed.hostname and "postgres" in parsed.scheme:
            DEBUG_DNS_LOG.append(f"Attempting to resolve {parsed.hostname} to IPv4...")
            # AF_INET = IPv4
            # This might block, but we are in startup so it's okay-ish.
            info = socket.getaddrinfo(parsed.hostname, parsed.port or 5432, family=socket.AF_INET)
            if info:
                # info[0][4][0] is the IP address
                ip = info[0][4][0]
                DEBUG_DNS_LOG.append(f"Resolved to {ip}")
                new_netloc = parsed.netloc.replace(parsed.hostname, ip)
                return urlunparse(parsed._replace(netloc=new_netloc))
            else:
                DEBUG_DNS_LOG.append("No IPv4 address found via getaddrinfo.")
    except Exception as e:
        DEBUG_DNS_LOG.append(f"DNS Resolution Logic Failed: {e}")
    
    return url_str

engine = None
SessionLocal = None

try:
    # 1. Prepare URL (Fix protocol + Fix IPv6)
    final_db_url = settings.SQLALCHEMY_DATABASE_URI
    final_db_url = resolve_to_ipv4(final_db_url)
    
    # 2. Create Engine
    engine = create_engine(
        final_db_url, 
        pool_pre_ping=True
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
except Exception as e:
    DEBUG_DNS_LOG.append(f"Engine creation failed: {e}")
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
