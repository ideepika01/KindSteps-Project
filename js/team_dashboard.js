
document.addEventListener('DOMContentLoaded', async () => {
    const token = checkAuth();

    // Check Role (optional but good)
    try {
        const userResponse = await authFetch(`${API_BASE_URL}/auth/me`);
        if (userResponse.ok) {
            const user = await userResponse.json();
            // Team or Admin can view this
            if (user.role === 'user') {
                alert("Unauthorized access. Redirecting...");
                window.location.href = '../index.html';
                return;
            }
            // Update welcome message
            const welcomeEl = document.querySelector('.welcome-box h2');
            if (welcomeEl) welcomeEl.innerText = `Welcome, ${user.full_name}!`;
        }
    } catch (e) {
        console.error("Auth check failed", e);
    }

    loadTeamStats();
    loadTeamCases();
});

async function loadTeamStats() {
    try {
        // Team sees same stats as admin or filtered? 
        // Requirement says "Rescue team dashboard to see total reports..."
        // Let's use the admin stats endpoint if allowed, or count manually from /reports
        // Re-using /admin/stats might be restricted to admin role.
        // Let's check backend... /admin/stats enforces check_admin.
        // So Team cannot use /admin/stats.
        // We have to calculate from /reports/ (which team can see all of).

        const response = await authFetch(`${API_BASE_URL}/reports/`);
        if (response.ok) {
            const reports = await response.json();

            const total = reports.length;
            const inProgress = reports.filter(r => r.status === 'in_progress' || r.status === 'active').length;
            const completed = reports.filter(r => r.status === 'resolved').length;
            const pending = reports.filter(r => r.status === 'received').length;

            setText('stat-total', total);
            setText('stat-progress', inProgress);
            setText('stat-completed', completed);
            setText('stat-pending', pending);
        }
    } catch (error) {
        console.error("Error loading stats:", error);
    }
}

async function loadTeamCases() {
    try {
        const response = await authFetch(`${API_BASE_URL}/reports/`);

        if (response.ok) {
            const reports = await response.json();
            const container = document.querySelector('.cases-grid');
            if (container) {
                container.innerHTML = '';

                // Show all or recent? UI shows 3 cards initially. Let's show all for now or recent 6.
                const recent = reports.slice(-10).reverse();

                recent.forEach(report => {
                    const card = createTeamCaseCard(report);
                    container.appendChild(card);
                });
            }
        }
    } catch (error) {
        console.error("Error loading cases:", error);
    }
}

function createTeamCaseCard(report) {
    const div = document.createElement('div');
    div.className = 'case-card';

    // Priority Class
    const priorityClass = report.priority ? report.priority.toLowerCase() : 'medium';

    div.innerHTML = `
        <h3 class="case-id">ID: ${report.id}</h3>
        <span class="badge ${priorityClass}">${report.priority || 'Medium'}</span>
        <p class="case-desc">${report.description.substring(0, 60)}...</p>
        <ul class="case-details">
            <li>📍 ${report.location}</li>
            <li>📅 ${new Date(report.created_at).toLocaleDateString()}</li>
            <li>📱 ${report.contact_phone}</li>
        </ul>
        <a href="./view_report.html?id=${report.id}"><button class="view-btn">View Details →</button></a>
    `;
    return div;
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}
