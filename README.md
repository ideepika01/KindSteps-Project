
<!-- 1. Login/Signup -->

signup.html
  └── js/auth.js
        ├── DOMContentLoaded → bind("signup-form", signup)
        ├── signup() → send("/auth/signup")
        ├── login() → send("/auth/login")
        ├── saveToken() → utils.js
        └── handleRedirect() → redirects by role

backend/app/routers/auth.py
  ├── POST /auth/signup → signup()
  └── POST /auth/login → login() → create_access_token()
        └── core/security.py → hash_password() / verify_password()

database → users table

<!-- 2.Report page loads -->

pages/report.html
  └── js/report.js
        └── DOMContentLoaded
              ├── checkLogin()       → utils.js → getToken()
              ├── setupPhotoPreview()
              ├── setupAIScan()
              ├── setupFormSubmit()
              └── setupMap()         → Leaflet.js

<!-- 3. Photo Upload + AI analysis -->

pages/report.html → #report-photo (file input)
  └── js/report.js
        └── setupPhotoPreview()
              └── input.onchange → shows #ai-scan-container

        └── setupAIScan()
              └── btn.onclick
                    ├── FormData.append("photo")
                    ├── fetchWithAuth()  → utils.js → getToken()
                    └── POST /reports/ai-analyze

backend/app/routers/reports.py
  └── ai_analyze()
        └── core/ai.py
              └── analyze_image_for_description()
                    ├── genai.Client()
                    ├── gemini-2.0-flash → generate_content()
                    └── returns { description, condition, advice }

js/report.js
  └── data.description → #report-description (textarea)
  └── data.condition   → #report-condition (dropdown)
  └── data.advice      → #ai-advice-list (card)


<!-- 4. Report form submit -->

pages/report.html → #report-form
  └── js/report.js
        └── setupFormSubmit()
              └── btn.onclick
                    ├── validates all fields (regex, length checks)
                    ├── FormData.append() → all fields + photo
                    ├── fetchWithAuth()  → utils.js
                    └── POST /reports/

backend/app/routers/reports.py
  └── create_report()
        ├── Depends(get_current_user) → dependencies.py → JWT decode
        ├── Depends(get_db)           → db/session.py → get_db()
        ├── convert_to_b64(photo)
        ├── db.query(User) → find rescue team
        ├── Report() → create object
        ├── db.add() → db.commit() → db.refresh()
        └── returns ReportResponse (201)

database → reports table
js/report.js → location.href = "my_reports.html"

<!-- 5. User views reports -->

pages/my_reports.html
  └── js/my_reports.js
        └── DOMContentLoaded
              ├── checkLogin()     → utils.js
              ├── fetchWithAuth()  → GET /reports/
              └── renders report cards with status badges

backend/app/routers/reports.py
  └── list_reports()
        ├── Depends(get_current_user)
        ├── if role == user → filter by reporter_id
        └── returns only their reports


<!-- 6. Track Report -->

pages/track_report.html
  └── js/track.js
        └── fetchWithAuth() → GET /reports/{id}

backend/app/routers/reports.py
  └── get_report()
        ├── checks reporter_id == current_user.id
        └── returns report + assigned_team_name (property)
              └── models/report.py → assigned_team_name @property

<!-- 7. Rescue Team Flow -->

pages/rescue_team.html
  └── js/rescue_team.js
        └── DOMContentLoaded
              ├── checkLogin()    → utils.js
              ├── fetchWithAuth() → GET /reports/my-assignments
              └── update status  → PUT /reports/{id}

backend/app/routers/reports.py
  └── my_assignments()
        └── check_staff() → verify role
  └── update_report()
        ├── check_staff()
        ├── report_update.model_dump(exclude_unset=True)
        ├── setattr() loop → update fields
        └── db.commit() → db.refresh()

database → reports table updated


<!-- 8. Admin Flow -->


pages/admin_control.html
  └── js/admin_control.js
        └── DOMContentLoaded
              ├── checkLogin()    → utils.js
              └── fetchWithAuth() → GET /reports/ (all reports)
                                 → GET /admin/ (user management)

backend/app/routers/admin.py
  └── all routes protected by check_staff()

  <!-- Utils -->

utils.js
  ├── getToken()       → localStorage.getItem("access_token")
  ├── saveToken()      → localStorage.setItem()
  ├── clearToken()     → localStorage.removeItem()
  ├── checkLogin()     → getToken() → if no token → logout()
  ├── logout()         → clearToken() → redirect index.html
  ├── fetchWithAuth()  → getToken() → adds Bearer header → fetch()
  │                      if 401 → logout()
  └── setupNavbar()    → logout btn click → logout()


<!-- Database Flow -->


db/session.py
  └── create_engine() → SessionLocal() → Base

models/user.py   → users table
models/report.py → reports table
  └── ForeignKey("users.id") × 2
        ├── reporter_id    → who reported
        └── assigned_team_id → who rescues

db/init_db.py → creates all tables on startup