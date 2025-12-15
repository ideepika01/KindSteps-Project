"""Application configuration using pydantic BaseSettings.

Settings values are read from environment variables. Using BaseSettings
with an `env_file` makes local development easier while keeping the
production configuration based on environment variables (12-factor apps).
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "KindSteps Support"
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        # If a local `.env` file exists, pydantic will read it during dev.
        env_file = ".env"


settings: Settings = Settings()
