/*
 * ADMIN DASHBOARD LOGIC
 * This file handles the Admin's main page.
 * It fetches statistics (counts of reports) and a list of all reports.
 */

document.addEventListener('DOMContentLoaded', () => {

    // 1. CHECK LOGIN
    // Admins must be logged in!
    checkAuth();

    // 2. LOGOUT BUTTON
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout); // logout() is in utils.js
    }

    // 3. LOAD DASHBOARD DATA
    // We want to load data as soon as the page opens.
    loadDashboardData();

    async function loadDashboardData() {
        try {
            // --- A. Get Statistics (Counts) ---
            // The backend has a special endpoint just for counting reports.
            const statsResponse = await authFetch(`${API_BASE_URL}/admin/stats`);

            if (statsResponse.ok) {
                const stats = await statsResponse.json();

                // Update the numbers on the screen
                setText('total-reports', stats.total_reports);
                setText('pending-reports', stats.pending_reports);
                setText('resolved-reports', stats.resolved_reports);
            }

            // --- B. Get All Reports ---
            const reportsResponse = await authFetch(`${API_BASE_URL}/admin/reports`);

            if (reportsResponse.ok) {
                const reports = await reportsResponse.json();
                renderReportsTable(reports); // Helper function to draw the table
            }

        } catch (error) {
            console.error("Error loading dashboard:", error);
        }
    }

    // 4. HELPER: Draw the Table of Reports
    function renderReportsTable(reports) {
        const tableBody = document.querySelector('#reports-table tbody');
        if (!tableBody) return; // specific safety check

        tableBody.innerHTML = ''; // Clear any existing rows first

        reports.forEach(report => {
            // Create a new row (<tr>)
            const row = document.createElement('tr');

            // Fill the row with columns (<td>)
            row.innerHTML = `
                <td>${report.id}</td>
                <td>${report.condition}</td>
                <td>${report.location}</td>
                <td>${report.status}</td>
                <td>
                    <!-- A button to view full details -->
                    <button class="action-btn" onclick="viewReportDetails(${report.id})">View</button>
                </td>
            `;

            // Add this new row to the table
            tableBody.appendChild(row);
        });
    }

    // 5. HELPER: Go to Details Page
    // This function is called when you click "View".
    window.viewReportDetails = (id) => {
        window.location.href = `./view_report.html?id=${id}`;
    };

    // Helper to safely set text if element exists
    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.innerText = text;
    }
});
