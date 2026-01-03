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
    Supabase Direct Connection is often IPv6 only, which Vercel fails to route.
    We rewrite the URL to use the Supabase Connection Pooler (IPv4 compatible).
    """
    try:
        parsed = urlparse(url_str)
        # Check if it looks like a Supabase Direct URL
        if parsed.hostname and parsed.hostname.endswith(".supabase.co") and parsed.hostname.startswith("db."):
            DEBUG_DNS_LOG.append(f"Detected Supabase Direct URL: {parsed.hostname}")
            
            # Extract Project Ref
            # hostname is usually db.<ref>.supabase.co
            parts = parsed.hostname.split('.')
            if len(parts) >= 2:
                project_ref = parts[1]
                
                # Construct Pooler URL (assuming ap-south-1 based on user location)
                # If this is wrong, the connection will fail, but it's worth a try given IPv6 failure.
                pooler_host = "aws-0-ap-south-1.pooler.supabase.com"
                pooler_port = 6543
                
                DEBUG_DNS_LOG.append(f"Rewriting to Pooler: {pooler_host}:{pooler_port}")
                
                # Fix Username: Must be user.ref
                current_user = parsed.username
                new_user = current_user
                if project_ref not in current_user:
                    new_user = f"{current_user}.{project_ref}"
                    DEBUG_DNS_LOG.append(f"Updated username to: {new_user}")
                
                # Rebuild URL
                # urlparse is immutable, so we hack the netloc string replacement or rebuild manually
                # manually is safer for auth
                
                # netloc format: user:pass@host:port
                new_netloc = f"{new_user}:{parsed.password}@{pooler_host}:{pooler_port}"
                
                parsed = parsed._replace(netloc=new_netloc)
                return urlunparse(parsed)
                
    except Exception as e:
        DEBUG_DNS_LOG.append(f"URL Rewrite Failed: {e}")
    
    return url_str

engine = None
SessionLocal = None

try:
    # 1. Prepare URL (Fix protocol + Fix IPv6/Pooler)
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
