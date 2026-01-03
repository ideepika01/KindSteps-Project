# This script is used to initialize the database before the application starts.
# It runs the table creation and seeds the initial users if they don't exist.
# Usage: python -m app.initial_setup

import logging
from app.db.session import engine, SessionLocal, Base
from app.db.init_db import init_db
from app.models.user import User
from app.models.report import Report

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    logger.info("Starting database initialization...")
    
    # Create valid session
    db = SessionLocal()
    try:
        # verifying connection
        with engine.connect() as connection:
            logger.info("Database connection successful.")
            
        # Custom check for creating tables
        logger.info("Creating database tables...")
        Base.metadata.create_all(bind=engine)

        # Run initialization
        init_db(db)
        logger.info("Database initialization completed successfully.")
        
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    main()
