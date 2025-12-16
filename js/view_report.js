/*
 * VIEW SINGLE REPORT LOGIC
 * This page shows all details for ONE specific report.
 * It reads the ID from the URL (e.g., ?id=5).
 */

document.addEventListener('DOMContentLoaded', () => {
    checkAuth(); // Verify login

    // 1. GET REPORT ID FROM URL
    // The URL looks like: .../view_report.html?id=15
    const urlParams = new URLSearchParams(window.location.search);
    const reportId = urlParams.get('id');

    if (!reportId) {
        alert("No Report ID specified.");
        window.location.href = './admin_dashboard.html';
        return;
    }

    // Start loading data
    loadReportDetails(reportId);

    // 2. FETCH AND SHOW DETAILS
    async function loadReportDetails(id) {
        try {
            // Fetch one report from backend
            const response = await authFetch(`${API_BASE_URL}/reports/${id}`);

            if (response.ok) {
                const report = await response.json();

                // Fill the HTML elements with data
                setText('detail-id', report.id);
                setText('detail-status', report.status);
                setText('detail-condition', report.condition);
                setText('detail-desc', report.description);
                setText('detail-location', report.location);

                // Contact info
                setText('detail-contact-name', report.contact_name);
                setText('detail-contact-phone', report.contact_phone);

                // Date formatting
                const date = new Date(report.created_at).toLocaleString();
                setText('detail-date', date);

                // Handle Photo (if it exists)
                const img = document.getElementById('detail-photo');
                if (img) {
                    if (report.photo_url) {
                        // Handle potential path formats
                        img.src = report.photo_url.startsWith('http')
                            ? report.photo_url
                            : `${API_BASE_URL}/${report.photo_url}`;
                        img.style.display = 'block';
                    } else {
                        img.style.display = 'none'; // Hide if no photo
                    }
                }

                // Setup Action Buttons (Assign, Resolve, etc.)
                setupActionButtons(report);

            } else {
                alert("Report not found.");
            }
        } catch (error) {
            console.error("Error loading details:", error);
        }
    }

    // 3. SETUP BUTTONS
    function setupActionButtons(report) {
        const actionsDiv = document.getElementById('action-buttons');
        if (!actionsDiv) return;

        actionsDiv.innerHTML = ''; // Clear old buttons

        // Button: UPDATE STATUS
        // We create a dropdown to pick a status
        const statusSelect = document.createElement('select');
        statusSelect.innerHTML = `
            <option value="received">Received</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
        `;
        statusSelect.value = report.status; // Selected current status

        const updateBtn = document.createElement('button');
        updateBtn.innerText = "Update Status";
        updateBtn.onclick = () => updateReportStatus(report.id, statusSelect.value);

        // Add them to the page
        actionsDiv.appendChild(statusSelect);
        actionsDiv.appendChild(updateBtn);
    }

    // 4. SEND UPDATE TO BACKEND
    async function updateReportStatus(id, newStatus) {
        try {
            const response = await authFetch(`${API_BASE_URL}/reports/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }) // Only sending status update
            });

            if (response.ok) {
                alert("Status updated successfully!");
                location.reload(); // Reload page to see changes
            } else {
                alert("Failed to update status.");
            }
        } catch (error) {
            console.error("Update error:", error);
        }
    }

    // HELPER: Safely set text content
    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.innerText = text;
    }
});
