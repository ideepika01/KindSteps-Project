document.addEventListener("DOMContentLoaded", init);

async function init() {
    if (!checkLogin()) return;
    loadStats();
    loadReports();
    loadUsers();
}


let allReports = [];
let allUsers = [];

// ---------- LOAD USERS ----------
async function loadUsers() {
    try {
        const res = await fetchWithAuth(`${API_BASE_URL}/admin/users`);

        if (!res.ok) {
            document.getElementById("user-table-body").innerHTML =
                `<tr><td colspan="6" style="color:red; text-align:center;">
                    Error loading users: ${res.status}
                </td></tr>`;
            return;
        }

        allUsers = await res.json();
        if (typeof applyFilters === "function") applyFilters();
        else renderUserTable(allUsers);

    } catch (e) {
        console.error(e);
        document.getElementById("user-table-body").innerHTML =
            `<tr><td colspan="6" style="color:red; text-align:center;">
                Network Error: ${e.message}
            </td></tr>`;
    }
}


function renderUserTable(users) {
    const body = document.getElementById("user-table-body");
    if (!users.length) {
        body.innerHTML = `<tr><td colspan="6" style="text-align:center;">No users found matching your search</td></tr>`;
        return;
    }

    body.innerHTML = users.map(u => {
        return `
        <tr>
            <td>USR-${u.id.toString().padStart(4, "0")}</td>
            <td>${u.full_name}</td>
            <td>${u.email}</td>
            <td><span class="badge ${u.role === 'admin' ? 'resolved' : 'active'}">${u.role}</span></td>
            <td>${new Date(u.created_at || Date.now()).toLocaleDateString()}</td>
            <td>
                <button class="view-btn" onclick="deleteUser(${u.id}, '${u.full_name}')" 
                    style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85rem;">
                    Delete
                </button>
            </td>
        </tr>`;
    }).join("");
}


async function deleteUser(id, name) {
    if (!confirm(`Are you sure you want to delete user "${name}"? This action cannot be undone.`)) {
        return;
    }

    try {
        const res = await fetchWithAuth(`${API_BASE_URL}/admin/users/${id}`, {
            method: "DELETE"
        });

        if (res.ok) {
            alert("User deleted successfully.");
            loadUsers();
            loadStats(); // Update the user count stat
        } else {
            const err = await res.json();
            alert(`Delete failed: ${err.detail || res.statusText}`);
        }
    } catch (e) {
        console.error(e);
        alert(`Error: ${e.message}`);
    }
}



// ---------- LOAD STATS ----------
async function loadStats() {
    try {
        const res = await fetchWithAuth(`${API_BASE_URL}/admin/stats`);
        if (!res.ok) {
            console.error("Stats load failed", res.status);
            return;
        }

        const d = await res.json();

        document.getElementById("stat-total-users").textContent = d.users.total;
        document.getElementById("stat-volunteers").textContent = d.users.volunteers;
        document.getElementById("stat-open-reports").textContent =
            d.reports.received + d.reports.active + d.reports.in_progress;
        document.getElementById("stat-resolved-cases").textContent = d.reports.resolved;

    } catch (e) {
        console.error(e);
        document.querySelectorAll(".stat-number").forEach(el => el.textContent = "Err");
    }
}


// ---------- LOAD REPORTS ----------
async function loadReports() {
    try {
        const res = await fetchWithAuth(`${API_BASE_URL}/admin/reports`);

        if (!res.ok) {
            document.getElementById("report-table-body").innerHTML =
                `<tr><td colspan="7" style="color:red; text-align:center;">
                    Error loading reports: ${res.status} ${res.statusText}
                </td></tr>`;
            return;
        }

        allReports = await res.json();
        setupFiltersAndTriggers();

    } catch (e) {
        console.error(e);
        document.getElementById("report-table-body").innerHTML =
            `<tr><td colspan="7" style="color:red; text-align:center;">
                Network/Server Error: ${e.message}
            </td></tr>`;
    }
}


// ---------- FILTER ----------
function applyFilters() {
    const status = document.getElementById("status-filter");
    const start = document.getElementById("start-date");
    const end = document.getElementById("end-date");
    const search = document.getElementById("admin-search");

    if (!status || !search) return; // UI not ready

    const s = search.value.toLowerCase();

    // 1. Filter Reports
    let filteredReports = allReports.filter(r => {
        // Role/Status Filter
        if (status.value !== "all" && r.status !== status.value) return false;

        // Date Filters
        const reportDate = new Date(r.created_at);
        const reportMidnight = new Date(reportDate);
        reportMidnight.setHours(0, 0, 0, 0);

        if (start.value) {
            const startDate = new Date(start.value);
            startDate.setHours(0, 0, 0, 0);
            if (reportMidnight < startDate) return false;
        }
        if (end.value) {
            const endDate = new Date(end.value);
            endDate.setHours(0, 0, 0, 0);
            if (reportMidnight > endDate) return false;
        }

        // Search Filter
        if (s &&
            !r.id.toString().includes(s) &&
            !r.contact_name.toLowerCase().includes(s) &&
            !r.location.toLowerCase().includes(s))
            return false;

        return true;
    });

    // 2. Filter Users
    let filteredUsers = allUsers.filter(u => {
        if (!s) return true;
        return (
            u.id.toString().includes(s) ||
            u.full_name.toLowerCase().includes(s) ||
            u.email.toLowerCase().includes(s) ||
            u.role.toLowerCase().includes(s)
        );
    });

    // Sort Reports
    filteredReports.sort((a, b) =>
        new Date(b.updated_at || b.created_at) -
        new Date(a.updated_at || a.created_at)
    );

    renderTable(filteredReports);
    renderUserTable(filteredUsers);
}

function setupFiltersAndTriggers() {
    const status = document.getElementById("status-filter");
    const start = document.getElementById("start-date");
    const end = document.getElementById("end-date");
    const search = document.getElementById("admin-search");

    if (!status || !search) return;

    // Attach listeners
    status.onchange = start.onchange = end.onchange = search.oninput = applyFilters;

    // Initial run
    applyFilters();
}




// ---------- TABLE ----------
function renderTable(reports) {

    const body = document.getElementById("report-table-body");

    if (!reports.length) {
        body.innerHTML = `<tr><td colspan="7">No reports found</td></tr>`;
        return;
    }

    body.innerHTML = reports.map(r => {
        const notes = r.field_review
            ? `<div class="team-note">${r.field_review.substring(0, 50)}${r.field_review.length > 50 ? '...' : ''}</div>`
            : '<div class="no-note">No updates yet</div>';

        return `
        <tr>
            <td>RPT-${r.id.toString().padStart(5, "0")}</td>
            <td>${r.contact_name}</td>
            <td>${r.location}</td>
            <td><span class="${getStatusClass(r.status)}">${r.status}</span></td>
            <td>${r.assigned_team_name || "Team Alpha"}</td>
            <td>
                <div class="update-time">${new Date(r.updated_at || r.created_at).toLocaleString()}</div>
                ${notes}
            </td>
            <td>
                <button class="view-btn" onclick="viewDetails(${r.id})" 
                    style="background: #1e293b; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85rem;">
                    View
                </button>
            </td>
        </tr>`;
    }).join("");
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
