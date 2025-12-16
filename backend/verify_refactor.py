
import sys
import os

print("--- Starting Verification Script ---", flush=True)

# Ensure backend dir is in python path
sys.path.append(os.getcwd())
print(f"CWD: {os.getcwd()}", flush=True)

try:
    print("Importing app.main...", flush=True)
    from app.main import app
    print("[OK] Import app.main success", flush=True)
    
    print("Importing app.db.session...", flush=True)
    from app.db.session import engine
    print("[OK] Import app.db.session success", flush=True)
    
    from sqlalchemy import text
    from fastapi.testclient import TestClient
    client = TestClient(app)

    def test_db_connection():
        print("Testing DB Connection...", flush=True)
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            print("[OK] Database connection successful", flush=True)
        except Exception as e:
            print(f"[FAIL] Database connection failed: {e}", flush=True)
            # Don't exit, try other tests? No, db is critical.
            # sys.exit(1)

    def test_root_endpoint():
        print("Testing Root Endpoint...", flush=True)
        response = client.get("/")
        if response.status_code == 200:
            print(f"[OK] Root endpoint accessible: {response.json()}", flush=True)
        else:
            print(f"[FAIL] Root endpoint failed: {response.status_code}", flush=True)

    if __name__ == "__main__":
        test_db_connection()
        test_root_endpoint()
        print("--- Verification Complete ---", flush=True)

except Exception as e:
    print(f"[FAIL] Critical Error during imports: {e}", flush=True)
