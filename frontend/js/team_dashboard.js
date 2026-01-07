document.addEventListener('DOMContentLoaded', () => {

    checkLogin();

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    loadDashboardData();

    async function loadDashboardData() {
        try {
            const statsResponse = await fetchWithAuth(`${API_BASE_URL}/admin/stats`);

            if (statsResponse.ok) {
                const stats = await statsResponse.json();

                setText('stat-total', stats.reports.total);
                setText('stat-progress', stats.reports.active);
                setText('stat-completed', stats.reports.completed);
                setText('stat-pending', stats.reports.pending);
            }

            const reportsResponse = await fetchWithAuth(`${API_BASE_URL}/reports/`);

            if (reportsResponse.ok) {
                const reports = await reportsResponse.json();
                renderCasesGrid(reports);
            } else {
                const container = document.querySelector('.cases-grid');
                if (container) container.innerHTML = `<p style="color:red">Error loading reports: ${reportsResponse.status}</p>`;
            }

        } catch (error) {
            console.error("Error loading dashboard:", error);
        }
    }

    function renderCasesGrid(reports) {
        const container = document.querySelector('.cases-grid');
        if (!container) return;

        container.innerHTML = '';

        if (reports.length === 0) {
            container.innerHTML = '<p>No reports found.</p>';
            return;
        }

        reports.forEach(report => {
            const card = document.createElement('article');
            card.className = 'case-card card';

            const dateStr = new Date(report.created_at).toLocaleString();

            card.innerHTML = `
                    <div class="case-top">
                        <div class="case-id">RSC-${String(report.id).padStart(6, '0')}</div>
                        <span class="pill">${report.priority || 'Medium'}</span>
                    </div>
                    
                    <h3 class="case-title">${report.condition}</h3>
                    
                    <ul class="case-meta">
                        <li>📍 ${report.location}</li>
                        <li>🕒 ${dateStr}</li>
                    </ul>
                    
                    <div class="case-tags">
                        <span class="tag ${report.status}">${report.status}</span>
                    </div>
                    
                    <div class="card-actions" style="margin-top:15px; display:flex; gap:10px;">
                        <a href="./view_report.html?id=${report.id}" class="btn-primary small">View</a>
                        
                        ${(report.status !== 'resolved') ?
                    `<button class="btn-outline small" onclick="updateStatus(${report.id}, 'resolved')">Resolve</button>`
                    : ''}
                    </div>
                `;

            container.appendChild(card);
        });
    }

    window.updateStatus = async (reportId, newStatus) => {
        if (!confirm(`Mark Report #${reportId} as ${newStatus}?`)) {
            return;
        }

        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/reports/${reportId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                alert("Status updated!");
                loadDashboardData();
            } else {
                alert("Failed to update status.");
            }
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    function setText(elementId, newText) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerText = newText;
        }
    }
});
