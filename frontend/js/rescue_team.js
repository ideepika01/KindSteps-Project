
// Run when page loads
document.addEventListener("DOMContentLoaded", function () {

    checkLogin();

    loadReports();

});



// Load reports from backend
async function loadReports() {

    const grid = document.getElementById("rescue-reports-grid");

    if (!grid) return;

    try {

        const res = await fetchWithAuth(API_BASE_URL + "/reports");

        if (!res.ok) {

            grid.innerHTML = "Failed to load";

            return;

        }

        const reports = await res.json();

        showStats(reports);

        setupFilter(reports, grid);

    }
    catch {

        grid.innerHTML = "Server error";

    }

}



// Show statistics
function showStats(reports) {

    let total = reports.length;

    let progress = 0;

    let resolved = 0;


    reports.forEach(function (r) {

        if (r.status === "resolved")
            resolved++;

        if (r.status === "active" || r.status === "in_progress")
            progress++;

    });


    document.getElementById("stat-total").innerText = total;

    document.getElementById("stat-progress").innerText = progress;

    document.getElementById("stat-resolved").innerText = resolved;

}



// Filter reports
function setupFilter(reports, grid) {

    const status = document.getElementById("status-filter");

    status.onchange = function () {

        const value = status.value;

        let filtered = [];


        if (value === "all")
            filtered = reports;

        else
            filtered = reports.filter(function (r) {

                return r.status === value;

            });


        showReports(filtered, grid);

    };


    showReports(reports, grid);

}



// Show reports
function showReports(reports, grid) {

    grid.innerHTML = "";


    if (reports.length === 0) {

        grid.innerHTML = "No reports";

        return;

    }


    reports.forEach(function (r) {

        const div = document.createElement("div");

        div.className = "case-card";


        div.innerHTML = `

        <h3>${r.condition}</h3>

        <p>${r.location}</p>

        <p>Status: ${r.status}</p>

        <a href="view_report.html?id=${r.id}">
        View
        </a>

        `;


        grid.appendChild(div);

    });

}