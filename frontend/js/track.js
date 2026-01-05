// This script handles the "Track Report" public page.
// Users enter an ID, and we fetch the current status (Received, In Progress, Resolved).

document.addEventListener('DOMContentLoaded', () => {

    const trackButton = document.getElementById('track-btn');

    if (trackButton) {
        trackButton.addEventListener('click', async () => {

            // 1. Get the Report ID from the input box
            const trackingIdInput = document.getElementById('tracking-id-input');
            const reportId = trackingIdInput.value.trim(); // .trim() removes extra spaces

            if (!reportId) {
                alert("Please enter a tracking ID.");
                return;
            }

            // Show "Searching..." to give feedback
            const statusMessageElement = document.getElementById('status-message');
            statusMessageElement.innerText = "Searching...";
            statusMessageElement.style.color = "blue";

            try {
                // 2. Fetch Report Status from Backend
                const response = await fetch(`${API_BASE_URL}/reports/track/${reportId}`);

                if (response.ok) {
                    const data = await response.json();

                    // 3. Update the UI with the result
                    updateTrackingUI(data.status);

                } else {
                    // FAILURE (e.g. ID not found)
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

    // --- HELPER FUNCTIONS ---

    /*
     * Updates the status circles (progressBar) based on the report status.
     * Statuses: 'received' -> 'active/in_progress' -> 'resolved'
     */
    function updateTrackingUI(currentStatus) {

        // Show the progress bar container
        const progressContainer = document.getElementById('progress-container');
        progressContainer.style.display = 'flex';

        // Get the 3 status circle elements
        const receivedCircle = document.getElementById('status-received');
        const inProgressCircle = document.getElementById('status-inprogress');
        const resolvedCircle = document.getElementById('status-resolved');

        // Reset all to dim first
        resetStyle(receivedCircle);
        resetStyle(inProgressCircle);
        resetStyle(resolvedCircle);

        const statusMessageElement = document.getElementById('status-message');
        statusMessageElement.style.color = "#333";

        // Highlight the circles progressively
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
        element.style.opacity = '1';         // Fully visible
        element.style.fontWeight = 'bold';   // Bold text
    }
});
