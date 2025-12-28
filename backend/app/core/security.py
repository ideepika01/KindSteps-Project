from datetime import datetime, timedelta
from typing import Any, Dict, Optional
from jose import jwt
from passlib.context import CryptContext
from app.core import config

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Checks if the typed password matches the saved hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Turns a plain password into a secure hash."""
    return pwd_context.hash(password)


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    
    # Set expiration time (default is 15 minutes if not provided)
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
        
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(
        to_encode, 
        config.settings.SECRET_KEY, 
        algorithm=config.settings.ALGORITHM
    )
    return encoded_jwt
