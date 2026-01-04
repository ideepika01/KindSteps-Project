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
        ("Mumbai (ap-south-1)", "3.111.105.85"), 
        ("US West (us-west-1)", "52.8.172.168"),
        ("Tokyo (ap-northeast-1)", "35.79.125.133"),
        ("Ireland (eu-west-1)", "108.128.216.176"),
        ("London (eu-west-2)", "18.135.253.94"),
        ("Sydney (ap-southeast-2)", "13.238.183.126"),
        ("São Paulo (sa-east-1)", "15.229.214.120"), # Hardcoded
        ("Canada (ca-central-1)", "35.182.25.176"),  # Hardcoded
    ]

    regional_engine = None
    last_error = None
    debug_log_buffer = []

    from urllib.parse import urlparse, urlunparse, quote_plus

    parsed = urlparse(final_db_url)
    hostname = parsed.hostname
    
    # Check if we are using the default project hostname
    if hostname and "supabase.co" in hostname and "pooler" not in hostname:
        parts = hostname.split('.')
        if len(parts) >= 3 and parts[0] == "db":
            project_ref = parts[1]
            debug_log_buffer.append(f"Detected project: {project_ref}")
            
            # Iterate through regions to find the correct one
            for region_name, region_ip in REGIONS:
                try:
                    # Rewrite URL for this region
                    # netloc format: user:pass@host:port
                    # CRITICAL: Must URL-encode user and password to handle special chars like '@'
                    port = parsed.port or 6543
                    password = parsed.password or ""
                    user = parsed.username or "postgres"
                    
                    # Fix Username for Pooler: Must be [user].[project_ref] if not already
                    if project_ref not in user:
                        user = f"{user}.{project_ref}"
                        
                    encoded_user = quote_plus(user)
                    encoded_password = quote_plus(password)
                    
                    new_netloc = f"{encoded_user}:{encoded_password}@{region_ip}:{port}"
                    region_url = urlunparse(parsed._replace(netloc=new_netloc))
                    
                    # Create temporary engine
                    temp_engine = create_engine(region_url, pool_pre_ping=True, pool_recycle=300)
                    
                    # TEST CONNECTION immediately
                    with temp_engine.connect() as conn:
                        print(f"SUCCESS: Connected to {region_name}!")
                        debug_log_buffer.append(f"SUCCESS: Connected to {region_name} ({region_ip})")
                        regional_engine = temp_engine
                        break # Found it!
                except Exception as e:
                    # Simplify error message for log
                    err_str = str(e).split('\n')[0]
                    debug_log_buffer.append(f"Failed {region_name}: {err_str}")
                    last_error = e
                    # Continue to next region
        
    # 2. Assign the winning engine (or fall back to default if logic skipped)
    if regional_engine:
        engine = regional_engine
    else:
        # Fallback if loop failed (or wasn't entered): try creating engine with original url
        print("Regional fallback failed or skipped, using original URL.")
        debug_log_buffer.append("Regional fallback failed or skipped.")
        if last_error:
             # Capture detailed last error
             debug_log_buffer.append(f"Last Error: {last_error}")
        engine = create_engine(final_db_url, pool_pre_ping=True, pool_recycle=300)

    DEBUG_DNS_LOG = " | ".join(debug_log_buffer)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
except Exception as e:
    print(f"Engine creation failed: {e}")
    DEBUG_DNS_LOG = f"Crash: {e}"

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
