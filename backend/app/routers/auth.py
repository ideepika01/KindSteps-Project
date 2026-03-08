# Authentication Router - Handles Signup, Login and Current User

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse
from app.schemas.token import Token

router = APIRouter()


# Register a new user
@router.post("/signup", response_model=UserResponse)
def signup(user: UserCreate, db: Session = Depends(get_db)):

    # check if email already exists
    if db.query(User).filter_by(email=user.email).first():
        raise HTTPException(400, "Email already registered")

    new_user = User(
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        role=user.role,
        hashed_password=hash_password(user.password),
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


# Login and return JWT token
@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    
    # find user by email
    user = db.query(User).filter_by(email=form_data.username).first()

    # validate password
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(401, "Invalid email or password")

    return {
        "access_token": create_access_token(subject=user.email),
        "token_type": "bearer",
        "user": user,
    }


# Get current logged-in user
@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user