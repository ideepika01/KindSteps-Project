document.addEventListener("DOMContentLoaded", init);

let rescueTeams = [];

async function init() {
    if (!checkLogin()) return;
    loadStats();
    await loadRescueTeams();
    loadReports();
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


// ---------- LOAD TEAMS ----------
async function loadRescueTeams() {
    try {
        const res = await fetchWithAuth(`${API_BASE_URL}/admin/rescue-teams`);
        if (res.ok) {
            rescueTeams = await res.json();
        } else {
            console.error("Failed to load teams", res.status);
        }
    } catch (e) {
        console.error(e);
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

        setupFilters(await res.json());

    } catch (e) {
        console.error(e);
        document.getElementById("report-table-body").innerHTML =
            `<tr><td colspan="7" style="color:red; text-align:center;">
                Network/Server Error: ${e.message}
            </td></tr>`;
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

        let action = `<button onclick="viewDetails(${r.id})">View</button>`;

        if (r.status === "received") {

            const options = rescueTeams.map(t =>
                `<option value="${t.id}">${t.full_name}</option>`
            ).join("");

            action += `
            <select id="team-${r.id}">
                <option value="">Choose Team</option>
                ${options}
            </select>
            <button onclick="dispatchTeam(${r.id})">Dispatch</button>`;
        }

        return `
        <tr>
            <td>RPT-${r.id.toString().padStart(5, "0")}</td>
            <td>${r.contact_name}</td>
            <td>${r.location}</td>
            <td><span class="${getStatusClass(r.status)}">${r.status}</span></td>
            <td>${r.assigned_team_name || "Unassigned"}</td>
            <td>${new Date(r.updated_at || r.created_at).toLocaleString()}</td>
            <td>${action}</td>
        </tr>`;
    }).join("");
}


// ---------- DISPATCH ----------
async function dispatchTeam(id) {

    const team = document.getElementById(`team-${id}`).value;

    if (!team) return alert("Select team first");

    if (!confirm("Confirm dispatch?")) return;

    try {
        const res = await fetchWithAuth(
            `${API_BASE_URL}/admin/reports/${id}/assign?team_id=${team}`,
            { method: "POST" }
        );

        if (res.ok) location.reload();
        else alert("Dispatch failed");

    } catch {
        alert("Connection error");
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
