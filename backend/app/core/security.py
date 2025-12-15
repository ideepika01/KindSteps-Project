"""Security helpers: password hashing and JWT helpers.

These are intentionally small, well-typed utilities to make authentication
logic easy to understand and test.
"""

from datetime import datetime, timedelta
from typing import Any, Dict, Optional

from jose import jwt
from passlib.context import CryptContext

from app.core import config


pwd_context = CryptContext(schemes=["sha256_crypt", "bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Return True if the plain password matches the hashed password."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a plaintext password using the configured algorithm."""
    return pwd_context.hash(password)


def _default_expiry() -> timedelta:
    """Return the default access token expiry from settings as a timedelta."""
    return timedelta(minutes=getattr(config.settings, "ACCESS_TOKEN_EXPIRE_MINUTES", 15))


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token containing `data` and an expiry claim.

    `data` should include identifying information (for example, a `sub` or
    `email` claim). The token is signed with the app's `SECRET_KEY` and uses
    the algorithm from settings.
    """
    to_encode = data.copy()
    expiry = expires_delta or _default_expiry()
    to_encode.update({"exp": datetime.utcnow() + expiry})
    encoded_jwt = jwt.encode(
        to_encode, config.settings.SECRET_KEY, algorithm=config.settings.ALGORITHM
    )
    return encoded_jwt
