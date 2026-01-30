import subprocess
import time
import httpx
import sys
import os

def verify_login():
    print("Starting Login Verification on Port 8100...")
    
    backend_dir = os.path.join(os.getcwd(), "backend")
    
    # Start the backend on port 8100
    print("--- Starting server on 8100...")
    process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8100"],
        cwd=backend_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    time.sleep(5)
    
    try:
        if process.poll() is not None:
             stdout, stderr = process.communicate()
             print("FAILED: Backend failed to start.")
             print(f"STDERR: {stderr}")
             return False

        with httpx.Client(base_url="http://127.0.0.1:8100") as client:
            # 1. Check health
            print("--- Checking health...")
            res = client.get("/health")
            print(f"Health: {res.json()}")

            # 2. Try Login
            print("--- Attempting Admin Login...")
            login_data = {
                "username": "admin@kindsteps.com",
                "password": "admin123"
            }
            # uvicorn expects form data for OAuth2PasswordRequestForm
            res = client.post("/auth/login", data=login_data)
            
            if res.status_code == 200:
                print("SUCCESS: ADMIN LOGIN SUCCESSFUL!")
                print(f"Token: {res.json()['access_token'][:20]}...")
            else:
                print(f"FAILED: ADMIN LOGIN FAILED: {res.status_code}")
                print(f"Detail: {res.text}")
                return False

            # 3. Try Team Login
            print("--- Attempting Team Login...")
            login_data["username"] = "team@kindsteps.com"
            login_data["password"] = "team123"
            res = client.post("/auth/login", data=login_data)
            
            if res.status_code == 200:
                print("SUCCESS: TEAM LOGIN SUCCESSFUL!")
            else:
                print(f"FAILED: TEAM LOGIN FAILED: {res.status_code}")
                return False

        print("\nDRY RUN SUCCESSFUL!")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    finally:
        print("--- Stopping server...")
        process.terminate()
        process.wait()

if __name__ == "__main__":
    success = verify_login()
    if not success:
        sys.exit(1)
