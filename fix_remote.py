from sqlalchemy import text
import sys
import os

# Ensure backend folder is in path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.db.session import engine, SessionLocal
from app.db.init_db import init_db

def force_db_cleanup():
    print("--- STARTING REMOTE DATABASE CLEANUP (SUPABASE) ---")
    
    columns_to_add = [
        ("latitude", "VARCHAR"),
        ("longitude", "VARCHAR"),
        ("assigned_team_id", "INTEGER"),
        ("rescued_location", "VARCHAR"),
        ("field_review", "TEXT")
    ]
    
    # 1. Manually add columns to Postgres/Supabase
    with engine.connect() as conn:
        print(f"DATABASE CONNECTION: {engine.url.host}")
        for col_name, col_type in columns_to_add:
            print(f"Checking column: {col_name}...")
            try:
                # PostgreSQL specific check for IF NOT EXISTS
                conn.execute(text(f"ALTER TABLE reports ADD COLUMN IF NOT EXISTS {col_name} {col_type}"))
                conn.commit()
                print(f"  - Successfully verified/added {col_name}")
            except Exception as e:
                conn.rollback()
                print(f"  - Note: Could not add {col_name}. Error: {e}")

    # 2. Re-run init_db to ensure default data is healthy
    print("\n--- RUNNING INITIAL DATA SEED ---")
    db = SessionLocal()
    try:
        init_db(db)
        print("Initial data (Admin/Team) verified.")
    except Exception as e:
        print(f"Error seeding data: {e}")
    finally:
        db.close()

    print("\n--- DATABASE CLEANUP COMPLETE ---")

if __name__ == "__main__":
    force_db_cleanup()
