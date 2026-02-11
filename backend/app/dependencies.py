# This file helps us figure out who is currently using the app by checking their secure key.
from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User

# This tells the system that we use a "Bearer" token for security
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# This function identifies the user based on the secret token they send with their request
async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)], 
    db: Session = Depends(get_db)
) -> User:
    # A generic error if the key doesn't fit the lock
    error_message = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="We couldn't verify who you are. Please sign in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Decoding the key to find the user's email address
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        
        if email is None:
            raise error_message
            
    except JWTError:
        raise error_message

    # Finding the user in our database using that email
    user = db.query(User).filter(User.email == email).first()
    
    if user is None:
        raise error_message
        
    return user
