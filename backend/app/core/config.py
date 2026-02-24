from pydantic_settings import BaseSettings
import os
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse


class Settings(BaseSettings):
    PROJECT_NAME: str = "KindSteps Support"

    # database url from .env
    DATABASE_URL: str = ""

    # jwt auth settings
    SECRET_KEY: str = "secretkey123"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # gemini api key
    GEMINI_API_KEY: str = ""

    class Config:
        # load .env file automatically
        env_file = os.path.join(
            os.path.dirname(
                os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            ),
            ".env",
        )

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:

        # use local db if env not set
        if not self.DATABASE_URL:
            print("WARNING: Using local database")

            return "postgresql+pg8000://postgres:AcademyRootPassword@localhost:5432/kindsteps_fullstack_db"

        url = self.DATABASE_URL

        # force pg8000 driver
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+pg8000://", 1)

        elif url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+pg8000://", 1)

        # remove pgbouncer param if exists
        if "pgbouncer=true" in url:
            try:
                parsed = urlparse(url)

                query = parse_qs(parsed.query, keep_blank_values=True)

                query.pop("pgbouncer", None)

                new_query = urlencode(query, doseq=True)

                url = urlunparse(
                    (
                        parsed.scheme,
                        parsed.netloc,
                        parsed.path,
                        parsed.params,
                        new_query,
                        parsed.fragment,
                    )
                )

            except Exception:
                url = url.replace("?pgbouncer=true", "").replace("&pgbouncer=true", "")

        return url


# create settings object
settings = Settings()
