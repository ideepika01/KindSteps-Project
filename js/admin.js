
document.addEventListener('DOMContentLoaded', async () => {
    const token = checkAuth();

    // Check if user is actually admin
    try {
        const userResponse = await authFetch(`${API_BASE_URL}/auth/me`);
        if (userResponse.ok) {
            const user = await userResponse.json();
            if (user.role !== 'admin') {
                alert("Unauthorized access. Redirecting...");
                window.location.href = '../index.html';
                return;
            }
            // Update profile name
            const profileEls = document.querySelectorAll('.profile span, .sidebar-user-name, .user-name');
            profileEls.forEach(el => el.innerText = user.full_name);

            // Update Welcome message
            const welcomeEl = document.querySelector('.welcome h1');
            if (welcomeEl) welcomeEl.innerText = `Welcome, ${user.full_name}!`;

        }
    } catch (e) {
        console.error("Auth check failed", e);
    }

    // Load Stats
    loadStats();
    // Load Recent Cases
    loadRecentCases();
});

async function loadStats() {
    try {
        const response = await authFetch(`${API_BASE_URL}/admin/stats`);
        if (response.ok) {
            const data = await response.json();

            // Update UI elements
            // Note: I need to add IDs to HTML to target these effectively, 
            // but for now I will try to target by class or update HTML in next step.
            // Let's assume I will add IDs: stat-total, stat-progress, stat-completed, stat-pending

            setText('stat-total', data.reports.total);
            setText('stat-progress', data.reports.active);
            setText('stat-completed', data.reports.completed);
            setText('stat-pending', data.reports.pending);
        }
    } catch (error) {
        console.error("Error loading stats:", error);
    }
}

async function loadRecentCases() {
    try {
        // Fetch all reports (admin can see all)
        // Ideally backend should support ?limit=5
        const response = await authFetch(`${API_BASE_URL}/reports/`);

        if (response.ok) {
            const reports = await response.json();
            const container = document.querySelector('.cases-grid');
            if (container) {
                container.innerHTML = ''; // Clear placeholder

                // Show last 5
                const recent = reports.slice(-5).reverse();

                recent.forEach(report => {
                    const card = createCaseCard(report);
                    container.appendChild(card);
                });
            }
        }
    } catch (error) {
        console.error("Error loading cases:", error);
    }
}

function createCaseCard(report) {
    const article = document.createElement('article');
    article.className = 'case-card card';

    // Priority Class
    const priorityClass = report.priority ? report.priority.toLowerCase() : 'medium';

    article.innerHTML = `
        <div class="case-top">
          <div class="case-id">ID: ${report.id}</div>
          <span class="pill ${priorityClass}">${report.priority || 'Medium'}</span>
        </div>
        <h3 class="case-title">${report.description.substring(0, 50)}...</h3>

        <ul class="case-meta">
          <li>📍 ${report.location}</li>
          <li>🕒 ${new Date(report.created_at).toLocaleDateString()}</li>
          <li>📱 ${report.contact_phone}</li>
        </ul>

        <div class="case-tags"><span class="tag ${report.status}">${report.status}</span></div>
        <a href="./view_report.html?id=${report.id}" class="btn-primary small">View Details →</a>
    `;
    return article;
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}
