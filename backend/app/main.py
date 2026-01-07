import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.db.session import engine, Base, SessionLocal
from app.routers import auth, reports, admin
from app.db.init_db import init_db

app = FastAPI(title="KindSteps Support API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"], 
    allow_headers=["*"],
)

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
            return
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        try:
            init_db(db)
        finally:
            db.close()
    except Exception as e:
        print(f"Startup Error: {e}")

@app.get("/health")
def health_check():
    if engine is None:
         return {"status": "error", "db": "Engine initialization failed"}
    try:
        with engine.connect():
            return {"status": "ok", "db": "connected"}
    except Exception as e:
        return {"status": "error", "db": str(e)}

@app.get("/")
def read_root():
    return {"message": "Welcome to the KindSteps API! The server is running."}
