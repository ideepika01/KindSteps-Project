# KindSteps API: Core server file that handles routing and database setup.
import sys
import os

# Ensuring the 'app' module can be found by the system
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, Request, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.db.session import engine, Base, SessionLocal, get_db
from app.models import User, Report # Ensure all models are loaded
from app.routers import auth, reports, admin
from app.db.init_db import init_db

# Creating our main application
app = FastAPI(title="KindSteps Support API")

# Setting up CORS so our frontend can talk to our backend normally
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"], 
    allow_headers=["*"],
)

# Plugging in our different feature sections (Auth, Reports, Admin)
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(reports.router, prefix="/reports", tags=["Reports"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])

# A simple health check to make sure the server and DB are alive
@app.get("/health")
def health_check(db = Depends(get_db)):
    try:
        from sqlalchemy import text
        # We also trigger migrations here so the user can "force" an update via browser
        run_migrations()
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected", "migration": "checked"}
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"status": "error", "database": str(e)}
        )

# Helper function to ensure DB is up to date
def run_migrations():
    try:
        if engine is None:
            return
        
        # 1. Ensure tables exist
        Base.metadata.create_all(bind=engine)
        
        # 2. Add any missing columns manually
        db = SessionLocal()
        try:
            from sqlalchemy import text
            columns = [
                ("latitude", "VARCHAR"),
                ("longitude", "VARCHAR"),
                ("assigned_team_id", "INTEGER"),
                ("rescued_location", "VARCHAR"),
                ("field_review", "TEXT"),
                ("created_at", "TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP"),
                ("updated_at", "TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP")
            ]
            for col_name, col_type in columns:
                try:
                    # Using a sub-transaction block-like approach for each column
                    db.execute(text(f"ALTER TABLE reports ADD COLUMN IF NOT EXISTS {col_name} {col_type}"))
                    db.commit()
                except Exception as e:
                    db.rollback()
                    print(f"Column check for {col_name}: {e}")
            
            # 3. Seed initial data
            init_db(db)
        finally:
            db.close()
    except Exception as e:
        print(f"Migration Error: {e}")

# Run migrations immediately on module load (Best for Vercel/Serverless)
run_migrations()

# Global error handler to prevent "Internal Server Error" plain text responses
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_str = str(exc)
    print(f"GLOBAL ERROR: {error_str}")
    # If it's a missing column error, we provide a very specific instruction
    if "does not exist" in error_str:
        return JSONResponse(
            status_code=500,
            content={
                "detail": f"Database out of sync: {error_str}. Please visit /health to fix this.",
                "error": error_str,
                "fix": "Go to /health in your browser to trigger a database update."
            }
        )
    
    import traceback
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": f"Server Error: {error_str}", "error": error_str}
    )

# Keeping the startup event for logging/other needs
@app.on_event("startup")
def on_startup():
    print("Server has started and migrations have been checked.")
