// Rescue Team Dashboard Logic: Fetches and displays reports assigned to the logged-in team member.
document.addEventListener('DOMContentLoaded', function () {
    checkLogin();
    loadTeamAssignments();
});

async function loadTeamAssignments() {
    const container = document.getElementById('rescue-reports-grid');
    if (!container) return;

    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/reports/my-assignments`);

        if (!response.ok) {
            container.innerHTML = '<p style="color:red; text-align: center; width: 100%;">Error loading assignments. Please try again later.</p>';
            return;
        }

        const reports = await response.json();
        updateStats(reports);
        renderAssignments(reports, container);

        // Refresh AOS for dynamic content
        if (window.AOS) AOS.refresh();

    } catch (error) {
        console.error('Rescue Team dashboard error:', error);
        container.innerHTML = '<p style="color:red; text-align: center; width: 100%;">Error connecting to server.</p>';
    }
}

function updateStats(reports) {
    const total = reports.length;
    const inProgress = reports.filter(r => r.status === 'in_progress' || r.status === 'active').length;
    const resolved = reports.filter(r => r.status === 'resolved').length;

    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-progress').innerText = inProgress;
    document.getElementById('stat-resolved').innerText = resolved;
}

function renderAssignments(reports, container) {
    container.innerHTML = '';

    if (reports.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: var(--text-muted); padding: 40px; width: 100%; grid-column: 1 / -1;">
                <div style="font-size: 3rem; margin-bottom: 20px;">🎉</div>
                <p>No active assignments at the moment. Good job!</p>
            </div>
        `;
        return;
    }

    reports.forEach(report => {
        container.appendChild(createAssignmentCard(report));
    });
}

function createAssignmentCard(report) {
    const card = document.createElement('article');
    card.className = 'case-card';
    card.setAttribute('data-aos', 'fade-up');

    const date = new Date(report.created_at).toLocaleString();

    card.innerHTML = `
        <div class="case-top">
            <div class="case-id">
                RPT-${String(report.id).padStart(6, '0')}
            </div>
            <span class="tag ${report.status}">${report.status.replace('_', ' ')}</span>
        </div>

        <h3>${report.condition}</h3>

        <ul>
            <li><span>📍</span> ${report.location}</li>
            <li><span>🕒</span> Assigned: ${date}</li>
            <li><span>📞</span> Contact: ${report.contact_name} (${report.contact_phone})</li>
        </ul>

        <div style="margin-top: auto; display: flex; gap: 10px;">
            <a href="./view_report.html?id=${report.id}" class="btn-primary small" style="flex: 1;">
                Update Status
            </a>
            <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(report.location)}" target="_blank" class="btn-primary small" style="flex: 0 0 50px; display: flex; align-items: center; justify-content: center;">
                🗺️
            </a>
        </div>
    `;

    return card;
}
