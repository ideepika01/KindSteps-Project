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
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"status": "error", "database": str(e)}
        )

# Global error handler to prevent "Internal Server Error" plain text responses
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"GLOBAL ERROR: {exc}")
    import traceback
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": "A server-side error occurred.", "error": str(exc)}
    )

# This runs automatically when the server starts up
@app.on_event("startup")
def on_startup():
    try:
        if engine is None:
            return
        # Creating database tables if they don't exist yet
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        try:
            # Setting up initial data (like the admin account)
            init_db(db)
        finally:
            db.close()
    except Exception as e:
        print(f"Server Startup Note: {e}")
