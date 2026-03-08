from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import time
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.routers import auth, reports, admin


app = FastAPI(title="KindSteps Support API")


# Allowed frontend URLs
origin_regex = r"https?://(localhost|127\.0\.0\.1)(:\d+)?|https://kindsteps-project\.vercel\.app"


# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Log every request and measure time
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    print(f"DEBUG: {request.method} {request.url.path} - Total Process Time: {process_time:.4f}s")
    response.headers["X-Process-Time"] = str(process_time)
    return response


# Include routers
app.include_router(auth.router, prefix="/auth")
app.include_router(reports.router, prefix="/reports")
app.include_router(admin.router, prefix="/admin")


# Handle HTTP errors
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


# Handle unexpected server errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print("ERROR:", exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error"},
    )