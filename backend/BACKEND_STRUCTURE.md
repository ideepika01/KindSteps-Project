# Backend Folder Structure Overview

This document provides a concise overview of the **KindSteps** backend layout to make the codebase easier to understand.

## Top‑Level Files
- **`.env`** – Environment variables (database URL, secret keys, etc.).
- **`requirements.txt`** – Python dependencies.
- **`README.md`** – General project setup instructions.
- **`setup_users.py`** – Helper script to create default admin and rescue‑team users.

## `app/` Package
```
app/
├── core/                # Core utilities (e.g., security, hashing)
│   └── security.py      # Password hashing & JWT utilities
├── db/                  # Database session handling
│   └── session.py       # SQLAlchemy session factory
├── models/              # SQLAlchemy ORM models
│   ├── user.py          # User model & role enum
│   └── report.py        # Report model & status/priority enums
├── routers/             # FastAPI route definitions
│   ├── auth.py          # Authentication (signup, login, /me)
│   └── reports.py       # CRUD endpoints for reports
├── schemas/             # Pydantic request/response schemas
│   ├── user.py          # User‑related schemas
│   └── report.py        # Report‑related schemas
└── main.py              # FastAPI application entry point
```

## Supporting Directories
- **`uploads/`** – Stores uploaded report photos (served statically).
- **`venv/`** – Local virtual environment (not version‑controlled).

## How It Works
1. **Entry point** – `app/main.py` creates the FastAPI app, includes routers, and configures CORS.
2. **Authentication** – `app/routers/auth.py` uses OAuth2 password flow; tokens are generated via utilities in `app/core/security.py`.
3. **Database** – `app/db/session.py` provides a `SessionLocal` for dependency injection in routes.
4. **Routes** – `app/routers/reports.py` implements report creation, retrieval, status updates, and public tracking. Access is role‑based (admin & rescue‑team can view all reports; regular users see only theirs).
5. **Schemas** – `app/schemas/*` define request bodies and response models, ensuring type safety and automatic OpenAPI docs.

## Clean‑up Performed
- Removed test scripts: `test_endpoints.py`, `test_rescue_flow.py`, `test_crypto.py`.
- Deleted auxiliary scripts: `debug_hash.py`, `verify_backend.py`.
- The backend now contains only production‑relevant code and the documentation above.

Feel free to refer to this file when navigating the backend folder.
