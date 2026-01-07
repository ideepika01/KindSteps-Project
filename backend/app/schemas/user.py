from pydantic import BaseModel, EmailStr
from app.models.user import UserRole
from datetime import datetime

class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    role: UserRole = UserRole.user

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
