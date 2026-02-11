from sqlalchemy import text
from app.db.session import engine

def migrate():
    with engine.connect() as conn:
        print("Connected to DB. Attempting migration...")
        try:
            # Adding latitude and longitude if they don't exist
            conn.execute(text("ALTER TABLE reports ADD COLUMN IF NOT EXISTS latitude VARCHAR"))
            conn.execute(text("ALTER TABLE reports ADD COLUMN IF NOT EXISTS longitude VARCHAR"))
            conn.commit()
            print("Successfully added latitude/longitude columns (if they were missing).")
        except Exception as e:
            print(f"Error adding columns: {e}")
            conn.rollback()

if __name__ == "__main__":
    migrate()
