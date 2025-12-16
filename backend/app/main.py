# =========================================================
# MAIN ENTRY POINT
# This file is where the application starts.
# It sets up the server, database, and connects the "routers".
# =========================================================

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.db.session import engine, Base
from app.routers import auth, reports, admin
import os

# 1. CREATE DATABASE TABLES
# This line tells the database to create any missing tables (User, Report)
# based on our code in 'app/models/'.
Base.metadata.create_all(bind=engine)

# 2. START THE APP
app = FastAPI(title="KindSteps Support API")

# 3. CONFIGURE SECURITY (CORS)
# "CORS" stands for Cross-Origin Resource Sharing.
# Browsers block requests from one website to another by default.
# This code tells the browser: "It's okay to accept requests from these websites."
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow ALL addresses (Easiest for development)
    allow_credentials=True,
    allow_methods=["*"], # Allow all types of actions (GET, POST, etc.)
    allow_headers=["*"],
)

# 4. SETUP FILE UPLOADS
# We need a place to save photos uploaded by users.
# This creates a folder named "uploads" if it doesn't exist.
os.makedirs("uploads", exist_ok=True)
# This lets the frontend "see" the files in that folder.
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# 5. CONNECT ROUTERS
# A "Router" is like a chapter in a book. It groups related code.
# - auth: Handling Login and Sign Up
# - reports: Handling submitting and viewing reports
# - admin: Handling admin dashboards
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(reports.router, prefix="/reports", tags=["Reports"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])

# 6. WELCOME MESSAGE
# A simple check to see if the server is running.
@app.get("/")
def read_root():
    return {"message": "Welcome to the KindSteps API! The server is running."}
