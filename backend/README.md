# Rescue App Backend

This is the FastAPI backend for the Rescue Application.

## Setup

1.  **Install Python**: Ensure you have Python installed (3.10+).
2.  **Create and Activate Virtual Environment** (Required for Windows):
    ```bash
    python -m venv venv
    .\venv\Scripts\activate
    ```
3.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```
4.  **Database**:
    Ensure PostgreSQL is running and your `kindsteps_fullstack_db` database exists.
    Check `.env` for connection details.

## Running the Server

Run the development server command:

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://127.0.0.1:8000`.

## API Documentation

FastAPI provides automatic interactive documentation. Once the server is running, visit:

-   **Swagger UI**: `http://127.0.0.1:8000/docs`
-   **ReDoc**: `http://127.0.0.1:8000/redoc`

## Testing

You can use the Swagger UI to test endpoints:

1.  **Signup**: Create a user via `/auth/signup`.
2.  **Login**: Get a token via `/auth/login`.
3.  **Authorize**: Click the "Authorize" button in Swagger UI and paste the token (`Bearer <token>`).
4.  **Reports**: Try creating and listing reports.
