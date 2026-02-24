import httpx
import asyncio
import json

BASE_URL = "http://127.0.0.1:8000"


async def test_api():
    async with httpx.AsyncClient() as client:
        print("\n--- Testing API Endpoints ---")

        # 1. Signup
        user_data = {
            "full_name": "Test Runner",
            "email": "tester@example.com",
            "phone": "9876543210",
            "password": "testpassword123",
            "role": "admin",  # Making it admin to test admin endpoints later
        }

        print(f"1. Testing Signup (/auth/signup)...")
        try:
            resp = await client.post(f"{BASE_URL}/auth/signup", json=user_data)
            if resp.status_code == 200:
                print("   [SUCCESS] User created.")
            elif resp.status_code == 400 and "Email already registered" in resp.text:
                print("   [INFO] User already exists, proceeding to login.")
            else:
                print(f"   [FAILED] Status: {resp.status_code}, Response: {resp.text}")
        except Exception as e:
            print(f"   [ERROR] Connection failed: {e}")

        # 2. Login
        print(f"2. Testing Login (/auth/login)...")
        login_data = {"username": "tester@example.com", "password": "testpassword123"}
        try:
            resp = await client.post(f"{BASE_URL}/auth/login", data=login_data)
            if resp.status_code == 200:
                token = resp.json().get("access_token")
                print("   [SUCCESS] Login successful, token received.")
                headers = {"Authorization": f"Bearer {token}"}
            else:
                print(f"   [FAILED] Status: {resp.status_code}, Response: {resp.text}")
                return
        except Exception as e:
            print(f"   [ERROR] Connection failed: {e}")
            return

        # 3. Get Me
        print(f"3. Testing Get Current User (/auth/me)...")
        resp = await client.get(f"{BASE_URL}/auth/me", headers=headers)
        if resp.status_code == 200:
            print(f"   [SUCCESS] Profile fetched for {resp.json().get('email')}.")
        else:
            print(f"   [FAILED] Status: {resp.status_code}")

        # 4. Get Stats (Admin Only)
        print(f"4. Testing Admin Stats (/admin/stats)...")
        resp = await client.get(f"{BASE_URL}/admin/stats", headers=headers)
        if resp.status_code == 200:
            print(f"   [SUCCESS] Admin stats retrieved.")
        else:
            print(f"   [FAILED] Status: {resp.status_code}, Detail: {resp.text}")

        # 5. List Reports
        print(f"5. Testing List Reports (/reports/)...")
        resp = await client.get(f"{BASE_URL}/reports/", headers=headers)
        if resp.status_code == 200:
            print(f"   [SUCCESS] Reports list retrieved ({len(resp.json())} reports).")
        else:
            print(f"   [FAILED] Status: {resp.status_code}")


if __name__ == "__main__":
    asyncio.run(test_api())
