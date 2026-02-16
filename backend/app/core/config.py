from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "KindSteps Support"

    # Database
    DATABASE_URL: str = ""

    # Auth
    SECRET_KEY: str = "secretkey123"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # AI
    GEMINI_API_KEY: str = ""

    class Config:
        env_file = ".env"

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        # Pydantic-settings handles the .env loading into self.DATABASE_URL
        if not self.DATABASE_URL:
            # Fallback for local dev if .env is missing or DATABASE_URL is empty
            return "postgresql+pg8000://postgres:AcademyRootPassword@localhost:5432/kindsteps_fullstack_db"

        if self.DATABASE_URL.startswith("postgres"):
            return self.DATABASE_URL.replace("postgres://", "postgresql://", 1)

        return self.DATABASE_URL


settings = Settings()
