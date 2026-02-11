# KindSteps API: Core server file that handles routing and database setup.
import sys
import os

# Ensuring the 'app' module can be found by the system
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.session import engine, Base, SessionLocal
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
