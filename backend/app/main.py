import sys
import os
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

# Add parent folder to path (for app imports)
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.routers import auth, reports, admin

app = FastAPI(title="KindSteps Support API")


# CORS Middleware Configuration
# CORS Middleware Configuration
# Allows all localhost ports (http) and the production Vercel app (https)
origin_regex = (
    r"https?://(localhost|127\.0\.0\.1)(:\d+)?|https://kindsteps-project\.vercel\.app"
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"DEBUG: Incoming Request: {request.method} {request.url}")
    response = await call_next(request)
    print(f"DEBUG: Response Status: {response.status_code}")
    return response


# API Route Registration
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(reports.router, prefix="/reports", tags=["Reports"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])


# Global Error Handling
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """
    Handle known HTTP exceptions (404, 401, etc.)
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Catch all unhandled exceptions and return readable JSON.
    """
    error_str = str(exc)
    print(f"CRITICAL SERVER ERROR: {error_str}")

    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {error_str}"},
    )


# Application Startup Context
@app.on_event("startup")
def on_startup():
    print("KindSteps server running.")
