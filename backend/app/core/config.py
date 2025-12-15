from pydantic_settings import BaseSettings, SettingsConfigDict
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "KindSteps Support"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:AcademyRootPassword@localhost/kindsteps_fullstack_db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "secret_key")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    model_config = SettingsConfigDict(case_sensitive=True)

settings = Settings()
