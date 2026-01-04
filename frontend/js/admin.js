document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    checkLogin();
    loadDashboardData();

    async function loadDashboardData() {
        try {
            const statsResponse = await fetchWithAuth(`${API_BASE_URL}/admin/stats`);

            if (statsResponse.ok) {
                const stats = await statsResponse.json();

                setText('stat-total', stats.reports.total);
                setText('stat-progress', stats.reports.active);
                setText('stat-completed', stats.reports.completed);
                // Also update pending if exists in HTML
                setText('stat-pending', stats.reports.pending);
            }

            const reportsResponse = await fetchWithAuth(`${API_BASE_URL}/admin/reports`);

            if (reportsResponse.ok) {
                const reports = await reportsResponse.json();

                const tableBody = document.querySelector('#reports-table tbody');
                const gridContainer = document.querySelector('.cases-grid');

                if (tableBody) {
                    renderReportsTable(reports, tableBody);
                } else if (gridContainer) {
                    renderCasesGrid(reports, gridContainer);
                }
            } else {
                console.error("Error fetching reports");
            }
        } catch (error) {
            console.error("Error loading dashboard:", error);
        }
    }

    function renderReportsTable(reports, tableBody) {
        tableBody.innerHTML = '';

        reports.forEach(report => {
            const row = document.createElement('tr');

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

    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.innerText = text;
    }
});

// Expose to window for onclick handlers in HTML
window.viewReportDetails = (id) => {
    window.location.href = `./view_report.html?id=${id}`;
};

