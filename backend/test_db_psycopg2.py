import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load env variables
load_dotenv()

db_url = os.getenv("DATABASE_URL")
if not db_url:
    print("Error: DATABASE_URL not found in environment.")
    sys.exit(1)

print(f"Testing connection with URL: {db_url}")

try:
    # Do NOT replace with pg8000, let it use psycopg2 (default for postgresql://)
    engine = create_engine(db_url)
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        print(f"SUCCESS: Connection confirmed! Result: {result.scalar()}")
except Exception as e:
    print(f"FAILURE: {e}")
