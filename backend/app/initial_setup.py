import logging
from app.db.session import engine, SessionLocal, Base
from app.db.init_db import init_db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    db = SessionLocal()
    try:
        Base.metadata.create_all(bind=engine)
        init_db(db)
        logger.info("Database initialization completed.")
    except Exception as e:
        logger.error(f"Initialization failed: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    main()
