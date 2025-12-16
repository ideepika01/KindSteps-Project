/*
 * RESCUE TEAM DASHBOARD LOGIC
 * This file handles the page for Rescue Team members.
 * It shows reports assigned specifically to them (or open reports).
 */

document.addEventListener('DOMContentLoaded', () => {

    // 1. CHECK LOGIN
    checkAuth();

    // 2. LOGOUT BUTTON
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // 3. LOAD ASSIGNED REPORTS
    loadAssignedReports();

    async function loadAssignedReports() {
        try {
            // Fetch reports assigned to ME (the logged-in rescue team member)
            const response = await authFetch(`${API_BASE_URL}/reports/my-assignments`);

            if (response.ok) {
                const reports = await response.json();
                renderTeamTable(reports);
            } else {
                console.error("Failed to load assignments");
            }
        } catch (error) {
            console.error("Error loading assignments:", error);
        }
    }

    // 4. HELPER: Draw the list
    function renderTeamTable(reports) {
        const container = document.getElementById('assigned-reports-list');
        if (!container) return;

        container.innerHTML = ''; // Clear list

        if (reports.length === 0) {
            container.innerHTML = '<p>No active assignments.</p>';
            return;
        }

        reports.forEach(report => {
            // Create a card (div) for each report instead of a table row
            const card = document.createElement('div');
            card.className = 'report-card';

            card.innerHTML = `
                <h3>Report #${report.id} - ${report.condition}</h3>
                <p><strong>Location:</strong> ${report.location}</p>
                <p><strong>Description:</strong> ${report.description}</p>
                <p><strong>Status:</strong> <span class="status-badge ${report.status}">${report.status}</span></p>
                <button onclick="updateStatus(${report.id}, 'resolved')">Mark Resolved</button>
            `;

            container.appendChild(card);
        });
    }

    // 5. UPDATE STATUS FUNCTION
    // Rescue team can verify/resolve a report.
    window.updateStatus = async (reportId, newStatus) => {
        if (!confirm(`Are you sure you want to mark Report #${reportId} as ${newStatus}?`)) {
            return; // Cancelled
        }

        try {
            // Send the update to the backend
            const response = await authFetch(`${API_BASE_URL}/reports/${reportId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                alert("Status updated!");
                loadAssignedReports(); // Refresh the list
            } else {
                alert("Failed to update status.");
            }
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };
});
