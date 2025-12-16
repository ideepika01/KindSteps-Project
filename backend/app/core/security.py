# =========================================================
# SECURITY UTILITIES
# This file handles:
# 1. Hashing passwords (turning "secret123" into scrambled text)
# 2. Creating Access Tokens (digital ID cards for logged-in users)
# =========================================================

from datetime import datetime, timedelta
from typing import Any, Dict, Optional
from jose import jwt
from passlib.context import CryptContext
from app.core import config

# PREPARING THE HASHER
# We use "bcrypt", which is the industry standard for secure password hashing.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 1. PASSWORD HASHING
# We NEVER store passwords as plain text (e.g., "password123").
# If a hacker stole the database, they would see that.
# instead, we "hash" it into something like "$2b$12$Kix..."

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Checks if the typed password matches the saved hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Turns a plain password into a secure hash."""
    return pwd_context.hash(password)


# 2. TOKEN CREATION
# An "Access Token" (JWT) is like a temporary ID card.
# The user sends it with every request so we know who they are.

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Creates a digital ID card (JWT token)"""
    to_encode = data.copy()
    
    # Set expiration time (default is 15 minutes if not provided)
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
        
    to_encode.update({"exp": expire})
    
    # "Sign" the token using our secret key so it can't be faked
    encoded_jwt = jwt.encode(
        to_encode, 
        config.settings.SECRET_KEY, 
        algorithm=config.settings.ALGORITHM
    )
    return encoded_jwt
