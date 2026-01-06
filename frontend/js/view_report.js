document.addEventListener('DOMContentLoaded', () => {

    checkLogin();

    const urlParams = new URLSearchParams(window.location.search);
    const reportId = urlParams.get('id');

    if (!reportId) {
        alert("No Report ID found.");
        window.location.href = './admin_dashboard.html';
        return;
    }

    loadReportDetails(reportId);

    async function loadReportDetails(id) {
        try {
            // Fetch the specific report from the server
            const response = await fetchWithAuth(`${API_BASE_URL}/reports/${id}`);

            if (response.ok) {
                const report = await response.json();

                // FILL THE SCREEN WITH DATA
                setText('case-title', report.condition);
                setText('case-id', `ID: RSC-${String(report.id).padStart(6, '0')}`);
                setText('case-date', `Reported: ${new Date(report.created_at).toLocaleString()}`);

                setText('location-text', report.location);
                setText('summary-text', report.description);
                setText('reporter-name', report.contact_name);
                setText('reporter-phone', report.contact_phone);

                // Show Status Badge
                const statusEl = document.getElementById('case-status-text');
                if (statusEl) {
                    statusEl.innerHTML = `Status: <span class="tag ${report.status}">${report.status}</span>`;
                }

                // Show Photo (if one exists)
                const img = document.getElementById('case-image');
                if (img) {
                    if (report.photo_url) {
                        // If it starts with "http", use it as is. Otherwise add our base URL.
                        const fullUrl = report.photo_url.startsWith('http')
                            ? report.photo_url
                            : `${API_BASE_URL}${report.photo_url.startsWith('/') ? '' : '/'}${report.photo_url}`;

                        img.src = fullUrl;
                        img.style.display = 'block';
                    } else {
                        img.style.display = 'none'; // No photo
                    }
                }

                // Setup the "Update Status" buttons
                const statusDropdown = document.getElementById('status-dropdown');
                const updateBtn = document.getElementById('update-btn');

                if (statusDropdown && updateBtn) {
                    statusDropdown.value = report.status;
                    updateBtn.onclick = () => sendStatusUpdate(report.id, statusDropdown.value);
                }

            } else {
                alert("Report not found.");
            }
        } catch (error) {
            console.error("Error loading details:", error);
        }
    }



    async function sendStatusUpdate(id, newStatus) {
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/reports/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                alert("Status updated successfully!");
                location.reload(); // Reload to see the change
            } else {
                alert("Failed to update status.");
            }
        } catch (error) {
            console.error("Update error:", error);
        }
    }

    function setText(elementId, text) {
        const el = document.getElementById(elementId);
        if (el) el.innerText = text;
    }
});
