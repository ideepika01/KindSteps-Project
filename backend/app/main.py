import sys
import os
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException


# fix import path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


from app.routers import auth, reports, admin


# create fastapi app
app = FastAPI(title="KindSteps Support API")


# allowed frontend urls
origin_regex = r"https?://(localhost|127\.0\.0\.1)(:\d+)?|https://kindsteps-project\.vercel\.app"


# enable cors
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# log every request
@app.middleware("http")
async def log_requests(request: Request, call_next):

    print(f"{request.method} {request.url}")

    response = await call_next(request)

    return response



# connect route files
app.include_router(auth.router, prefix="/auth")
app.include_router(reports.router, prefix="/reports")
app.include_router(admin.router, prefix="/admin")



# handle http errors
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):

    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )



# handle server errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):

    print("ERROR:", exc)

    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error"},
    )



# run on startup
@app.on_event("startup")
def startup():

    print("KindSteps API started")