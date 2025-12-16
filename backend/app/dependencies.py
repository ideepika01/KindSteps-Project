# =========================================================
# DEPENDENCIES (THE BOUNCER)
# This file checks if a user is allowed to enter (is logged in).
# It acts like a "Bouncer" for our API endpoints.
# =========================================================

from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User

# This tells FastAPI: "If we need a token, look for it in the Authorization header"
# It also tells Swagger UI where to send the user to log in ("/auth/login").
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)], 
    db: Session = Depends(get_db)
) -> User:
    """
    Validates the user's token (ID card).
    If valid, returns the User object (their profile).
    If invalid, kicks them out (401 Error).
    """
    
    # The error to show if anything is wrong with the token
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # 1. DECODE THE TOKEN
        # We use the SECRET_KEY to open the token safely.
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        
        # 2. EXTRACT EMAIL
        # The email is stored in the "sub" (subject) field.
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
            
    except JWTError:
        # If the token is fake or expired
        raise credentials_exception

    # 3. FIND USER IN DATABASE
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
        
    # 4. SUCCESS!
    return user
