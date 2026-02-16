import sys
import os
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

# Add parent folder to path (for app imports)
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.routers import auth, reports, admin

app = FastAPI(title="KindSteps Support API")


# CORS Middleware Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# API Route Registration
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(reports.router, prefix="/reports", tags=["Reports"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])


# Global Error Handling
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Catch all exceptions and return readable JSON.
    """
    error_str = str(exc)
    print(f"SERVER ERROR: {error_str}")

    return JSONResponse(
        status_code=500,
        content={"detail": f"Server Error: {error_str}"},
    )


# Application Startup Context
@app.on_event("startup")
def on_startup():
    print("KindSteps server running.")
