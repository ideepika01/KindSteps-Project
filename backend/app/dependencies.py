from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User

# Define the OAuth2 token URL (login endpoint)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


# Get the currently logged-in user
async def get_current_user(
    token: Annotated[
        str, Depends(oauth2_scheme)
    ],  # Automatically get token from request
    db: Session = Depends(get_db),
) -> User:

    # Exception to raise if credentials are invalid
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Decode JWT token
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        email: str = payload.get("sub")  # Get email from token payload
        if not email:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Fetch user from database
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise credentials_exception

    return user
