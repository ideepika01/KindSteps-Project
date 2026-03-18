from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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


# Include routers
app.include_router(auth.router, prefix="/auth")
app.include_router(reports.router, prefix="/reports")
app.include_router(admin.router, prefix="/admin")