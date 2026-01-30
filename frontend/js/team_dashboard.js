// Run after page is loaded
document.addEventListener('DOMContentLoaded', function () {

    checkLogin();
    setupLogout();
    loadDashboard();
});


// ---------------- SETUP ----------------

function setupLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}


// ---------------- DASHBOARD ----------------

async function loadDashboard() {
    try {
        await loadStats();
        await loadReports();
    } catch (error) {
        console.error('Dashboard error:', error);
    }
}


// ---------------- STATS ----------------

async function loadStats() {
    const response = await fetchWithAuth(`${API_BASE_URL}/admin/stats`);
    if (!response.ok) return;

    const stats = await response.json();
    const reports = stats.reports;

    setText('stat-total', reports.total);
    setText('stat-progress', reports.active);
    setText('stat-completed', reports.completed);
    setText('stat-pending', reports.pending);
}


// ---------------- REPORTS ----------------

async function loadReports() {
    const response = await fetchWithAuth(`${API_BASE_URL}/reports/`);
    const container = document.querySelector('.cases-grid');

    if (!container) return;

    if (!response.ok) {
        container.innerHTML =
            `<p style="color:red">Error loading reports</p>`;
        return;
    }

    const reports = await response.json();
    renderReports(reports, container);
}

function renderReports(reports, container) {
    container.innerHTML = '';

    if (reports.length === 0) {
        container.innerHTML = '<p>No reports found.</p>';
        return;
    }

    reports.forEach(function (report) {
        container.appendChild(createReportCard(report));
    });
}

function createReportCard(report) {
    const card = document.createElement('article');
    card.className = 'case-card card';

    const date = new Date(report.created_at).toLocaleString();

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
            <li>🕒 ${date}</li>
        </ul>

        <span class="tag ${report.status}">
            ${report.status}
        </span>

        <div style="margin-top:15px; display:flex; gap:10px;">
            <a href="./view_report.html?id=${report.id}" class="btn-primary small">
                View
            </a>

            ${report.status !== 'resolved'
            ? `<button class="btn-outline small"
                    onclick="updateStatus(${report.id}, 'resolved')">
                    Resolve
                  </button>`
            : ''}
        </div>
    `;

    return card;
}


// ---------------- UPDATE STATUS ----------------

window.updateStatus = async function (reportId, newStatus) {

    const confirmAction =
        confirm(`Mark Report #${reportId} as ${newStatus}?`);

    if (!confirmAction) return;

    try {
        const response = await fetchWithAuth(
            `${API_BASE_URL}/reports/${reportId}/status`,
            {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            }
        );

        if (response.ok) {
            alert('Status updated!');
            loadDashboard();
        } else {
            alert('Failed to update status.');
        }

    } catch (error) {
        console.error('Status update error:', error);
    }
};


// ---------------- HELPERS ----------------

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}
