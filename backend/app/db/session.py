# =========================================================
# DATABASE CONNECTION
# This file handles the connection to our PostgreSQL database.
# =========================================================

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings
from fastapi import HTTPException # Added missing import

import socket

# Clean session.py - using pg8000 driver for Vercel compatibility
engine = None
SessionLocal = None

try:
    # 1. Prepare URL
    # settings.SQLALCHEMY_DATABASE_URI already handles the postgres:// -> postgresql:// fix
    # We explicitly switch to the pg8000 driver which handles Vercel networking better
    final_db_url = settings.SQLALCHEMY_DATABASE_URI
    
    if final_db_url.startswith("postgresql://"):
        final_db_url = final_db_url.replace("postgresql://", "postgresql+pg8000://")
    elif final_db_url.startswith("postgres://"):
        final_db_url = final_db_url.replace("postgres://", "postgresql+pg8000://")

    print(f"Connecting with driver: pg8000")
    DEBUG_DNS_LOG = "Using pg8000 driver"

    # SUPABASE-SPECIFIC FIX FOR VERCEL
    # Reference: https://supabase.com/docs/guides/database/connecting-to-postgres#connecting-with-ipv4
    # The direct hostname is often IPv6 only. We must use the regional IPv4 pooler.
    try:
        from urllib.parse import urlparse, urlunparse

        parsed = urlparse(final_db_url)
        hostname = parsed.hostname
        
        # Check if we are using the default project hostname
        if hostname and "supabase.co" in hostname and "pooler" not in hostname:
            parts = hostname.split('.')
            if len(parts) >= 3 and parts[0] == "db":
                project_ref = parts[1]
                
                # 1. Switch to Regional Pooler (IPv4)
                # Assumed region ap-south-1 based on user locale. 
                # Ideally we'd use the IP directly but AWS pooler DNS is stable.
                # using IP: 3.111.105.85 to be 100% sure we avoid DNS issues.
                regional_host = "3.111.105.85" 
                
                # 2. Fix Username for Pooler
                # Must be [user].[project_ref]
                current_user = parsed.username
                if project_ref not in current_user:
                    new_user = f"{current_user}.{project_ref}"
                    # Rebuild URL with new user and host
                    # Note: parsed.netloc includes user:pass@host:port
                    # We need to reconstruct it carefully
                    port = parsed.port or 6543
                    password = parsed.password
                    
                    new_netloc = f"{new_user}:{password}@{regional_host}:{port}"
                    parsed = parsed._replace(netloc=new_netloc)
                    
                    final_db_url = urlunparse(parsed)
                    print(f"Rewrote DB URL to use Regional IPv4 Pooler: {regional_host}")
                    DEBUG_DNS_LOG = f"Rewrote to IPv4 Pooler: {regional_host}"
    except Exception as e:
        print(f"URL Rewrite failed: {e}")
        DEBUG_DNS_LOG = f"URL Rewrite failed: {e}"

    # 2. Create Engine
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
except Exception as e:
    print(f"Engine creation failed: {e}")
    DEBUG_DNS_LOG = f"Engine creation failed: {e}"

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
