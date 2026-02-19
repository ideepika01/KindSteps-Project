from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse
from app.schemas.token import Token

router = APIRouter()


# -------- HELPER FUNCTIONS --------


def get_user_by_email(db: Session, email: str):
    """Find user using email"""
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, user: UserCreate):
    """Create and save new user"""

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


# -------- SIGNUP --------


@router.post("/signup", response_model=UserResponse)
def signup(user: UserCreate, db: Session = Depends(get_db)):

    existing_user = get_user_by_email(db, user.email)

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    return create_user(db, user)


# -------- LOGIN --------


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):

    user = get_user_by_email(db, form_data.username)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    password_valid = verify_password(form_data.password, user.hashed_password)

    if not password_valid:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = create_access_token(subject=user.email)

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


# -------- CURRENT USER --------


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):

    return current_user
