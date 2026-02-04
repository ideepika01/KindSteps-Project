from sqlalchemy import text
from app.db.session import engine

def add_column_safely(connection, table, column, col_type):
    try:
        connection.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {col_type};"))
        connection.commit()
        print(f"Added {column} column.")
    except Exception as e:
        connection.rollback()
        print(f"{column} column might already exist or error: {e}")

def update_schema():
    print("Updating reports table schema...")
    with engine.connect() as connection:
        add_column_safely(connection, "reports", "rescued_location", "VARCHAR")
        add_column_safely(connection, "reports", "updated_at", "TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP")
        add_column_safely(connection, "reports", "latitude", "VARCHAR")
        add_column_safely(connection, "reports", "longitude", "VARCHAR")
        add_column_safely(connection, "reports", "field_review", "TEXT")

    print("Schema update completed.")

if __name__ == "__main__":
    update_schema()
