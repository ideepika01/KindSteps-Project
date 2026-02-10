// Case Details Logic: Displays report information and map coordinates.
document.addEventListener('DOMContentLoaded', async () => {
    // Block access if not logged in
    checkLogin();

    // Get report ID from URL (?id=123)
    const reportId = new URLSearchParams(window.location.search).get('id');

    if (!reportId) {
        alert('No Report ID found.');
        window.location.href = './main.html';
        return;
    }

    // Setup Dynamic Back Button
    const backBtn = document.getElementById('back-to-dash');
    if (backBtn) {
        backBtn.onclick = async (e) => {
            e.preventDefault();
            try {
                const res = await fetchWithAuth(`${API_BASE_URL}/auth/me`);
                if (res.ok) {
                    const user = await res.json();
                    if (user.role === 'admin') window.location.href = './admin_control.html';
                    else if (user.role === 'rescue_team') window.location.href = './rescue_team.html';
                    else window.location.href = './my_reports.html';
                } else {
                    window.location.href = './main.html';
                }
            } catch (e) {
                window.location.href = './main.html';
            }
        };
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

    const locationEl = document.getElementById('location-text');
    if (locationEl) {
        locationEl.textContent = report.location;
        if (report.latitude && report.longitude) {
            locationEl.innerHTML += `<br><small style="margin-top: 10px; display: block;">
                <a href="https://www.google.com/maps?q=${report.latitude},${report.longitude}" target="_blank" style="color: #64b5f6; text-decoration: none; display: inline-flex; align-items: center; gap: 5px;">
                    <span>📍</span> View on Google Maps
                </a></small>`;
        }
    }
    setText('summary-text', report.description);
    setText('reporter-name', report.contact_name);
    setText('reporter-phone', report.contact_phone);

    showStatus(report.status);
    showImage(report.photo_url);

    // Set field review and rescued location if exists
    const reviewEl = document.getElementById('field-review');
    if (reviewEl && report.field_review) {
        reviewEl.value = report.field_review;
    }

    const rescuedLocEl = document.getElementById('rescued-location');
    if (rescuedLocEl && report.rescued_location) {
        rescuedLocEl.value = report.rescued_location;
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
        const rescuedLoc = document.getElementById('rescued-location').value;
        updateStatusAndReview(reportId, dropdown.value, review, rescuedLoc);
    };
}

async function updateStatusAndReview(reportId, newStatus, fieldReview, rescuedLocation) {
    try {
        const response = await fetchWithAuth(
            `${API_BASE_URL}/reports/${reportId}`,
            {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: newStatus,
                    field_review: fieldReview,
                    rescued_location: rescuedLocation
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
