from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings


# setup password hashing
pwd_context = CryptContext(
    schemes=["pbkdf2_sha256"],
    deprecated="auto"
)


# hash plain password
def hash_password(password: str) -> str:
    return pwd_context.hash(password)


# check password with stored hash
def verify_password(password: str, hashed_password: str) -> bool:
    return pwd_context.verify(password, hashed_password)



# create jwt token
def create_access_token(subject: str) -> str:

    # set expiry time
    expire = datetime.utcnow() + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    # token data
    data = {
        "sub": subject,
        "exp": expire
    }

    # generate token
    token = jwt.encode(
        data,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

    return token