# This router handles everything related to joining and signing in to KindSteps.
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core import security
from app.core.config import settings
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse
from app.schemas.token import Token

router = APIRouter()

# Registering a brand new user into our community
@router.post("/signup", response_model=UserResponse)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    # Making sure this email hasn't already been used
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="That email is already in our system.")

    # Scrambling the password for safety before saving it
    hashed_password = security.hash_password(user.password)

    # Creating the new user profile
    new_user = User(
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        role=user.role,
        hashed_password=hashed_password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

# Signing in an existing user and giving them a secure "key" (JWT token)
@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    # Finding the user by their email address
    user = db.query(User).filter(User.email == form_data.username).first()

    # Checking if the email exists and the password matches
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Hmm, that email or password doesn't look right.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Handing out a secure sessions key that lasts for a set amount of time
    access_token = security.create_access_token(
        data={"sub": user.email},
        expires_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

# Identifying who is currently logged in based on their secure key
@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
