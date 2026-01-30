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
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        env_file = ".env"

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        # If discrete variables are provided, construct the URL
        if self.DB_USERNAME and self.DB_HOSTNAME and self.DB_NAME:
            # Construct PostgreSQL URL
            url = f"postgresql://{self.DB_USERNAME}:{self.DB_PASSWORD}@{self.DB_HOSTNAME}:{self.DB_PORT}/{self.DB_NAME}"
            return url
            
        # Fallback to DATABASE_URL if provided
        if self.DATABASE_URL.startswith("postgres://"):
            return self.DATABASE_URL.replace(
                "postgres://", "postgresql://", 1
            )
        return self.DATABASE_URL


settings = Settings()
