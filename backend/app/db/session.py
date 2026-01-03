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
# If we are using postgres, we assume it's Supabase or similar.
# We force resolving the hostname to an IPv4 address to avoid 'Cannot assign requested address'.

DEBUG_DNS_LOG = []

try:
    parsed = urlparse(db_url)
    if parsed.hostname and "postgres" in parsed.scheme:
        DEBUG_DNS_LOG.append(f"Resolving {parsed.hostname}...")
        # Force IPv4 resolution
        # getaddrinfo returns a list of tuples (family, type, proto, canonname, sockaddr)
        # sockaddr is (ip, port)
        infos = socket.getaddrinfo(parsed.hostname, parsed.port or 5432, socket.AF_INET, socket.SOCK_STREAM)
        
        if infos:
            # Take the first IPv4 address
            ipv4 = infos[0][4][0]
            DEBUG_DNS_LOG.append(f"Success! Resolved to {ipv4}")
            
            # Replace hostname with IP in the URL
            # We need to be careful with the password part in netloc but urlparse handles attributes well
            new_netloc = parsed.netloc.replace(parsed.hostname, ipv4)
            parsed = parsed._replace(netloc=new_netloc)
            db_url = urlunparse(parsed)
        else:
            DEBUG_DNS_LOG.append("getaddrinfo returned empty list")
except Exception as e:
    DEBUG_DNS_LOG.append(f"Resolution failed: {e}")
    print(f"DNS Resolution failed: {e}")

engine = create_engine(
    db_url, 
    pool_pre_ping=True # Helps prevent connection timeout errors
)

# 2. CREATE A SESSION FACTORY
# A "Session" is a temporary workspace for database operations.
# "autocommit=False" means we must explicitly say "save" (db.commit()) to save changes.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 3. BASE MODEL
# All our database models (User, Report) will inherit from this "Base".
Base = declarative_base()

# 4. DEPENDENCY FUNCTION
# This function is used by API "routers" to get a database session.
# It ensures the session is closed after the request is finished.
def get_db():
    db = SessionLocal() # Open a session
    try:
        yield db # Give the session to the requester
    finally:
        db.close() # Always close it when done!
