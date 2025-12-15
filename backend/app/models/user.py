"""Database models for users."""

from typing import List

import enum
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class UserRole(str, enum.Enum):
    """Simple string-based user roles.

    Using strings keeps the database readable and the model easy to work with.
    """

    user = "user"
    rescue_team = "rescue_team"
    admin = "admin"


class User(Base):
    """Represents an application user.

    Attributes are intentionally kept minimal and self-explanatory.
    """

    __tablename__ = "users"

    id: int = Column(Integer, primary_key=True, index=True)
    full_name: str = Column(String, index=True)
    email: str = Column(String, unique=True, index=True)
    hashed_password: str = Column(String)
    phone: str = Column(String)
    # role stored as string for simplicity (e.g. 'user', 'admin')
    role: str = Column(String, default=UserRole.user.value)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    reports: List["Report"] = relationship(
        "Report", back_populates="reporter", foreign_keys="Report.reporter_id"
    )
    assigned_reports: List["Report"] = relationship(
        "Report", back_populates="assigned_team", foreign_keys="Report.assigned_team_id"
    )

    def __repr__(self) -> str:  # pragma: no cover - convenience helper
        return f"<User id={self.id} email={self.email} role={self.role}>"
