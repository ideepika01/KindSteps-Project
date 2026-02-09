// User Reports Logic: Fetches and displays cases submitted by the logged-in user.
document.addEventListener('DOMContentLoaded', function () {
    checkLogin();
    loadMyReports();
});

async function loadMyReports() {
    const container = document.getElementById('my-reports-grid');
    if (!container) return;

    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/reports/`);

        if (!response.ok) {
            container.innerHTML = '<p style="color:red">Error loading reports. Please try again later.</p>';
            return;
        }

        const reports = await response.json();
        renderMyReports(reports, container);

    } catch (error) {
        console.error('My Reports error:', error);
        container.innerHTML = '<p style="color:red">Error connecting to server.</p>';
    }
}

function renderMyReports(reports, container) {
    container.innerHTML = '';

    if (reports.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <p>You haven't submitted any reports yet.</p>
                <a href="./report.html" class="btn-primary" style="display: inline-block; margin-top: 15px; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Report Now</a>
            </div>
        `;
        return;
    }

    reports.forEach(report => {
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
            <li>📍 Reported At: ${report.location}</li>
            <li>🕒 Date: ${date}</li>
            <li>👥 Assigned: ${report.assigned_team_name || 'Assigning soon...'} ${report.assigned_team_phone ? `(${report.assigned_team_phone})` : ''}</li>
            ${report.status === 'resolved' && report.rescued_location ? `
            <li style="color: #00C851; font-weight: bold; margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px;">
                ✅ Rescued To: ${report.rescued_location}
            </li>
            <li style="color: #00C851; font-size: 0.85rem;">
                🏁 Closed At: ${new Date(report.updated_at).toLocaleString()}
            </li>
            ` : ''}
        </ul>

        <span class="tag ${report.status}">
            ${report.status}
        </span>

        <div style="margin-top:15px;">
            <a href="./track_report.html?id=${report.id}" class="btn-primary small" style="padding: 8px 15px; text-decoration: none; border-radius: 4px; font-size: 0.9rem;">
                View Tracker
            </a>
        </div>
    `;

    return card;
}
