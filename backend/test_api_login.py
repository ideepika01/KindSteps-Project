from fastapi.testclient import TestClient
from app.main import app
import time

client = TestClient(app)

def test_login_performance():
    # Note: This requires a user to exist with these credentials.
    # If not, it will still measure the time taken to return 401.
    payload = {
        "username": "team@kindsteps.com",
        "password": "password123"
    }
    
    print("\nTesting API Login Performance via TestClient (No Network Overhead)...")
    
    # Warm up
    client.post("/auth/login", data=payload)
    
    durations = []
    for i in range(5):
        start = time.time()
        response = client.post("/auth/login", data=payload)
        end = time.time()
        durations.append(end - start)
        print(f"Attempt {i+1}: {end - start:.4f}s (Status: {response.status_code})")
    
    avg = sum(durations) / len(durations)
    print(f"\nAverage API Internal Latency: {avg:.4f}s")

if __name__ == "__main__":
    test_login_performance()
