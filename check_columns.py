from sqlalchemy import text
from app.db.session import engine

def check_columns():
    with engine.connect() as conn:
        try:
            result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'reports'"))
            columns = [row[0] for row in result]
            print(f"Columns in 'reports' table: {columns}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    check_columns()
