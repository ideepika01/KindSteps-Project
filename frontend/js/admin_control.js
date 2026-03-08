// Store loaded data
let allReports = [];
let allUsers = [];

document.addEventListener("DOMContentLoaded", init);

// Initialize dashboard
async function init() {
    if (!checkLogin()) return;

    await Promise.all([loadStats(), loadReports(), loadUsers()]);
    setupFilters();

    // Scroll to users section when stats card clicked
    document.getElementById("stat-users-card")
        ?.addEventListener("click", () =>
            document.getElementById("users-section")
                ?.scrollIntoView({ behavior: "smooth" }));
}

// Attach filter events
function setupFilters() {
    ["status-filter","start-date","end-date"]
        .forEach(id => document.getElementById(id)
        ?.addEventListener("change", applyAllFilters));

    document.getElementById("admin-search")
        ?.addEventListener("input", applyAllFilters);
}

// Fetch JSON helper
async function fetchJSON(url, options) {
    const res = await fetchWithAuth(url, options);
    return res.ok ? res.json() : null;
}


// ---------- LOAD STATS ----------
async function loadStats() {
    try {
        const d = await fetchJSON(`${API_BASE_URL}/admin/stats`);
        if (!d) return;

        document.getElementById("stat-total-users").textContent = d.users.total;
        document.getElementById("stat-total-reports").textContent = d.reports.total;
        document.getElementById("stat-open-reports").textContent =
            (d.reports.received||0)+(d.reports.active||0)+(d.reports.in_progress||0);
        document.getElementById("stat-resolved-cases").textContent = d.reports.resolved;

        const change = document.getElementById("stat-users-change");
        if (change) change.textContent = "Community base";

    } catch(e){ console.error(e); }
}


// ---------- LOAD DATA ----------
async function loadReports() {
    const data = await fetchJSON(`${API_BASE_URL}/admin/reports`);
    if (!data) return;
    allReports = data;
    applyAllFilters();
}

async function loadUsers() {
    const data = await fetchJSON(`${API_BASE_URL}/admin/users`);
    if (!data) return;
    allUsers = data;
    applyAllFilters();
}


// ---------- FILTER DATA ----------
function applyAllFilters() {

    const status = document.getElementById("status-filter")?.value || "all";
    const start = document.getElementById("start-date")?.value;
    const end = document.getElementById("end-date")?.value;
    const search = (document.getElementById("admin-search")?.value || "").toLowerCase();

    const startDate = start ? new Date(start) : null;
    const endDate = end ? new Date(end) : null;
    if (endDate) endDate.setHours(23,59,59,999);

    // Filter reports
    const reports = allReports
        .filter(r => {

            if (status !== "all" && r.status !== status) return false;

            const date = new Date(r.created_at);
            if (startDate && date < startDate) return false;
            if (endDate && date > endDate) return false;

            const text =
                `${r.id} ${r.contact_name||""} ${r.location||""} ${r.description||""}`
                .toLowerCase();

            return text.includes(search);
        })
        .sort((a,b)=>new Date(b.updated_at||b.created_at)-new Date(a.updated_at||a.created_at));

    // Filter users
    const users = allUsers.filter(u => {
        const text = `${u.id} ${u.full_name||""} ${u.email||""} ${u.role||""}`.toLowerCase();
        return text.includes(search);
    });

    renderReportTable(reports);
    renderUserTable(users);
}


// ---------- RENDER REPORT TABLE ----------
function renderReportTable(reports) {
    const body = document.getElementById("report-table-body");
    if (!body) return;

    if (!reports.length) {
        body.innerHTML = `<tr><td colspan="7">No reports found</td></tr>`;
        return;
    }

    body.innerHTML = reports.map(r => {

        const date = new Date(r.updated_at||r.created_at).toLocaleString();

        const note = r.field_review
            ? `<div class="team-note"><i data-lucide="message-square" style="width:12px"></i> ${r.field_review}</div>`
            : `<div class="no-note">No field updates yet</div>`;

        return `
        <tr>
            <td class="font-bold">RPT-${String(r.id).padStart(5,"0")}</td>
            <td>${r.contact_name}</td>
            <td>${r.location}</td>
            <td><span class="badge ${getStatusClass(r.status)}">${r.status.replace("_"," ")}</span></td>
            <td><div class="team-info"><i data-lucide="shield" style="width:14px"></i> ${r.assigned_team_name||"Auto-Assigning..."}</div></td>
            <td><div class="update-time">${date}</div>${note}</td>
            <td>
                <div class="action-cell">
                    <button onclick="viewDetails(${r.id})" class="view-btn">View</button>
                    <button onclick="deleteReport(${r.id})" class="delete-btn">Delete</button>
                </div>
            </td>
        </tr>`;
    }).join("");

    if (window.lucide) lucide.createIcons();
}


// ---------- RENDER USER TABLE ----------
function renderUserTable(users) {

    const body = document.getElementById("user-table-body");
    if (!body) return;

    if (!users.length) {
        body.innerHTML = `<tr><td colspan="6">No users found</td></tr>`;
        return;
    }

    body.innerHTML = users.map(u=>`
        <tr>
            <td>USR-${String(u.id).padStart(4,"0")}</td>
            <td class="font-bold">${u.full_name}</td>
            <td>${u.email}</td>
            <td><span class="badge ${u.role==="admin"?"resolved":u.role==="rescue_team"?"progress":"active"}">${u.role.replace("_"," ")}</span></td>
            <td>${new Date(u.created_at).toLocaleDateString()}</td>
            <td><button onclick="deleteUser(${u.id})" class="delete-btn">Delete</button></td>
        </tr>
    `).join("");
}


// ---------- ACTIONS ----------
async function deleteReport(id) {

    if (!confirm("Delete this report permanently?")) return;

    const res = await fetchWithAuth(`${API_BASE_URL}/admin/reports/${id}`,{method:"DELETE"});

    if (res.ok){
        alert("Report deleted");
        loadReports();
        loadStats();
    } else {
        const err = await res.json();
        alert(err.detail || "Delete failed");
    }
}

async function deleteUser(id){

    if (!confirm("Delete this user permanently?")) return;

    const res = await fetchWithAuth(`${API_BASE_URL}/admin/users/${id}`,{method:"DELETE"});

    if (res.ok){
        alert("User deleted");
        loadUsers();
        loadStats();
    } else {
        const err = await res.json();
        alert(err.detail || "Delete failed");
    }
}


// Open report details
function viewDetails(id){
    location.href=`view_report.html?id=${id}`;
}

// Map report status to css class
function getStatusClass(status){
    return {
        received:"pending",
        active:"active",
        in_progress:"progress",
        resolved:"resolved"
    }[status?.toLowerCase()] || "";
}