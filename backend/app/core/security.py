from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings

# Password hashing configuration
pwd_context = CryptContext(
    schemes=["pbkdf2_sha256"],
    deprecated="auto"
)


# ===== PASSWORD FUNCTIONS =====

def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return pwd_context.verify(password, hashed_password)


# ===== JWT TOKEN FUNCTION =====

def create_access_token(data: dict, expires_minutes: int = 15) -> str:
    payload = data.copy()

    expire_time = datetime.utcnow() + timedelta(minutes=expires_minutes)
    payload["exp"] = expire_time

    token = jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

    return token
