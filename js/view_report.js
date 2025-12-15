
document.addEventListener('DOMContentLoaded', async () => {
    const token = checkAuth(); // Ensure logged in

    // Get ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const reportId = urlParams.get('id');

    if (!reportId) {
        alert("No report ID provided.");
        window.location.href = './report_list.html'; // Default back to list
        return;
    }

    try {
        const response = await authFetch(`${API_BASE_URL}/reports/${reportId}`);
        if (response.ok) {
            const report = await response.json();
            populateReportDetails(report);
            setupUpdateLogic(report.id);
        } else {
            alert("Report not found.");
            // window.location.href = './report_list.html'; 
        }
    } catch (error) {
        console.error("Error loading report:", error);
    }
});

function populateReportDetails(report) {
    // Basic Details
    setText('case-id', `ID: ${report.id}`);
    setText('case-title', report.description.substring(0, 50) + (report.description.length > 50 ? "..." : ""));
    setText('case-date', `Reported: ${new Date(report.created_at).toLocaleString()}`);

    // Status (Handle formatting)
    const statusEl = document.getElementById('case-status-text');
    if (statusEl) statusEl.innerHTML = `Status: <span>${report.status}</span>`;

    // Reporter (In real app, fetch user details if report has reporter_id, 
    // or display the contact info provided in report)
    setText('reporter-name', report.contact_name);
    // setText('reporter-email', report.reporter ? report.reporter.email : 'N/A'); // If backend provides this
    setText('reporter-phone', `📞 ${report.contact_phone}`);

    // Location
    setText('location-text', report.location);
    // setText('map-img-src', ...); // If we had a map API

    // Summary/Description
    setText('summary-text', report.description);

    // Photo
    if (report.photo_url) {
        const img = document.getElementById('case-image');
        if (img) {
            // Check if photo_url starts with http or /
            if (report.photo_url.startsWith('http')) {
                img.src = report.photo_url;
            } else {
                img.src = `${API_BASE_URL}${report.photo_url}`;
            }
        }
    }

    // Set dropdown value
    const dropdown = document.getElementById('status-dropdown');
    if (dropdown) dropdown.value = report.status;
}

function setupUpdateLogic(id) {
    const updateBtn = document.getElementById('update-btn');
    if (updateBtn) {
        updateBtn.addEventListener('click', async () => {
            const dropdown = document.getElementById('status-dropdown');
            const newStatus = dropdown.value;

            if (!newStatus || newStatus === 'Case Status') {
                alert("Please select a status.");
                return;
            }

            // Backend expects "received", "in_progress", "active", "resolved"
            // Ensure dropdown values match enums

            try {
                const response = await authFetch(`${API_BASE_URL}/reports/${id}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus })
                });

                if (response.ok) {
                    alert("Status updated successfully!");
                    window.location.reload();
                } else {
                    const err = await response.json();
                    alert(`Update failed: ${err.detail}`);
                }
            } catch (error) {
                console.error("Update error:", error);
            }
        });
    }
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}
