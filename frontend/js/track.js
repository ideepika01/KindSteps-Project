document.addEventListener('DOMContentLoaded', () => {

    const trackButton = document.getElementById('track-btn');

    if (trackButton) {
        trackButton.addEventListener('click', async () => {

            const trackingIdInput = document.getElementById('tracking-id-input');
            const reportId = trackingIdInput.value.trim();

            if (!reportId) {
                alert("Please enter a tracking ID.");
                return;
            }

            const statusMessageElement = document.getElementById('status-message');
            statusMessageElement.innerText = "Searching...";
            statusMessageElement.style.color = "blue";

            try {
                const response = await fetch(`${API_BASE_URL}/reports/track/${reportId}`);

                if (response.ok) {
                    const data = await response.json();
                    updateTrackingUI(data.status);
                } else {
                    document.getElementById('progress-container').style.display = 'none';
                    statusMessageElement.innerText = "Report not found. Please check the ID.";
                    statusMessageElement.style.color = "red";
                }

            } catch (error) {
                console.error("Tracking error:", error);
                statusMessageElement.innerText = "Error connecting to the server.";
                statusMessageElement.style.color = "red";
            }
        });
    }

    function updateTrackingUI(currentStatus) {

        const progressContainer = document.getElementById('progress-container');
        progressContainer.style.display = 'flex';

        const receivedCircle = document.getElementById('status-received');
        const inProgressCircle = document.getElementById('status-inprogress');
        const resolvedCircle = document.getElementById('status-resolved');

        resetStyle(receivedCircle);
        resetStyle(inProgressCircle);
        resetStyle(resolvedCircle);

        const statusMessageElement = document.getElementById('status-message');
        statusMessageElement.style.color = "#333";

        if (currentStatus === 'received') {
            highlightStyle(receivedCircle);
            statusMessageElement.innerText = "Report Received. We are reviewing the details.";

        } else if (currentStatus === 'in_progress' || currentStatus === 'active') {
            highlightStyle(receivedCircle);
            highlightStyle(inProgressCircle);
            statusMessageElement.innerText = "Rescue in Progress. Help is on the way!";

        } else if (currentStatus === 'resolved') {
            highlightStyle(receivedCircle);
            highlightStyle(inProgressCircle);
            highlightStyle(resolvedCircle);
            statusMessageElement.innerText = "Resolved. The individual has been rescued or the case is closed.";

        } else {
            statusMessageElement.innerText = `Current Status: ${currentStatus}`;
        }
    }

    function resetStyle(element) {
        element.style.opacity = '0.3';
        element.style.fontWeight = 'normal';
    }

    function highlightStyle(element) {
        element.style.opacity = '1';
        element.style.fontWeight = 'bold';
    }
});
