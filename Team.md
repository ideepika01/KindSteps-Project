<!-- 1. Team Login -->

pages/signup.html
  └── js/auth.js
        ├── signup() → send("/auth/signup", { role: "rescue_team" })
        ├── login() → send("/auth/login")
        ├── saveToken() → utils.js
        └── handleRedirect() → role === "rescue_team"
              └── location.href = "rescue_team.html"

backend/app/routers/auth.py
  ├── POST /auth/signup → signup() → hash_password()
  └── POST /auth/login  → login() → create_access_token()

database → users table (role = rescue_team)


<!-- 2. Team Dashboard Loads -->

pages/rescue_team.html
  └── js/rescue_team.js
        └── DOMContentLoaded
              ├── checkLogin()     → utils.js → getToken()
              └── load()           → fetchWithAuth()
                    └── GET /reports/my-assignments

backend/app/routers/reports.py
  └── my_assignments()
        ├── Depends(get_current_user) → dependencies.py → JWT decode
        ├── check_staff()             → verify role is rescue_team or admin
        └── db.query(Report).filter(Report.assigned_team_id == current_user.id).all()
              └── returns ONLY reports assigned to this team member

database → reports table (filtered by assigned_team_id)


<!-- 3. Dashboard Stats Update -->

js/rescue_team.js
  └── load()
        └── updateStats(reports)
              └── reports.reduce((a, r) => {
                    a.total++
                    if status === "resolved"    → a.resolved++
                    if status === "in_progress" → a.progress++
                    return a
                  }, { total:0, progress:0, resolved:0 })
              └── set("stat-total", s.total)
              └── set("stat-progress", s.progress)
              └── set("stat-resolved", s.resolved)
                    └── set() → document.getElementById(id).textContent = val


<!-- 4. Filter Cases -->

pages/rescue_team.html → #status-filter, #start-date, #end-date
  └── js/rescue_team.js
        └── setupFilters(reports, grid)
              ├── status.onchange = start.onchange = end.onchange = apply
              └── apply()
                    └── reports.filter(r => {
                          if status !== "all" && r.status !== s → return false
                          if date < startDate               → return false
                          if date > endDate                 → return false
                          return true
                        })
                    └── render(filtered, grid)
                          └── grid.innerHTML = list.map((r,i) => card(r,i)).join("")
                                └── lucide?.createIcons()


<!-- 5. Team Clicks Case → View Full Report -->

pages/rescue_team.html → card → "Update Status" button
  └── href="./view_report.html?id=${r.id}"
        └── pages/view_report.html
              └── js/view_report.js
                    └── DOMContentLoaded
                          ├── checkLogin()
                          ├── new URLSearchParams(location.search).get("id")
                          └── loadReportData(id)
                                └── fetchWithAuth() → GET /reports/{id}

backend/app/routers/reports.py
  └── get_report()
        ├── Depends(get_current_user)
        ├── db.query(Report).filter(Report.id == id).first()
        └── returns full report with all fields

js/view_report.js
  └── renderReport(r)
        ├── safeText("case-title", r.condition)
        ├── safeText("summary-text", r.description)
        ├── safeText("reporter-name", r.contact_name)
        ├── safeText("reporter-phone", r.contact_phone)
        ├── safeText("location-text", r.location)
        ├── img.src = r.photo_url        → renders base64 image
        └── L.map("view-map")            → Leaflet map with report pin
              └── L.marker([r.latitude, r.longitude]).bindPopup(r.location)


<!-- 6. Team Updates Case Status -->

pages/view_report.html → #status-dropdown, #field-review, #rescued-location
  └── js/view_report.js
        └── btn.onclick → updateCase(r.id)
              ├── statusEl.value    → get selected status
              ├── reviewEl.value    → get field notes
              ├── destEl.value      → get rescue destination
              ├── if status === "resolved" && (!review || !dest)
              │     → alert("Field notes and rescue destination required")
              └── fetchWithAuth(`${API_BASE_URL}/reports/${id}`, {
                    method: "PUT",
                    body: { status, field_review, rescued_location }
                  })

backend/app/routers/reports.py
  └── update_report()
        ├── Depends(get_current_user)
        ├── check_staff()              → verify role
        ├── db.query(Report).filter(Report.id == id).first()
        ├── report_update.model_dump(exclude_unset=True)
        │     └── returns only fields that were sent
        ├── for key, value in data.items():
        │     └── setattr(report, key, value)  → dynamically updates each field
        ├── db.commit()
        └── db.refresh(report)

database → reports table updated
js/view_report.js → location.reload()


<!-- 7. Team Navigates Back -->

pages/view_report.html → #back-to-dash button
  └── js/view_report.js
        └── handleBackToDashboard()
              └── localStorage.getItem("user_role")
                    └── role === "rescue_team"
                          → location.href = "rescue_team.html"