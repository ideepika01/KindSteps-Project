from app.core.config import settings
print(f"DATABASE_URL (before fallback): '{settings.DATABASE_URL}'")
print(f"SQLALCHEMY_DATABASE_URI: '{settings.SQLALCHEMY_DATABASE_URI}'")
