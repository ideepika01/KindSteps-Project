// Global data stores
let allReports = [];
let allUsers = [];

document.addEventListener("DOMContentLoaded", init);

async function init() {
    if (!checkLogin()) return;
    loadStats();
    loadReports();
    loadUsers();

    // Setup event listeners for filtering
    const status = document.getElementById("status-filter");
    const start = document.getElementById("start-date");
    const end = document.getElementById("end-date");
    const search = document.getElementById("admin-search");

    if (status) status.onchange = applyAllFilters;
    if (start) start.onchange = applyAllFilters;
    if (end) end.onchange = applyAllFilters;
    if (search) search.oninput = applyAllFilters;

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

        // Hide "Loading..." text
        const changeEl = document.getElementById("stat-users-change");
        if (changeEl) changeEl.textContent = "Community base";

    } catch (e) {
        console.error(e);
    }
}


// ---------- LOAD DATA ----------

async function loadReports() {
    try {
        const res = await fetchWithAuth(`${API_BASE_URL}/admin/reports`);
        if (!res.ok) return;
        allReports = await res.json();
        applyAllFilters();
    } catch (e) {
        console.error(e);
    }
}

async function loadUsers() {
    try {
        const res = await fetchWithAuth(`${API_BASE_URL}/admin/users`);
        if (!res.ok) return;
        allUsers = await res.json();
        applyAllFilters();
    } catch (e) {
        console.error(e);
    }
}


// ---------- FILTERING LOGIC ----------

function applyAllFilters() {
    const statusVal = document.getElementById("status-filter")?.value || "all";
    const startVal = document.getElementById("start-date")?.value;
    const endVal = document.getElementById("end-date")?.value;
    const searchVal = document.getElementById("admin-search")?.value.toLowerCase() || "";

    // 1. Filter Reports
    let filteredReports = allReports.filter(r => {
        // Status filter
        if (statusVal !== "all" && r.status !== statusVal) return false;

        // Date range filter
        const date = new Date(r.created_at);
        if (startVal && date < new Date(startVal)) return false;
        if (endVal && date > new Date(endVal)) return false;

        // Search filter (ID, Contact Name, Location, Description)
        if (searchVal &&
            !r.id.toString().includes(searchVal) &&
            !r.contact_name.toLowerCase().includes(searchVal) &&
            !r.location.toLowerCase().includes(searchVal) &&
            !r.description.toLowerCase().includes(searchVal))
            return false;

        return true;
    });

    filteredReports.sort((a, b) =>
        new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)
    );

    // 2. Filter Users
    let filteredUsers = allUsers.filter(u => {
        // Search filter (ID, Name, Email, Role)
        if (searchVal &&
            !u.id.toString().includes(searchVal) &&
            !u.full_name.toLowerCase().includes(searchVal) &&
            !u.email.toLowerCase().includes(searchVal) &&
            !u.role.toLowerCase().includes(searchVal))
            return false;

        return true;
    });

    // Render both tables
    renderReportTable(filteredReports);
    renderUserTable(filteredUsers);
}


// ---------- TABLE RENDERING ----------

function renderReportTable(reports) {
    const body = document.getElementById("report-table-body");
    if (!body) return;

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


// ---------- ACTIONS & UTILS ----------

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

function viewDetails(id) {
    location.href = `view_report.html?id=${id}`;
}

function getStatusClass(status) {
    const map = {
        received: "pending",
        active: "active",
        in_progress: "progress",
        resolved: "resolved"
    };
    return map[status?.toLowerCase()] || "";
}

