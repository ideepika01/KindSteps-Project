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
        import os

        env_file = os.path.join(
            os.path.dirname(
                os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            ),
            ".env",
        )

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
        if "pgbouncer=true" in url:
            try:
                from urllib.parse import urlparse, parse_qs, urlencode, urlunparse

                parsed = urlparse(url)
                qs = parse_qs(parsed.query, keep_blank_values=True)
                if "pgbouncer" in qs:
                    del qs["pgbouncer"]
                new_query = urlencode(qs, doseq=True)
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
            except Exception as e:
                print(f"Error checking pgbouncer param: {e}")
                # Fallback to simple replace if parsing fails
                url = url.replace("?pgbouncer=true", "").replace("&pgbouncer=true", "")

        return url


settings = Settings()
