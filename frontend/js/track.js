// Run after page loads
document.addEventListener('DOMContentLoaded', function () {
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
        const response = await fetch(
            `${API_BASE_URL}/reports/track/${reportId}`
        );

        if (response.ok) {
            const data = await response.json();
            updateTrackingUI(data.status);
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
    message.style.color = 'blue';
}

function showNotFound() {
    document.getElementById('progress-container').style.display = 'none';
    const message = document.getElementById('status-message');
    message.innerText = 'Report not found. Please check the ID.';
    message.style.color = 'red';
}

function showServerError() {
    const message = document.getElementById('status-message');
    message.innerText = 'Error connecting to the server.';
    message.style.color = 'red';
}


// ---------------- STATUS UI ----------------

function updateTrackingUI(status) {
    showProgress();

    resetAllStatuses();

    const message = document.getElementById('status-message');
    message.style.color = '#333';

    if (status === 'received') {
        highlight('status-received');
        message.innerText =
            'Report Received. We are reviewing the details.';

    } else if (status === 'in_progress' || status === 'active') {
        highlight('status-received');
        highlight('status-inprogress');
        message.innerText =
            'Rescue in Progress. Help is on the way!';

    } else if (status === 'resolved') {
        highlight('status-received');
        highlight('status-inprogress');
        highlight('status-resolved');
        message.innerText =
            'Resolved. The individual has been rescued or the case is closed.';

    } else {
        message.innerText = `Current Status: ${status}`;
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
