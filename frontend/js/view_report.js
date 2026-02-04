document.addEventListener('DOMContentLoaded', async () => {
    // Block access if not logged in
    checkLogin();

    // Get report ID from URL (?id=123)
    const reportId = new URLSearchParams(window.location.search).get('id');

    if (!reportId) {
        alert('No Report ID found.');
        window.location.href = './admin_dashboard.html';
        return;
    }

    loadReport(reportId);
});


// ---------------- LOAD REPORT ----------------

async function loadReport(reportId) {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/reports/${reportId}`);

        if (!response.ok) {
            alert('Report not found.');
            return;
        }

        const report = await response.json();

        showReportDetails(report);
        setupStatusUpdate(report.id, report.status);

    } catch (err) {
        console.error('Error loading report:', err);
    }
}


// ---------------- DISPLAY REPORT ----------------

function showReportDetails(report) {
    setText('case-title', report.condition);
    setText('case-id', `ID: RSC-${String(report.id).padStart(6, '0')}`);
    setText('case-date', `Reported: ${new Date(report.created_at).toLocaleString()}`);

    setText('location-text', report.location);
    setText('summary-text', report.description);
    setText('reporter-name', report.contact_name);
    setText('reporter-phone', report.contact_phone);

    showStatus(report.status);
    showImage(report.photo_url);

    // Set field review if exists
    const reviewEl = document.getElementById('field-review');
    if (reviewEl && report.field_review) {
        reviewEl.value = report.field_review;
    }
}

function showStatus(status) {
    const statusEl = document.getElementById('case-status-text');
    if (!statusEl) return;

    statusEl.innerHTML = `Status: <span class="tag ${status}">${status}</span>`;
}

function showImage(photoUrl) {
    const img = document.getElementById('case-image');
    if (!img) return;

    if (!photoUrl) {
        img.style.display = 'none';
        return;
    }

    const fullUrl =
        photoUrl.startsWith('data:') || photoUrl.startsWith('http')
            ? photoUrl
            : `${API_BASE_URL}${photoUrl.startsWith('/') ? '' : '/'}${photoUrl}`;

    img.src = fullUrl;
    img.style.display = 'block';
}


// ---------------- STATUS UPDATE ----------------

function setupStatusUpdate(reportId, currentStatus) {
    const dropdown = document.getElementById('status-dropdown');
    const button = document.getElementById('update-btn');

    if (!dropdown || !button) return;

    dropdown.value = currentStatus;

    button.onclick = () => {
        const review = document.getElementById('field-review').value;
        updateStatusAndReview(reportId, dropdown.value, review);
    };
}

async function updateStatusAndReview(reportId, newStatus, fieldReview) {
    try {
        const response = await fetchWithAuth(
            `${API_BASE_URL}/reports/${reportId}`,
            {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: newStatus,
                    field_review: fieldReview
                })
            }
        );

        if (!response.ok) {
            alert('Failed to update case.');
            return;
        }

        alert('Case updated successfully!');
        location.reload();

    } catch (err) {
        console.error('Update error:', err);
    }
}


// ---------------- UTIL ----------------

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}
