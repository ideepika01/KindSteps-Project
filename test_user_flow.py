import requests
import time

# --- CONFIG ---
BASE_URL = "http://localhost:8000" # Use localhost for dry run verification

def test_full_flow():
    print("--- STARTING FULL USER FLOW DRY RUN ---")
    
    # 1. Citizen Signup
    citizen_email = f"citizen_{int(time.time())}@test.com"
    print(f"\n1. Signing up Citizen: {citizen_email}")
    try:
        resp = requests.post(f"{BASE_URL}/auth/signup", json={
            "full_name": "Test Citizen",
            "email": citizen_email,
            "password": "password123",
            "phone": "1234567890",
            "role": "citizen"
        })
        print(f"Signup: {resp.status_code} - {resp.json().get('detail', 'Success')}")
    except Exception as e:
        print(f"Signup failed (is server running?): {e}")
        return

    # 2. Citizen Login
    print(f"\n2. Logging in Citizen...")
    login_resp = requests.post(f"{BASE_URL}/auth/login", data={
        "username": citizen_email,
        "password": "password123"
    })
    token = login_resp.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    print(f"Login: {login_resp.status_code} (Token received)")

    # 3. Submit Report
    print(f"\n3. Submitting Report...")
    report_data = {
        "condition": "Stray dog injured",
        "description": "Found a puppy with a broken leg near Central Park",
        "location": "Central Park South Entrance",
        "contact_name": "Test Citizen",
        "contact_phone": "1234567890",
        "latitude": "12.9716",
        "longitude": "77.5946"
    }
    # reports/ endpoints use Form data
    report_resp = requests.post(f"{BASE_URL}/reports/", headers=headers, data=report_data)
    report_id = report_resp.json().get("id")
    print(f"Report Submitted: ID {report_id} | Status: {report_resp.status_code}")

    # 4. Rescue Team Signup
    team_email = f"team_{int(time.time())}@test.com"
    print(f"\n4. Signing up Rescue Member: {team_email}")
    requests.post(f"{BASE_URL}/auth/signup", json={
        "full_name": "New Rescuer",
        "email": team_email,
        "password": "password123",
        "phone": "0987654321",
        "role": "rescue_team"
    })

    # 5. Rescue Team Login
    print(f"\n5. Logging in Rescue Member...")
    team_login = requests.post(f"{BASE_URL}/auth/login", data={
        "username": team_email,
        "password": "password123"
    })
    team_token = team_login.json().get("access_token")
    team_headers = {"Authorization": f"Bearer {team_token}"}

    # 6. Check Assignments
    print(f"\n6. Checking Team Assignments (Visibility Test)...")
    assignments_resp = requests.get(f"{BASE_URL}/reports/my-assignments", headers=team_headers)
    assignments = assignments_resp.json()
    
    found = any(r['id'] == report_id for r in assignments)
    print(f"Visible in Assignments: {'YES' if found else 'NO'} (Total: {len(assignments)})")

    # 7. Update Status
    if found:
        print(f"\n7. Updating Report Status to 'active'...")
        update_resp = requests.put(f"{BASE_URL}/reports/{report_id}", headers=team_headers, json={
            "status": "active",
            "field_review": "We are on our way!",
            "rescued_location": "En route to clinic"
        })
        print(f"Update: {update_resp.status_code} | New Status: {update_resp.json().get('status')}")

    print("\n--- DRY RUN COMPLETED ---")

if __name__ == "__main__":
    test_full_flow()
