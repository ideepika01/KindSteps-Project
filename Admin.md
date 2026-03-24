<!-- 1. Admin Login -->

pages/signup.html
  └── js/auth.js
        ├── login() → send("/auth/login")
        ├── saveToken() → utils.js
        └── handleRedirect()
              └── role === "admin"
                    → location.href = "admin_control.html"

backend/app/routers/auth.py
  └── POST /auth/login → login() → create_access_token()

database → users table (role = admin, seeded by init_db.py)


<!-- 2. Admin Dashboard Loads -->

pages/admin_control.html
  └── js/admin_control.js
        └── DOMContentLoaded → init()
              ├── checkLogin()
              └── Promise.all([
                    loadStats(),    → GET /admin/stats
                    loadReports(),  → GET /admin/reports
                    loadUsers()     → GET /admin/users
                  ])
              └── setupFilters()

backend/app/routers/admin.py
  ├── GET /admin/stats
  │     └── require_staff()           → admin or rescue_team only
  │     └── admin_service.get_dashboard_stats(db)
  │           ├── db.query(User).count()
  │           ├── db.query(Report).count()
  │           └── db.query(Report).filter(status == ...).count() × 4 statuses
  │
  ├── GET /admin/reports
  │     └── require_admin()           → admin ONLY
  │     └── admin_service.list_reports(db)
  │           └── db.query(Report).all()  → ALL reports, no filter
  │
  └── GET /admin/users
        └── require_admin()           → admin ONLY
        └── admin_service.list_users(db)
              └── db.query(User).all()    → ALL users

database → reports table + users table


<!-- 3. Stats Rendered on Dashboard -->

js/admin_control.js
  └── loadStats()
        └── fetchJSON(`${API_BASE_URL}/admin/stats`)
              └── document.getElementById("stat-total-users").textContent = d.users.total
              └── document.getElementById("stat-total-reports").textContent = d.reports.total
              └── stat-open-reports = received + active + in_progress
              └── stat-resolved-cases = d.reports.resolved


<!-- 4. Admin Filters Reports + Users -->

pages/admin_control.html → #status-filter, #start-date, #end-date, #admin-search
  └── js/admin_control.js
        └── setupFilters()
              ├── ["status-filter","start-date","end-date"]
              │     .forEach(id → addEventListener("change", applyAllFilters))
              └── admin-search → addEventListener("input", applyAllFilters)

        └── applyAllFilters()
              ├── allReports.filter(r => {
              │     if status !== "all" && r.status !== status → false
              │     if date < startDate                        → false
              │     if date > endDate                          → false
              │     const text = `${r.id} ${r.contact_name} ${r.location}`
              │     return text.includes(search)               → search filter
              │   })
              ├── renderReportTable(filteredReports)
              └── renderUserTable(filteredUsers)


<!-- 5. Admin Views Report Detail -->

pages/admin_control.html → report table → "View" button
  └── js/admin_control.js
        └── viewDetails(id)
              └── location.href = `view_report.html?id=${id}`
                    └── pages/view_report.html
                          └── js/view_report.js
                                └── loadReportData(id)
                                      └── fetchWithAuth() → GET /reports/{id}

backend/app/routers/reports.py
  └── get_report()
        ├── Depends(get_current_user)
        └── returns full report (admin sees any report — no reporter_id filter)


<!-- 6. Admin Deletes Report -->

pages/admin_control.html → report table → "Delete" button
  └── js/admin_control.js
        └── deleteReport(id)
              ├── confirm("Delete this report permanently?")
              │     └── if cancelled → return (do nothing)
              └── fetchWithAuth(`${API_BASE_URL}/admin/reports/${id}`, {
                    method: "DELETE"
                  })

backend/app/routers/admin.py
  └── DELETE /admin/reports/{report_id}
        ├── require_admin()                → admin ONLY
        └── admin_service.delete_report(db, report_id)
              ├── db.query(Report).filter(Report.id == report_id).first()
              ├── if not report → raise HTTPException(404)
              ├── db.delete(report)
              └── db.commit()

database → report permanently deleted
js/admin_control.js → loadReports() + loadStats()  → refresh UI


<!-- 7. Admin Deletes User -->

pages/admin_control.html → users table → "Delete" button
  └── js/admin_control.js
        └── deleteUser(id)
              ├── confirm("Delete this user permanently?")
              └── fetchWithAuth(`${API_BASE_URL}/admin/users/${id}`, {
                    method: "DELETE"
                  })

backend/app/routers/admin.py
  └── DELETE /admin/users/{user_id}
        ├── require_admin()
        └── admin_service.delete_user(db, user_id, current_user)
              ├── if user.id == current_user.id
              │     → raise HTTPException(400, "Cannot delete yourself")
              ├── db.delete(user)
              └── db.commit()

database → user permanently deleted
js/admin_control.js → loadUsers() + loadStats()  → refresh UI


<!-- 8. Admin Assigns Report to Team -->

backend/app/routers/admin.py
  └── POST /admin/reports/{report_id}/assign?team_id={id}
        ├── require_admin()
        └── admin_service.assign_report(db, report_id, team_id)
              ├── verify report exists
              ├── verify team_id belongs to a rescue_team user
              ├── report.assigned_team_id = team_id
              ├── report.status = ReportStatus.in_progress.value
              └── db.commit()

database → reports table updated (assigned_team_id + status)


<!-- 9. Admin Navigates Back (from view_report) -->

pages/view_report.html → #back-to-dash
  └── js/view_report.js
        └── handleBackToDashboard()
              └── localStorage.getItem("user_role")
                    └── role === "admin"
                          → location.href = "admin_control.html"