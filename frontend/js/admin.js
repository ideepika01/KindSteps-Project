// This script powers the Admin Dashboard.
// It fetches statistics and report lists from the backend and displays them.

document.addEventListener('DOMContentLoaded', () => {
    // Handle Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Ensure only Admins can see this page
    checkLogin();

    // Load the data (Stats + Reports Table)
    loadDashboardData();

    async function loadDashboardData() {
        try {
            // 1. Fetch Statistics (Count of total, active, completed reports)
            const statsResponse = await fetchWithAuth(`${API_BASE_URL}/admin/stats`);

            if (statsResponse.ok) {
                const stats = await statsResponse.json();

                // Update the numbers on the screen
                setText('stat-total', stats.reports.total);
                setText('stat-progress', stats.reports.active);
                setText('stat-completed', stats.reports.completed);
                setText('stat-pending', stats.reports.pending);
            }

            // 2. Fetch the List of All Reports
            const reportsResponse = await fetchWithAuth(`${API_BASE_URL}/admin/reports`);

            if (reportsResponse.ok) {
                const reports = await reportsResponse.json();

                // Check if we are viewing as a Table or a Grid
                const tableBody = document.querySelector('#reports-table tbody');
                const_gridContainer = document.querySelector('.cases-grid');

                if (tableBody) {
                    renderReportsTable(reports, tableBody);
                } else if (const_gridContainer) { // Note: 'cases-grid' might be used in other layouts
                    renderCasesGrid(reports, const_gridContainer);
                }
            } else {
                console.error("Error fetching reports");
            }
        } catch (error) {
            console.error("Error loading dashboard:", error);
        }
    }

    // Helper: Render data into a Table
    function renderReportsTable(reports, tableBody) {
        tableBody.innerHTML = ''; // Clear existing rows

        reports.forEach(report => {
            const row = document.createElement('tr');

            // Construct the HTML for each table row
            row.innerHTML = `
                <td>${report.id}</td>
                <td>${report.condition}</td>
                <td>${report.location}</td>
                <td><span class="status-badge ${report.status}">${report.status}</span></td>
                <td>
                    <button class="action-btn" onclick="viewReportDetails(${report.id})">View</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    // Helper: Render data into a Card Grid (if used)
    function renderCasesGrid(reports, container) {
        container.innerHTML = '';

        reports.forEach(report => {
            const card = document.createElement('article');
            card.className = 'case-card card';

            card.innerHTML = `
                <div class="case-top">
                    <div class="case-id">RSC-${String(report.id).padStart(6, '0')}</div>
                    <span class="pill">${report.priority || 'Medium'}</span>
                </div>
                <h3 class="case-title">${report.condition}</h3>
                <ul class="case-meta">
                    <li>📍 ${report.location}</li>
                    <li>🕒 ${new Date(report.created_at).toLocaleString()}</li>
                </ul>
                <div class="case-tags"><span class="tag ${report.status}">${report.status}</span></div>
                <button onclick="viewReportDetails(${report.id})" class="btn-primary small">View Details →</button>
            `;
            container.appendChild(card);
        });
    }

    // Helper: safely set text content of an element
    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.innerText = text;
    }
});

// Open the View Report page (Made global so HTML buttons can click it)
window.viewReportDetails = (id) => {
    window.location.href = `./view_report.html?id=${id}`;
};

