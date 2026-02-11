from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ===== BASIC PROJECT INFO =====
    PROJECT_NAME: str = "KindSteps Support"

    # ===== DATABASE =====
    DATABASE_URL: str = "sqlite:///./test.db"
    
    # New discrete DB variables
    DB_USERNAME: str = ""
    DB_PASSWORD: str = ""
    DB_HOSTNAME: str = ""
    DB_PORT: str = "5432"
    DB_NAME: str = ""

    # ===== JWT / AUTH =====
    SECRET_KEY: str = "super-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        env_file = ".env"

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        # First priority: Look for a direct connection string (often from Vercel/Production)
        # We check if DATABASE_URL starts with postgres/postgresql
        if self.DATABASE_URL.startswith("postgres"):
            return self.DATABASE_URL.replace("postgres://", "postgresql://", 1)

        # Second priority: Construct from discrete variables (often from .env)
        if self.DB_USERNAME and self.DB_HOSTNAME and self.DB_NAME:
            return f"postgresql://{self.DB_USERNAME}:{self.DB_PASSWORD}@{self.DB_HOSTNAME}:{self.DB_PORT}/{self.DB_NAME}"
            
        # Last resort: return whatever is in DATABASE_URL
        return self.DATABASE_URL


settings = Settings()
