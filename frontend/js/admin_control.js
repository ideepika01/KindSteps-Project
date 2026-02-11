// Admin Control Logic: Manages the detailed table view for rescue operations.
document.addEventListener('DOMContentLoaded', async () => {
    const token = checkLogin();
    if (!token) return;

    loadStats();
    loadReports();
});

async function loadStats() {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/stats`);
        if (!response.ok) throw new Error('Failed to fetch stats');

        const data = await response.json();

        document.getElementById('stat-total-users').textContent = data.users.total;
        document.getElementById('stat-volunteers').textContent = data.users.volunteers;
        document.getElementById('stat-open-reports').textContent = data.reports.received + data.reports.active + data.reports.in_progress;
        document.getElementById('stat-resolved-cases').textContent = data.reports.resolved;

        document.getElementById('stat-users-change').textContent = `Total registered members`;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadReports() {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/reports`);
        if (!response.ok) throw new Error('Failed to fetch reports');

        const allReports = await response.json();
        const tableBody = document.getElementById('report-table-body');
        const statusFilter = document.getElementById('status-filter');
        const startDateInput = document.getElementById('start-date');
        const endDateInput = document.getElementById('end-date');
        const searchInput = document.getElementById('admin-search');

        const filterAndRender = () => {
            const selectedStatus = statusFilter.value.toLowerCase();
            const startDate = startDateInput.value ? new Date(startDateInput.value) : null;
            const endDate = endDateInput.value ? new Date(endDateInput.value) : null;
            const searchTerm = searchInput.value.toLowerCase();

            if (startDate) startDate.setHours(0, 0, 0, 0);
            if (endDate) endDate.setHours(23, 59, 59, 999);

            let filtered = allReports;

            // 1. Filter by Status (Robust case-insensitive check)
            if (selectedStatus !== 'all') {
                filtered = filtered.filter(r => (r.status || "").toLowerCase() === selectedStatus);
            }

            // 2. Filter by Date Range
            if (startDate || endDate) {
                filtered = filtered.filter(r => {
                    const reportDate = new Date(r.created_at);
                    if (startDate && reportDate < startDate) return false;
                    if (endDate && reportDate > endDate) return false;
                    return true;
                });
            }

            // 3. Filter by Search (ID, Name, or Place)
            if (searchTerm) {
                filtered = filtered.filter(r =>
                    r.id.toString().includes(searchTerm) ||
                    r.contact_name.toLowerCase().includes(searchTerm) ||
                    r.location.toLowerCase().includes(searchTerm)
                );
            }

            // Sort and Render
            filtered.sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));
            renderTable(filtered, tableBody);
        };

        statusFilter.onchange = filterAndRender;
        startDateInput.onchange = filterAndRender;
        endDateInput.onchange = filterAndRender;
        searchInput.oninput = filterAndRender;

        filterAndRender(); // Initial render

    } catch (error) {
        console.error('Error loading reports:', error);
        document.getElementById('report-table-body').innerHTML = '<tr><td colspan="7" style="text-align:center; color: red;">Error loading reports.</td></tr>';
    }
}

function renderTable(reports, tableBody) {
    tableBody.innerHTML = '';

    if (reports.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No matching reports found.</td></tr>';
        return;
    }

    reports.forEach(report => {
        const row = document.createElement('tr');
        const statusClass = getStatusClass(report.status);
        const dateStr = new Date(report.updated_at || report.created_at).toLocaleString();

        const reviewSnippet = report.field_review
            ? `<div class="review-snippet" title="${report.field_review}">${report.field_review.substring(0, 30)}${report.field_review.length > 30 ? '...' : ''}</div>`
            : '<span class="no-review">No updates</span>';

        row.innerHTML = `
            <td>RPT-${report.id.toString().padStart(5, '0')}</td>
            <td>${report.contact_name}</td>
            <td>${report.location}</td>
            <td><span class="badge ${statusClass}">${report.status}</span></td>
            <td>${report.assigned_team_name || 'Unassigned'}</td>
            <td>
                <div class="update-info">
                    ${dateStr}
                    ${reviewSnippet}
                </div>
            </td>
            <td>
                <button class="btn-view" onclick="viewDetails(${report.id})">View Details</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

window.viewDetails = function (id) {
    window.location.href = `./view_report.html?id=${id}`;
}

function getStatusClass(status) {
    if (!status) return 'pending';
    switch (status.toLowerCase()) {
        case 'received': return 'pending';
        case 'active': return 'active';
        case 'in_progress': return 'progress';
        case 'resolved': return 'resolved';
        default: return '';
    }
}
