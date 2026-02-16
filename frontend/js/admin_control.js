document.addEventListener("DOMContentLoaded", async () => {
    const token = checkLogin();
    if (!token) return;

    loadStats();
    await loadRescueTeams(); // Must load teams before rendering table
    loadReports();
});


// ------------------- LOAD STATS -------------------

async function loadStats() {
    try {
        const res = await fetchWithAuth(`${API_BASE_URL}/admin/stats`);
        if (!res.ok) return;

        const data = await res.json();

        document.getElementById("stat-total-users").textContent = data.users.total;
        document.getElementById("stat-volunteers").textContent = data.users.volunteers;

        const openReports =
            data.reports.received +
            data.reports.active +
            data.reports.in_progress;

        document.getElementById("stat-open-reports").textContent = openReports;
        document.getElementById("stat-resolved-cases").textContent = data.reports.resolved;

    } catch (error) {
        console.error("Error loading stats:", error);
    }
}


// ------------------- LOAD REPORTS -------------------

async function loadReports() {
    try {
        const res = await fetchWithAuth(`${API_BASE_URL}/admin/reports`);
        if (!res.ok) return;

        const reports = await res.json();
        setupFilters(reports);

    } catch (error) {
        console.error("Error loading reports:", error);
    }
}


// ------------------- FILTER LOGIC -------------------

function setupFilters(reports) {
    const statusEl = document.getElementById("status-filter");
    const startEl = document.getElementById("start-date");
    const endEl = document.getElementById("end-date");
    const searchEl = document.getElementById("admin-search");

    function applyFilters() {
        let filtered = reports;

        const status = statusEl.value.toLowerCase();
        const search = searchEl.value.toLowerCase();
        const startDate = startEl.value ? new Date(startEl.value) : null;
        const endDate = endEl.value ? new Date(endEl.value) : null;

        if (startDate) startDate.setHours(0, 0, 0, 0);
        if (endDate) endDate.setHours(23, 59, 59, 999);

        // Filter by status
        if (status !== "all") {
            filtered = filtered.filter(r =>
                (r.status || "").toLowerCase() === status
            );
        }

        // Filter by date
        if (startDate || endDate) {
            filtered = filtered.filter(r => {
                const reportDate = new Date(r.created_at);
                if (startDate && reportDate < startDate) return false;
                if (endDate && reportDate > endDate) return false;
                return true;
            });
        }

        // Filter by search
        if (search) {
            filtered = filtered.filter(r =>
                r.id.toString().includes(search) ||
                (r.contact_name || "").toLowerCase().includes(search) ||
                (r.location || "").toLowerCase().includes(search)
            );
        }

        // Sort latest first
        filtered.sort((a, b) =>
            new Date(b.updated_at || b.created_at) -
            new Date(a.updated_at || a.created_at)
        );

        renderTable(filtered);
    }

    statusEl.onchange = applyFilters;
    startEl.onchange = applyFilters;
    endEl.onchange = applyFilters;
    searchEl.oninput = applyFilters;

    applyFilters();
}


// ------------------- TABLE RENDER -------------------

let rescueTeams = [];

async function loadRescueTeams() {
    try {
        const res = await fetchWithAuth(`${API_BASE_URL}/admin/rescue-teams`);
        if (res.ok) {
            rescueTeams = await res.json();
        }
    } catch (err) {
        console.error("Error loading teams:", err);
    }
}


function renderTable(reports) {
    const tbody = document.getElementById("report-table-body");
    tbody.innerHTML = "";

    if (!reports.length) {
        tbody.innerHTML =
            '<tr><td colspan="7" style="text-align:center;">No reports found.</td></tr>';
        return;
    }

    reports.forEach(report => {
        const row = document.createElement("tr");
        const date = new Date(report.updated_at || report.created_at).toLocaleString();
        const statusClass = getStatusClass(report.status);

        let actionHtml = `<button onclick="viewDetails(${report.id})" class="view-btn">View</button>`;

        // Show dispatch options only for 'received' reports
        if (report.status === 'received') {
            const teamOptions = rescueTeams.map(t =>
                `<option value="${t.id}">${t.full_name}</option>`
            ).join("");

            actionHtml += `
                <div class="dispatch-group">
                    <select id="team-select-${report.id}" class="team-dropdown">
                        <option value="">Choose Team...</option>
                        ${teamOptions}
                    </select>
                    <button onclick="dispatchTeam(${report.id})" class="dispatch-btn">Dispatch</button>
                </div>
            `;
        }

        row.innerHTML = `
            <td>RPT-${report.id.toString().padStart(5, "0")}</td>
            <td>${report.contact_name}</td>
            <td>${report.location}</td>
            <td><span class="badge ${statusClass}">${report.status}</span></td>
            <td>${report.assigned_team_name || "Unassigned"}</td>
            <td>${date}</td>
            <td>
                <div class="actions-cell">
                    ${actionHtml}
                </div>
            </td>
        `;

        tbody.appendChild(row);
    });
}


async function dispatchTeam(reportId) {
    const teamId = document.getElementById(`team-select-${reportId}`).value;
    if (!teamId) return alert("Please select a team first.");

    if (!confirm("Confirm dispatch to this team?")) return;

    try {
        const res = await fetchWithAuth(`${API_BASE_URL}/admin/reports/${reportId}/assign?team_id=${teamId}`, {
            method: "POST"
        });

        if (res.ok) {
            alert("Team dispatched successfully!");
            location.reload(); // Refresh to show updated status
        } else {
            const err = await res.json();
            alert(`Dispatch failed: ${err.detail || "Unknown error"}`);
        }
    } catch (error) {
        console.error("Dispatch Error:", error);
        alert("Connection error during dispatch.");
    }
}


// ------------------- NAVIGATION -------------------

function viewDetails(id) {
    window.location.href = `./view_report.html?id=${id}`;
}


// ------------------- STATUS CLASS -------------------

function getStatusClass(status) {
    const map = {
        received: "pending",
        active: "active",
        in_progress: "progress",
        resolved: "resolved"
    };

    return map[status?.toLowerCase()] || "";
}
