// This script runs the dashboard that our rescue heroes use to see their tasks.

document.addEventListener('DOMContentLoaded', () => {
    checkLogin();           // Checking if the user is a team member
    loadTeamAssignments();  // Getting all their assigned cases ready to view
});

// Fetching the list of cases from our database
async function loadTeamAssignments() {
    const grid = document.getElementById('rescue-reports-grid');
    if (!grid) return;

    try {
        // Use a cache-busting timestamp to ensure we get fresh data from the server
        const response = await fetchWithAuth(`${API_BASE_URL}/reports/my-assignments?t=${new Date().getTime()}`);

        if (!response.ok) {
            grid.innerHTML = '<p class="error-msg">Hmm, we couldn\'t load your cases right now.</p>';
            return;
        }

        const allReports = await response.json();
        if (!Array.isArray(allReports)) return;

        console.log(`Fetched ${allReports.length} reports.`);
        updateStats(allReports); // Crunching the numbers for the dashboard stats

        const filterSelect = document.getElementById('status-filter');
        const startDateInput = document.getElementById('start-date');
        const endDateInput = document.getElementById('end-date');

        const applyFilter = () => {
            const selectedStatus = (filterSelect.value || "all").toLowerCase().trim();
            const startVal = startDateInput.value;
            const endVal = endDateInput.value;

            const startDate = startVal ? new Date(startVal) : null;
            const endDate = endVal ? new Date(endVal) : null;

            if (startDate) startDate.setHours(0, 0, 0, 0);
            if (endDate) endDate.setHours(23, 59, 59, 999);

            let filteredList = [...allReports];

            // 1. Filter by Status (Robust case-blind check)
            if (selectedStatus !== 'all') {
                filteredList = filteredList.filter(report => {
                    const rStatus = (report.status || "received").toString().toLowerCase().trim();
                    const activeGroup = ['active', 'in_progress'];

                    if (selectedStatus === 'in_progress') return activeGroup.includes(rStatus);
                    return rStatus === selectedStatus;
                });
            }

            // 2. Filter by Date Range (Consider both creation and update for safety)
            if (startDate || endDate) {
                filteredList = filteredList.filter(report => {
                    const reportDate = new Date(report.updated_at || report.created_at);
                    if (isNaN(reportDate.getTime())) return true;
                    if (startDate && reportDate < startDate) return false;
                    if (endDate && reportDate > endDate) return false;
                    return true;
                });
            }

            renderGrid(filteredList, grid);
        };

        filterSelect.onchange = applyFilter;
        startDateInput.onchange = applyFilter;
        endDateInput.onchange = applyFilter;
        applyFilter();

    } catch (err) {
        console.error('Data Fetch Error:', err);
        grid.innerHTML = '<p class="error-msg">Looks like we can\'t connect to the server.</p>';
    }
}

// Updating the big numbers at the top of the dashboard so you can see your impact
function updateStats(reports) {
    if (!Array.isArray(reports)) return;

    const counts = {
        total: reports.length,
        progress: 0,
        resolved: 0
    };

    reports.forEach(r => {
        const s = (r.status || "").toString().toLowerCase().trim();
        if (s === 'resolved') {
            counts.resolved++;
        } else if (s === 'in_progress' || s === 'active') {
            counts.progress++;
        }
    });

    // Update the UI with fresh numbers
    const totalEl = document.getElementById('stat-total');
    const progressEl = document.getElementById('stat-progress');
    const resolvedEl = document.getElementById('stat-resolved');

    if (totalEl) totalEl.innerText = counts.total;
    if (progressEl) progressEl.innerText = counts.progress;
    if (resolvedEl) resolvedEl.innerText = counts.resolved;

    console.log("Stats Updated - Total:", counts.total, "Resolved:", counts.resolved);
}

// Clearing the grid and filling it with fresh report cards
function renderGrid(list, container) {
    container.innerHTML = ''; // Fresh start

    if (list.length === 0) {
        container.innerHTML = `<div class="empty-state">No cases match your filters! Try changing the status or date.</div>`;
        return;
    }

    // Sort by latest activity (updated_at) or creation
    const sorted = [...list].sort((a, b) => {
        const dateA = new Date(a.updated_at || a.created_at);
        const dateB = new Date(b.updated_at || b.created_at);
        return dateB - dateA;
    });

    sorted.forEach(report => {
        const card = createCardElement(report);
        container.appendChild(card);
    });

    if (window.AOS) AOS.refresh();
}

// Designing the actual HTML structure for each individual case card
function createCardElement(report) {
    const el = document.createElement('article');
    el.className = 'case-card';
    el.setAttribute('data-aos', 'fade-up');

    const rawStatus = (report.status || 'received').toString().toLowerCase();
    const formattedDate = new Date(report.created_at).toLocaleDateString();

    el.innerHTML = `
        <div class="case-top">
            <div class="case-id">RPT-${String(report.id).padStart(5, '0')}</div>
            <span class="tag ${rawStatus}">${rawStatus.replace('_', ' ')}</span>
        </div>

        <h3>${report.condition}</h3>

        <ul class="case-details">
            <li>📍 ${report.location}</li>
            <li>🕒 Assigned: ${formattedDate}</li>
            <li>📞 Contact: ${report.contact_name} (${report.contact_phone})</li>
        </ul>

        <div class="case-actions">
            <a href="./view_report.html?id=${report.id}" class="btn-primary small">Update Status</a>
            <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(report.location)}" 
               target="_blank" class="btn-primary small map-btn">🗺️</a>
        </div>
    `;

    return el;
}
