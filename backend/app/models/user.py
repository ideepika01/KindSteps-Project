# =========================================================
# USER MODEL
# This file defines what a "User" looks like in the database.
# =========================================================

import enum
from typing import List
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship, Mapped
from sqlalchemy.sql import func
from app.db.session import Base

# 1. USER ROLES
# We define roles here to avoid typos later.
class UserRole(str, enum.Enum):
    user = "user"           # Regular person reporting a case
    rescue_team = "rescue_team" # Team member helping
    admin = "admin"         # Manager

# 2. THE USER TABLE
class User(Base):
    __tablename__ = "users"

    # -- Basic Info --
    id = Column(Integer, primary_key=True, index=True) # Unique ID (1, 2, 3...)
    full_name = Column(String, index=True)
    email = Column(String, unique=True, index=True)    # Must be unique!
    hashed_password = Column(String)                   # we NEVER store plain text passwords
    phone = Column(String)
    
    # Role: default is "user"
    role = Column(String, default=UserRole.user.value)
    
    # Created At: Automatically set the time when user is created
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # -- Relationships --
    # These allow us to easily get all reports made by a user using "user.reports"
    
    # 1. Reports created BY this user
    reports: Mapped[List["Report"]] = relationship(
        "Report", 
        back_populates="reporter", 
        foreign_keys="Report.reporter_id"
    )

    # 2. Reports assigned TO this user (if they are rescue team)
    assigned_reports: Mapped[List["Report"]] = relationship(
        "Report", 
        back_populates="assigned_team", 
        foreign_keys="Report.assigned_team_id"
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email}>"
