from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "KindSteps Support"

    # database url from .env
    DATABASE_URL: str = ""

    # jwt authentication settings
    SECRET_KEY: str = "secretkey123"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # gemini api key
    GEMINI_API_KEY: str = ""

    class Config:
        env_file = ".env"  # load environment variables

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        # If env is not set, fallback to local pg8000 database
        if not self.DATABASE_URL:
            # print("WARNING: Using local database")
            return "postgresql+pg8000://postgres:AcademyRootPassword@localhost:5432/kindsteps_fullstack_db"

        # Force SQLAlchemy to use pg8000 in Vercel to avoid psycopg2-binary crashes
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+pg8000://", 1)
        if url.startswith("postgresql://") and not url.startswith("postgresql+pg8000://"):
            url = url.replace("postgresql://", "postgresql+pg8000://", 1)
        
        return url


# create settings instance
settings = Settings()
