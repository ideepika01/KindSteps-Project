// start dashboard
document.addEventListener("DOMContentLoaded", () => {
    if (!checkLogin()) return;
    init();
});

let reports = [];
let users = [];


// load everything
async function init() {
    await Promise.all([loadUsers(), loadReports(), loadStats()]);
    setupFilters();
    applyFilters();
}


// get users
async function loadUsers() {
    try {
        const res = await fetchWithAuth(`${API_BASE_URL}/admin/users`);
        users = res.ok ? await res.json() : [];
    } catch {
        users = [];
    }
}


// get reports
async function loadReports() {
    try {
        const res = await fetchWithAuth(`${API_BASE_URL}/admin/reports`);
        reports = res.ok ? await res.json() : [];
    } catch {
        reports = [];
    }
}


// delete user
async function deleteUser(id, name) {
    if (!confirm(`Delete ${name}?`)) return;
    const res = await fetchWithAuth(`${API_BASE_URL}/admin/users/${id}`, { method: "DELETE" });
    if (res.ok) init();
}


// setup filters
function setupFilters() {
    ["status-filter","start-date","end-date","admin-search"]
    .forEach(id => {
        const el = document.getElementById(id);
        if (el) el.oninput = applyFilters;
    });
}


// filter and render
function applyFilters() {

    const status = getVal("status-filter","all");
    const start = getVal("start-date");
    const end = getVal("end-date");
    const search = getVal("admin-search","").toLowerCase();


    const filteredReports = reports
        .filter(r =>
            (status==="all"||r.status===status) &&
            (!start||new Date(r.created_at)>=new Date(start)) &&
            (!end||new Date(r.created_at)<=new Date(end)) &&
            (!search||
                r.id.toString().includes(search)||
                r.contact_name.toLowerCase().includes(search))
        )
        .sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));


    const filteredUsers = users.filter(u =>
        !search||
        u.full_name.toLowerCase().includes(search)||
        u.email.toLowerCase().includes(search)
    );


    renderUsers(filteredUsers);
    renderReports(filteredReports);
}



// render users
function renderUsers(list) {

    const body = document.getElementById("user-table-body");

    body.innerHTML = list.length ? list.map(u => `
        <tr>
            <td>USR-${pad(u.id,4)}</td>
            <td>${u.full_name}</td>
            <td>${u.email}</td>
            <td>${u.role}</td>
            <td>${formatDate(u.created_at)}</td>
            <td><button onclick="deleteUser(${u.id},'${u.full_name}')">Delete</button></td>
        </tr>
    `).join("") : "<tr><td colspan=6>No users</td></tr>";

}



// render reports
function renderReports(list) {

    const body = document.getElementById("report-table-body");

    body.innerHTML = list.length ? list.map(r => `
        <tr>
            <td>RPT-${pad(r.id,5)}</td>
            <td>${r.contact_name}</td>
            <td>${r.location}</td>
            <td>${r.status}</td>
            <td>${r.assigned_team_name||"Team Alpha"}</td>
            <td>${formatDate(r.updated_at||r.created_at)}</td>
            <td>
                <button onclick="location='view_report.html?id=${r.id}'">
                    View
                </button>
            </td>
        </tr>
    `).join("") : "<tr><td colspan=7>No reports</td></tr>";

}



// load stats
async function loadStats() {

    try {

        const res = await fetchWithAuth(`${API_BASE_URL}/admin/stats`);

        if (!res.ok) return;

        const d = await res.json();

        setText("stat-total-users", d.users.total);
        setText("stat-volunteers", d.users.volunteers);
        setText("stat-open-reports", d.reports.total - d.reports.resolved);
        setText("stat-resolved-cases", d.reports.resolved);

    } catch {}

}



// helpers
function getVal(id, def=""){ return document.getElementById(id)?.value||def; }

function setText(id, val){ document.getElementById(id).textContent=val; }

function pad(n,len){ return n.toString().padStart(len,"0"); }

function formatDate(d){ return new Date(d||Date.now()).toLocaleString(); }