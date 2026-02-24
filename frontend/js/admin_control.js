document.addEventListener("DOMContentLoaded", init);

async function init() {
    if (!checkLogin()) return;
    loadStats();
    loadReports();
    loadUsers();

    // Scroll to section when clicking stats
    document.getElementById("stat-users-card")?.addEventListener("click", () => {
        document.getElementById("users-section")?.scrollIntoView({ behavior: "smooth" });
    });
}


// ---------- LOAD STATS ----------
async function loadStats() {
    try {
        const res = await fetchWithAuth(`${API_BASE_URL}/admin/stats`);
        if (!res.ok) return;

        const d = await res.json();

        document.getElementById("stat-total-users").textContent = d.users.total;
        document.getElementById("stat-volunteers").textContent = d.users.volunteers;
        document.getElementById("stat-open-reports").textContent =
            (d.reports.received || 0) + (d.reports.active || 0) + (d.reports.in_progress || 0);
        document.getElementById("stat-resolved-cases").textContent = d.reports.resolved;

    } catch (e) {
        console.error(e);
    }
}




// ---------- LOAD REPORTS ----------
async function loadReports() {
    try {
        const res = await fetchWithAuth(`${API_BASE_URL}/admin/reports`);
        if (!res.ok) return;
        setupFilters(await res.json());
    } catch (e) {
        console.error(e);
    }
}


// ---------- FILTER ----------
function setupFilters(reports) {

    const status = document.getElementById("status-filter");
    const start = document.getElementById("start-date");
    const end = document.getElementById("end-date");
    const search = document.getElementById("admin-search");

    function filter() {

        let list = reports.filter(r => {

            if (status.value !== "all" && r.status !== status.value) return false;

            const date = new Date(r.created_at);

            if (start.value && date < new Date(start.value)) return false;
            if (end.value && date > new Date(end.value)) return false;

            const s = search.value.toLowerCase();

            if (s &&
                !r.id.toString().includes(s) &&
                !r.contact_name.toLowerCase().includes(s) &&
                !r.location.toLowerCase().includes(s))
                return false;

            return true;
        });

        list.sort((a, b) =>
            new Date(b.updated_at || b.created_at) -
            new Date(a.updated_at || a.created_at)
        );

        renderTable(list);
    }

    status.onchange = start.onchange = end.onchange = search.oninput = filter;

    filter();
}


// ---------- TABLE ----------
function renderTable(reports) {

    const body = document.getElementById("report-table-body");

    if (!reports.length) {
        body.innerHTML = `<tr><td colspan="7">No reports found</td></tr>`;
        return;
    }

    body.innerHTML = reports.map(r => {

        const action = `
            <button onclick="viewDetails(${r.id})" class="view-btn">View Details</button>
            <button onclick="deleteReport(${r.id})" class="delete-btn">Delete Report</button>
        `;

        const dateStr = new Date(r.updated_at || r.created_at).toLocaleString();
        const note = r.field_review
            ? `<div class="team-note"><i data-lucide="message-square" style="width:12px"></i> ${r.field_review}</div>`
            : `<div class="no-note">No field updates yet</div>`;

        return `
        <tr>
            <td class="font-bold">RPT-${r.id.toString().padStart(5, "0")}</td>
            <td>${r.contact_name}</td>
            <td>${r.location}</td>
            <td><span class="badge ${getStatusClass(r.status)}">${r.status.replace("_", " ")}</span></td>
            <td><div class="team-info"><i data-lucide="shield" style="width:14px"></i> ${r.assigned_team_name || "Auto-Assigning..."}</div></td>
            <td>
                <div class="update-time">${dateStr}</div>
                ${note}
            </td>
            <td><div class="action-cell">${action}</div></td>
        </tr>`;
    }).join("");

    if (window.lucide) lucide.createIcons();
}

async function deleteReport(id) {
    if (!confirm("Are you sure you want to delete this report? This action cannot be undone.")) return;

    try {
        const res = await fetchWithAuth(`${API_BASE_URL}/admin/reports/${id}`, {
            method: "DELETE"
        });

        if (res.ok) {
            alert("Report deleted successfully");
            loadReports();
            loadStats();
        } else {
            const err = await res.json();
            alert(err.detail || "Failed to delete report");
        }
    } catch (e) {
        alert("Server error");
    }
}




// ---------- VIEW ----------
function viewDetails(id) {
    location.href = `view_report.html?id=${id}`;
}


// ---------- STATUS CLASS ----------
function getStatusClass(status) {

    const map = {
        received: "pending",
        active: "active",
        in_progress: "progress",
        resolved: "resolved"
    };

    return map[status?.toLowerCase()] || "";
}

// ---------- USERS ----------

async function loadUsers() {
    try {
        const res = await fetchWithAuth(`${API_BASE_URL}/admin/users`);
        if (!res.ok) return;
        const users = await res.json();
        renderUserTable(users);
    } catch (e) {
        console.error(e);
    }
}

function renderUserTable(users) {
    const body = document.getElementById("user-table-body");
    if (!body) return;

    if (!users.length) {
        body.innerHTML = `<tr><td colspan="6">No users found</td></tr>`;
        return;
    }

    body.innerHTML = users.map(u => `
        <tr>
            <td>USR-${String(u.id).padStart(4, '0')}</td>
            <td class="font-bold">${u.full_name}</td>
            <td>${u.email}</td>
            <td><span class="badge ${u.role === 'admin' ? 'resolved' : u.role === 'rescue_team' ? 'progress' : 'active'}">${u.role.replace('_', ' ')}</span></td>
            <td>${new Date(u.created_at).toLocaleDateString()}</td>
            <td>
                <button onclick="deleteUser(${u.id})" class="delete-btn">
                    Delete
                </button>
            </td>
        </tr>
    `).join("");
}

async function deleteUser(id) {
    if (!confirm("Are you sure you want to delete this user? This cannot be undone.")) return;

    try {
        const res = await fetchWithAuth(`${API_BASE_URL}/admin/users/${id}`, {
            method: "DELETE"
        });

        if (res.ok) {
            alert("User deleted successfully");
            loadUsers();
            loadStats();
        } else {
            const err = await res.json();
            alert(err.detail || "Failed to delete user");
        }
    } catch (e) {
        alert("Server error");
    }
}
