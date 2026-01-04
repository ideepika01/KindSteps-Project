import sys
import os

# Add the parent directory (backend/) to sys.path so we can import 'app'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.db.session import engine, Base, SessionLocal
from app.routers import auth, reports, admin
from app.db.init_db import init_db
import os

# Base.metadata.create_all(bind=engine)

# Database is initialized via app.initial_setup script now


app = FastAPI(title="KindSteps Support API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"], 
    allow_headers=["*"],
)

# Ensure upload directory exists (use /tmp on Vercel)
UPLOAD_DIR = "/tmp/uploads" if os.environ.get("VERCEL") or os.access("/", os.W_OK) is False else "uploads"
try:
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
except Exception as e:
    print(f"Warning: Could not mount /uploads: {e}")

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(reports.router, prefix="/reports", tags=["Reports"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])

@app.on_event("startup")
def on_startup():
    try:
        if engine is None:
            print("Database engine is None. Skipping startup table creation.")
            return

        # 1. Create Tables
        Base.metadata.create_all(bind=engine)
        
        # 2. Seed Users
        db = SessionLocal()
        try:
            init_db(db)
        finally:
            db.close()
    except Exception as e:
        # Log the error but DO NOT crash the app, so we can at least reach /health
        print(f"STARTUP ERROR: {e}")
        pass

@app.get("/health")
def health_check():
    """Diagnostic endpoint to check DB connection."""
    from app.db.session import DEBUG_DNS_LOG
    
    if engine is None:
         return {"status": "error", "db": "Engine initialization failed", "dns_log": DEBUG_DNS_LOG}

    try:
        # Try to connect to DB
        with engine.connect() as connection:
            return {"status": "ok", "db": "connected", "dns_log": DEBUG_DNS_LOG}
    except Exception as e:
        return {"status": "error", "db": str(e), "dns_log": DEBUG_DNS_LOG}

@app.get("/")
def read_root():
    return {"message": "Welcome to the KindSteps API! The server is running."}
