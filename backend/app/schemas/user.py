# =========================================================
# USER SCHEMAS
# Schemas validate data coming IN from users (inputs)
# and format data going OUT to users (responses).
# =========================================================

from pydantic import BaseModel, EmailStr
from app.models.user import UserRole
from datetime import datetime

# 1. BASE SCHEMA
# These fields are common to all User actions
class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    role: UserRole = UserRole.user

# 2. CREATE USER (Inputs)
# When signing up, we NEED a password.
class UserCreate(UserBase):
    password: str

# 3. LOGIN (Inputs)
# Only email/password needed.
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# 4. USER RESPONSE (Outputs)
# What we send back to the frontend.
# We NEVER include the password here!
class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True # Allows reading from ORM models
