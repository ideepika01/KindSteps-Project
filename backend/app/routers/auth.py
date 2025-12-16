# =========================================================
# AUTHENTICATION ROUTER
# Handles:
# 1. Sign Up (Creating a new account)
# 2. Login (Getting an access token)
# 3. Me (Getting my own profile)
# =========================================================

from datetime import timedelta
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core import security
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse
from app.schemas.token import Token
from app.core.config import settings
from app.dependencies import get_current_user

router = APIRouter()

# ---------------------------------------------------------
# 1. SIGN UP
# ---------------------------------------------------------
@router.post("/signup", response_model=UserResponse)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    """
    Creates a new user account.
    Steps:
    1. Check if email already exists.
    2. Hash the password (scramble it).
    3. Save to database.
    """
    # Check duplicate
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash password
    hashed_password = security.get_password_hash(user.password)
    
    # Create User Object (Notice we use 'hashed_password' instead of 'password')
    # exclude={'password'} ensures we don't accidentally try to save the plain password if it was somehow in the dict
    user_data = user.model_dump(exclude={"password"}) 
    new_user = User(**user_data, hashed_password=hashed_password)
    
    # Save to DB
    db.add(new_user)
    db.commit()
    db.refresh(new_user) # Reloads the new user with its ID
    
    return new_user

# ---------------------------------------------------------
# 2. LOGIN
# ---------------------------------------------------------
@router.post("/login", response_model=Token)
def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: Session = Depends(get_db)):
    """
    Logs a user in.
    Steps:
    1. Find user by email.
    2. Check if password matches.
    3. If valid, create and return an Access Token.
    """
    # Note: 'form_data.username' contains the email because OAuth2 standard uses "username" field
    user = db.query(User).filter(User.email == form_data.username).first()
    
    # Check if user exists AND password is correct
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create Token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.email}, 
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

# ---------------------------------------------------------
# 3. GET CURRENT USER (ME)
# ---------------------------------------------------------
@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    """Returns the profile of the currently logged-in user."""
    return current_user
