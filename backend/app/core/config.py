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
            print("WARNING: No DATABASE_URL found. Using default localhost connection.")
            # Fallback for local dev if .env is missing or DATABASE_URL is empty
            return "postgresql+pg8000://postgres:AcademyRootPassword@localhost:5432/kindsteps_fullstack_db"

        # Enforce pg8000 driver for Vercel/Serverless compatibility
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+pg8000://", 1)
        elif url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+pg8000://", 1)

        # Fix for "connect() got an unexpected keyword argument 'pgbouncer'"
        # pg8000 does not support the 'pgbouncer' query parameter often used with Supabase
        if "pgbouncer=true" in url:
            url = url.replace("?pgbouncer=true", "").replace("&pgbouncer=true", "")

        return url


settings = Settings()
