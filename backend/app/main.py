from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.db.session import engine
from app.db.base import Base
from app.routers import auth, reports, admin
import os

# Create Tables (Simplified for Dev)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="KindSteps Support API")

# Configure CORS to allow requests from the frontend
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:5173", # Common Vite port
    "http://127.0.0.1:5500", # Live Server
    "http://localhost:5500", # Live Server (localhost variant)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for development convenience
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount 'uploads' to serve files
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(reports.router, prefix="/reports", tags=["Reports"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the Rescue App API"}
