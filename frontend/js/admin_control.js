document.addEventListener("DOMContentLoaded", init);

async function init() {
    if (!checkLogin()) return;
    loadStats();
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

            const reportDate = new Date(r.created_at);
            // Set time to midnight for simple date comparison
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
