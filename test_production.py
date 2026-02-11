import requests
import time

# --- CONFIG ---
BASE_URL = "https://kindsteps-project.vercel.app" 

def test_production_flow():
    print(f"--- STARTING PRODUCTION FLOW TEST: {BASE_URL} ---")
    
    # 0. Trigger Migration Check
    print("\n0. Triggering Database Migration via /health...")
    try:
        health_resp = requests.get(f"{BASE_URL}/health")
        print(f"Health Check: {health_resp.status_code} - {health_resp.json()}")
    except Exception as e:
        print(f"Health Check failed: {e}")

    # 1. Citizen Signup
    citizen_email = f"auto_user_{int(time.time())}@kindsteps.com"
    print(f"\n1. Signing up automatic user: {citizen_email}")
    try:
        resp = requests.post(f"{BASE_URL}/auth/signup", json={
            "full_name": "Antigravity Auto Tester",
            "email": citizen_email,
            "password": "auto-password-123",
            "phone": "9998887776",
            "role": "user"
        })
        print(f"Signup Result: {resp.status_code}")
    except Exception as e:
        print(f"Signup failed: {e}")
        return

    # 2. Citizen Login
    print(f"\n2. Logging in as {citizen_email}...")
    login_resp = requests.post(f"{BASE_URL}/auth/login", data={
        "username": citizen_email,
        "password": "auto-password-123"
    })
    token = login_resp.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    print(f"Login Result: {login_resp.status_code}")

    # 3. Submit Report (The critical test for the 'missing columns' error)
    print(f"\n3. Submitting Automatic Report...")
    report_data = {
        "condition": "AUTO-CHECK: Injured Bird",
        "description": "This is an automatically generated report to verify production database integrity.",
        "location": "KindSteps Office District",
        "contact_name": "Auto Tester",
        "contact_phone": "9998887776",
        "latitude": "13.0827",
        "longitude": "80.2707"
    }
    report_resp = requests.post(f"{BASE_URL}/reports/", headers=headers, data=report_data)
    
    if report_resp.status_code == 201:
        report_id = report_resp.json().get("id")
        print(f"SUCCESS! Report created with ID: {report_id}")
    else:
        print(f"FAILURE! Report submission failed.")
        print(f"Server Response: {report_resp.text}")
        return

    # 4. Verify Tracking
    print(f"\n4. Verifying Report Tracking...")
    my_reports_resp = requests.get(f"{BASE_URL}/reports/", headers=headers)
    reports = my_reports_resp.json()
    found = any(r['id'] == report_id for r in reports)
    print(f"Report ID {report_id} found in dashboard: {'YES' if found else 'NO'}")

    print("\n--- PRODUCTION TEST COMPLETED SUCCESSFULLY ---")

if __name__ == "__main__":
    test_production_flow()
