document.addEventListener('DOMContentLoaded', async () => {

    // 1. CHECK LOGIN
    checkLogin();

    // 2. GET REPORT ID
    const urlParams = new URLSearchParams(window.location.search);
    const reportId = urlParams.get('id');

    if (!reportId) {
        alert("No Report ID found.");
        window.location.href = './admin_dashboard.html';
        return;
    }

    // 3. LOAD DATA
    await loadReportDetails(reportId);

    // --- HELPER FUNCTIONS ---

    async function loadReportDetails(id) {
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/reports/${id}`);

            if (!response.ok) {
                alert("Report not found.");
                return;
            }

            const report = await response.json();
            displayReport(report);
            setupStatusUpdate(report.id, report.status);

        } catch (error) {
            console.error("Error loading details:", error);
        }
    }

    function displayReport(report) {
        setText('case-title', report.condition);
        setText('case-id', `ID: RSC-${String(report.id).padStart(6, '0')}`);
        setText('case-date', `Reported: ${new Date(report.created_at).toLocaleString()}`);

        setText('location-text', report.location);
        setText('summary-text', report.description);
        setText('reporter-name', report.contact_name);
        setText('reporter-phone', report.contact_phone);

        // Status Badge
        const statusEl = document.getElementById('case-status-text');
        if (statusEl) {
            statusEl.innerHTML = `Status: <span class="tag ${report.status}">${report.status}</span>`;
        }

        // Photo
        const img = document.getElementById('case-image');
        if (img) {
            if (report.photo_url) {
                // Ensure full URL if needed
                const fullUrl = report.photo_url.startsWith('http')
                    ? report.photo_url
                    : `${API_BASE_URL}${report.photo_url}`;

                img.src = fullUrl;
                img.style.display = 'block';
            } else {
                img.style.display = 'none';
            }
        }
    }

    function setupStatusUpdate(id, currentStatus) {
        const statusDropdown = document.getElementById('status-dropdown');
        const updateBtn = document.getElementById('update-btn');

        if (statusDropdown && updateBtn) {
            statusDropdown.value = currentStatus;

            updateBtn.onclick = async () => {
                const newStatus = statusDropdown.value;
                await sendStatusUpdate(id, newStatus);
            };
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
                location.reload();
            } else {
                alert("Failed to update status.");
            }
        } catch (error) {
            console.error("Update error:", error);
        }
    }

    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.innerText = text;
    }
});
