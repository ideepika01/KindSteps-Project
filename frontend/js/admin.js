// Run this only after the page is fully loaded
document.addEventListener('DOMContentLoaded', function () {

    // 1. Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // 2. Check user login
    checkLogin();

    // 3. Load dashboard data
    loadDashboardData();
});


// ---------------- DASHBOARD DATA ----------------

async function loadDashboardData() {
    try {
        // Get statistics
        const statsResponse = await fetchWithAuth(`${API_BASE_URL}/admin/stats`);
        if (statsResponse.ok) {
            const stats = await statsResponse.json();
            updateStats(stats.reports);
        }

        // Get reports
        const reportsResponse = await fetchWithAuth(`${API_BASE_URL}/admin/reports`);
        if (reportsResponse.ok) {
            const reports = await reportsResponse.json();
            showReports(reports);
        }

    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}


// ---------------- UPDATE STATS ----------------

function updateStats(reports) {
    setText('stat-total', reports.total);
    setText('stat-progress', reports.active + reports.in_progress);
    setText('stat-completed', reports.resolved);
    setText('stat-pending', reports.received);
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.innerText = value;
    }
}


// ---------------- SHOW REPORTS ----------------

function showReports(reports) {
    const tableBody = document.querySelector('#reports-table tbody');
    const gridContainer = document.querySelector('.cases-grid');

    if (tableBody) {
        renderReportsTable(reports, tableBody);
    }

    if (gridContainer) {
        renderCasesGrid(reports, gridContainer);
    }
}


// ---------------- TABLE VIEW ----------------

function renderReportsTable(reports, tableBody) {
    tableBody.innerHTML = '';

    reports.forEach(function (report) {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${report.id}</td>
            <td>${report.condition}</td>
            <td>${report.location}</td>
            <td>${report.assigned_team_name || 'Unassigned'}</td>
            <td>
                <span class="status-badge ${report.status}">
                    ${report.status}
                </span>
            </td>
            <td>
                <button onclick="viewReportDetails(${report.id})">
                    View
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}


// ---------------- GRID VIEW ----------------

function renderCasesGrid(reports, container) {
    container.innerHTML = '';

    reports.forEach(function (report) {
        const card = document.createElement('article');
        card.className = 'case-card card';

        card.innerHTML = `
            <div class="case-top">
                <div class="case-id">
                    RSC-${String(report.id).padStart(6, '0')}
                </div>
                <span class="pill">${report.priority || 'Medium'}</span>
            </div>

            <h3>${report.condition}</h3>

            <ul>
                <li>📍 ${report.location}</li>
                <li>🕒 ${new Date(report.created_at).toLocaleString()}</li>
                <li>👥 ${report.assigned_team_name || 'Unassigned'}</li>
            </ul>

            <span class="tag ${report.status}">
                ${report.status}
            </span>

            <button onclick="viewReportDetails(${report.id})">
                View Details
            </button>
        `;

        container.appendChild(card);
    });
}


// ---------------- NAVIGATION ----------------

window.viewReportDetails = function (id) {
    window.location.href = `./view_report.html?id=${id}`;
};
