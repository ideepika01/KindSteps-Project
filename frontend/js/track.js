// Run after page loads
document.addEventListener('DOMContentLoaded', function () {
    const token = checkLogin();
    if (!token) return;
    setupTracking();
});

// ---------------- SETUP ----------------

function setupTracking() {
    const trackBtn = document.getElementById('track-btn');
    if (!trackBtn) return;

    trackBtn.addEventListener('click', handleTracking);
}

// ---------------- TRACKING ----------------

async function handleTracking() {
    const reportId = getTrackingId();
    if (!reportId) return;

    showSearching();

    try {
        const response = await fetchWithAuth(
            `${API_BASE_URL}/reports/track/${reportId}`
        );

        if (response.ok) {
            const data = await response.json();
            updateTrackingUI(data);
        } else if (response.status === 403) {
            showAccessDenied();
        } else {
            showNotFound();
        }

    } catch (error) {
        console.error(error);
        showServerError();
    }
}

function getTrackingId() {
    const input = document.getElementById('tracking-id-input');
    const reportId = input.value.trim();

    if (!reportId) {
        alert('Please enter a tracking ID.');
        return null;
    }

    return reportId;
}

// ---------------- UI STATES ----------------

function showSearching() {
    const message = document.getElementById('status-message');
    message.innerText = 'Searching...';
    message.style.color = '#fff';
    document.getElementById('progress-container').style.display = 'none';
    document.getElementById('detailed-info').style.display = 'none';
}

function showNotFound() {
    document.getElementById('progress-container').style.display = 'none';
    document.getElementById('detailed-info').style.display = 'none';
    const message = document.getElementById('status-message');
    message.innerText = 'Report not found. Please check the ID.';
    message.style.color = 'red';
}

function showAccessDenied() {
    document.getElementById('progress-container').style.display = 'none';
    document.getElementById('detailed-info').style.display = 'none';
    const message = document.getElementById('status-message');
    message.innerText = 'You can only track reports you personally submitted.';
    message.style.color = 'orange';
}

function showServerError() {
    const message = document.getElementById('status-message');
    message.innerText = 'Error connecting to the server.';
    message.style.color = 'red';
}

// ---------------- STATUS UI ----------------

function updateTrackingUI(report) {
    showProgress();

    resetAllStatuses();

    const status = report.status;
    const message = document.getElementById('status-message');
    message.style.color = '#fff';

    if (status === 'received') {
        highlight('status-received');
        message.innerText = 'Report Received. We are reviewing the details.';

    } else if (status === 'in_progress' || status === 'active') {
        highlight('status-received');
        highlight('status-inprogress');
        message.innerText = 'Rescue in Progress. Help is on the way!';

    } else if (status === 'resolved') {
        highlight('status-received');
        highlight('status-inprogress');
        highlight('status-resolved');
        message.innerText = 'Resolved. The individual has been rescued.';

    } else {
        message.innerText = `Current Status: ${status}`;
    }

    // Show detailed info
    const detailedInfo = document.getElementById('detailed-info');
    detailedInfo.style.display = 'block';

    document.getElementById('info-priority').textContent = report.priority.charAt(0).toUpperCase() + report.priority.slice(1);
    document.getElementById('info-priority').style.color = getPriorityColor(report.priority);

    document.getElementById('info-team-name').textContent = report.assigned_team_name || 'Assigning soon...';
    document.getElementById('info-team-phone').textContent = report.assigned_team_phone || 'N/A';
    document.getElementById('info-updated').textContent = new Date(report.updated_at).toLocaleString();

    const rescueLocContainer = document.getElementById('rescue-location-container');
    if (report.rescued_location) {
        rescueLocContainer.style.display = 'block';
        document.getElementById('info-rescue-location').textContent = report.rescued_location;
    } else {
        rescueLocContainer.style.display = 'none';
    }
}

function getPriorityColor(priority) {
    switch (priority) {
        case 'high': return '#ff4444';
        case 'medium': return '#ffbb33';
        case 'low': return '#00C851';
        default: return '#fff';
    }
}

function showProgress() {
    document.getElementById('progress-container').style.display = 'flex';
}

function resetAllStatuses() {
    resetStyle('status-received');
    resetStyle('status-inprogress');
    resetStyle('status-resolved');
}

function resetStyle(id) {
    const el = document.getElementById(id);
    el.style.opacity = '0.3';
    el.style.fontWeight = 'normal';
}

function highlight(id) {
    const el = document.getElementById(id);
    el.style.opacity = '1';
    el.style.fontWeight = 'bold';
}
