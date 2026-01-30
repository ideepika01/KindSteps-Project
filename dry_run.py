import subprocess
import time
import httpx
import sys
import os

def dry_run():
    print("Starting KindSteps Backend Dry Run...")
    
    # Ensure we are in the backend directory
    backend_dir = os.path.join(os.getcwd(), "backend")
    
    # Start the backend as a background process
    print("--- Starting server...")
    process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd=backend_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    # Give it a few seconds to start
    time.sleep(5)
    
    try:
        # Check if the process is still running
        if process.poll() is not None:
            stdout, stderr = process.communicate()
            print("FAILED: Backend failed to start.")
            print(f"STDOUT: {stdout}")
            print(f"STDERR: {stderr}")
            return False
            
        # Try to call the health check endpoint
        print("--- Verifying /health endpoint...")
        with httpx.Client(base_url="http://127.0.0.1:8000") as client:
            response = client.get("/health", timeout=10.0)
            if response.status_code == 200:
                print(f"SUCCESS: Health Check: {response.json()}")
            else:
                print(f"FAILED: Health Check: {response.status_code}")
                return False
                
            # Try to call the root endpoint
            print("--- Verifying / endpoint...")
            response = client.get("/", timeout=10.0)
            if response.status_code == 200:
                print(f"SUCCESS: Root endpoint: {response.json()}")
            else:
                print(f"FAILED: Root endpoint: {response.status_code}")
                return False
                
        print("\nDRY RUN SUCCESSFUL!")
        print("The backend is correctly configured and talking to the database.")
        return True
        
    except Exception as e:
        print(f"FAILED: Error during dry run: {e}")
        return False
        
    finally:
        # Stop the backend
        print("--- Stopping server...")
        process.terminate()
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()

if __name__ == "__main__":
    success = dry_run()
    if not success:
        sys.exit(1)
