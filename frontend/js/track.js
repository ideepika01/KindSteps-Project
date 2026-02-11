// This script helps users track the live status of the reports they've filed.

document.addEventListener('DOMContentLoaded', function () {
    const token = checkLogin(); // First, we make sure they are signed in
    if (!token) return;
    setupTracking();

    // Check if there's an ID in the URL to start tracking automatically
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (id) {
        const input = document.getElementById('tracking-id-input');
        if (input) input.value = id;
        handleTracking();
    } else {
        // If there's no ID, we'll send them back to their list of reports
        window.location.href = './my_reports.html';
    }
});

// Setting up the basic tracking controls
function setupTracking() {
    const trackBtn = document.getElementById('track-btn');
    if (!trackBtn) return;

    trackBtn.addEventListener('click', handleTracking);
}

// Fetching the report details from the server
async function handleTracking() {
    const reportId = getTrackingId();
    if (!reportId) return;

    showSearching(); // Show a friendly notice that we're looking up the info

    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/reports/track/${reportId}`);

        if (response.ok) {
            const data = await response.json();
            updateTrackingUI(data); // Fill the screen with the report's progress
        } else if (response.status === 403) {
            showAccessDenied(); // Safety first: you can only see your own reports
        } else {
            showNotFound(); // Oops, that ID doesn't seem to exist
        }

    } catch (error) {
        console.error(error);
        showServerError();
    }
}

// Grabbing the ID from the search box
function getTrackingId() {
    const input = document.getElementById('tracking-id-input');
    const reportId = input.value.trim();

    if (!reportId) {
        alert('Please enter a tracking ID so we can find your report.');
        return null;
    }

    return reportId;
}

// Showing a "Searching" message while we wait for the server
function showSearching() {
    const message = document.getElementById('status-message');
    message.innerText = 'Searching for your report...';
    message.style.color = '#fff';
    document.getElementById('progress-container').style.display = 'none';
    document.getElementById('detailed-info').style.display = 'none';
}

// Letting the user know if the report wasn't found
function showNotFound() {
    document.getElementById('progress-container').style.display = 'none';
    document.getElementById('detailed-info').style.display = 'none';
    const message = document.getElementById('status-message');
    message.innerText = 'We couldn\'t find that report. Please check the ID and try again.';
    message.style.color = 'red';
}

// Friendly access denied message
function showAccessDenied() {
    document.getElementById('progress-container').style.display = 'none';
    document.getElementById('detailed-info').style.display = 'none';
    const message = document.getElementById('status-message');
    message.innerText = 'For security, you can only track reports you submitted yourself.';
    message.style.color = 'orange';
}

// Server error notice
function showServerError() {
    const message = document.getElementById('status-message');
    message.innerText = 'We\'re having trouble connecting to the server. Please try again later.';
    message.style.color = 'red';
}

// Updating the UI with the final status and progress bar
function updateTrackingUI(report) {
    showProgress();
    resetAllStatuses();

    const status = report.status;
    const message = document.getElementById('status-message');
    message.style.color = '#fff';

    // Highlighting the current step in the rescue process
    if (status === 'received') {
        highlight('status-received');
        message.innerText = 'We\'ve received your report and are reviewing it now.';

    } else if (status === 'in_progress' || status === 'active') {
        highlight('status-received');
        highlight('status-inprogress');
        message.innerText = 'Great news! A rescue team is currently on the way.';

    } else if (status === 'resolved') {
        highlight('status-received');
        highlight('status-inprogress');
        highlight('status-resolved');
        message.innerText = 'Excellent! The individual has been successfully rescued.';

    } else {
        message.innerText = `Current Status: ${status}`;
    }

    // Showing extra details like priority and assigned team
    const detailedInfo = document.getElementById('detailed-info');
    detailedInfo.style.display = 'block';

    document.getElementById('info-priority').textContent = report.priority.charAt(0).toUpperCase() + report.priority.slice(1);
    document.getElementById('info-priority').style.color = getPriorityColor(report.priority);

    document.getElementById('info-team-name').textContent = report.assigned_team_name || 'Assigning a team soon...';
    document.getElementById('info-team-phone').textContent = report.assigned_team_phone || 'N/A';

    const updateLabel = report.status === 'resolved' ? '🚀 Rescue Completed' : '🕒 Last Update';
    document.getElementById('info-updated').textContent = `${updateLabel}: ${new Date(report.updated_at).toLocaleString()}`;

    // Showing notes from the field if the rescue team has shared any
    const reviewContainer = document.getElementById('field-review-container');
    const reviewText = document.getElementById('info-field-review');
    if (report.field_review) {
        if (reviewContainer) reviewContainer.style.display = 'block';
        if (reviewText) reviewText.textContent = report.field_review;
    } else {
        if (reviewContainer) reviewContainer.style.display = 'none';
    }

    // Showing destination if the rescue has specific location updates
    const rescueLocContainer = document.getElementById('rescue-location-container');
    if (report.rescued_location) {
        rescueLocContainer.style.display = 'block';
        const label = report.status === 'resolved' ? '✅ Rescue Destination' : '📍 Current Location';
        rescueLocContainer.innerHTML = `<p><strong>${label}:</strong> <span id="info-rescue-location">${report.rescued_location}</span></p>`;
    } else {
        rescueLocContainer.style.display = 'none';
    }
}

// Simple color helper for priority levels
function getPriorityColor(priority) {
    switch (priority) {
        case 'high': return '#ff4444';
        case 'medium': return '#ffbb33';
        case 'low': return '#00C851';
        default: return '#fff';
    }
}

// Showing the progress bar grid
function showProgress() {
    document.getElementById('progress-container').style.display = 'flex';
}

// Dimming all steps before we highlight the active one
function resetAllStatuses() {
    resetStyle('status-received');
    resetStyle('status-inprogress');
    resetStyle('status-resolved');
}

// Setting an inactive style
function resetStyle(id) {
    const el = document.getElementById(id);
    el.style.opacity = '0.3';
    el.style.fontWeight = 'normal';
}

// Setting an active style to make it pop
function highlight(id) {
    const el = document.getElementById(id);
    el.style.opacity = '1';
    el.style.fontWeight = 'bold';
}
