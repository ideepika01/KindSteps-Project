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
    # "Tenant or user not found" means we hit the wrong region. We must try others.
    
    REGIONS = [
         # Name, IP
        ("Singapore (ap-southeast-1)", "52.74.252.201"),
        ("US East (us-east-1)", "52.45.94.125"),
        ("EU Central (eu-central-1)", "18.198.30.239"),
        ("Mumbai (ap-south-1)", "3.111.105.85"), # Likely failed here
    ]

    regional_engine = None
    last_error = None

    from urllib.parse import urlparse, urlunparse

    parsed = urlparse(final_db_url)
    hostname = parsed.hostname
    
    # Check if we are using the default project hostname
    if hostname and "supabase.co" in hostname and "pooler" not in hostname:
        parts = hostname.split('.')
        if len(parts) >= 3 and parts[0] == "db":
            project_ref = parts[1]
            
            # Fix Username for Pooler: Must be [user].[project_ref]
            current_user = parsed.username
            if project_ref not in current_user:
                new_user = f"{current_user}.{project_ref}"
                parsed = parsed._replace(netloc=f"{new_user}:{parsed.password}@{parsed.hostname}:{parsed.port or 6543}")
            
            # Iterate through regions to find the correct one
            for region_name, region_ip in REGIONS:
                try:
                    print(f"Trying region: {region_name} ({region_ip})...")
                    
                    # Rewrite URL for this region
                    # netloc format: user:pass@host:port
                    port = parsed.port or 6543
                    password = parsed.password
                    user = parsed.username # Updated user from above
                    
                    new_netloc = f"{user}:{password}@{region_ip}:{port}"
                    region_url = urlunparse(parsed._replace(netloc=new_netloc))
                    
                    # Create temporary engine
                    temp_engine = create_engine(region_url, pool_pre_ping=True, pool_recycle=300)
                    
                    # TEST CONNECTION immediately
                    with temp_engine.connect() as conn:
                        print(f"SUCCESS: Connected to {region_name}!")
                        DEBUG_DNS_LOG = f"Connected to {region_name} ({region_ip})"
                        regional_engine = temp_engine
                        break # Found it!
                except Exception as e:
                    print(f"Failed region {region_name}: {e}")
                    last_error = e
                    # Continue to next region
        
    # 2. Assign the winning engine (or fall back to default if logic skipped)
    if regional_engine:
        engine = regional_engine
    else:
        # Fallback if loop failed (or wasn't entered): try creating engine with original url
        print("Regional fallback failed or skipped, using original URL.")
        if last_error:
             DEBUG_DNS_LOG = f"Regional fallback failed. Last error: {last_error}"
        engine = create_engine(final_db_url, pool_pre_ping=True, pool_recycle=300)

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
