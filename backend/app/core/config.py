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

        # fallback to local database if env not set
        if not self.DATABASE_URL:
            print("WARNING: Using local database")

            return "postgresql://postgres:AcademyRootPassword@localhost:5432/kindsteps_fullstack_db"

        return self.DATABASE_URL


# create settings instance
settings = Settings()
