document.addEventListener('DOMContentLoaded', () => {

    const trackButton = document.getElementById('track-btn');

    if (trackButton) {
        trackButton.addEventListener('click', async () => {

            // Get the text input box where the user typed the ID
            const trackingIdInput = document.getElementById('tracking-id-input');

            // Get the value (text) from inside the input box
            // .trim() is a helper that removes empty spaces from the start and end
            const reportId = trackingIdInput.value.trim();

            // CHECK: Did the user leave it empty?
            if (!reportId) {
                alert("Please enter a tracking ID.");
                return; // Stop the function here
            }

            const statusMessageElement = document.getElementById('status-message');
            statusMessageElement.innerText = "Searching...";
            statusMessageElement.style.color = "blue";

            try {
                const response = await fetch(`${API_BASE_URL}/reports/track/${reportId}`);

                if (response.ok) {
                    // Convert the server's answer (JSON text) into a JavaScript object
                    const data = await response.json();

                    // Update the screen with the status we got
                    updateTrackingUI(data.status);

                } else {
                    // FAILURE: The server said "404 Not Found" or another error

                    // Hide the progress bar circles because we didn't find a report
                    document.getElementById('progress-container').style.display = 'none';

                    // Show an error message
                    statusMessageElement.innerText = "Report not found. Please check the ID.";
                    statusMessageElement.style.color = "red";
                }

            } catch (error) {
                // NETWORK ERROR: The internet is down or the server is offline
                console.error("Tracking error:", error);

                statusMessageElement.innerText = "Error connecting to the server.";
                statusMessageElement.style.color = "red";
            }
        });
    }

    function updateTrackingUI(currentStatus) {

        // Find the container that holds the progress circles and show it
        const progressContainer = document.getElementById('progress-container');
        progressContainer.style.display = 'flex'; // 'flex' makes it visible

        // Find the 3 specific status circles
        const receivedCircle = document.getElementById('status-received');
        const inProgressCircle = document.getElementById('status-inprogress');
        const resolvedCircle = document.getElementById('status-resolved');

        // First, make all circles look "inactive" (dim/faded)
        // We do this to clear any old highlights
        resetStyle(receivedCircle);
        resetStyle(inProgressCircle);
        resetStyle(resolvedCircle);

        // Get the message box to update the text explanation
        const statusMessageElement = document.getElementById('status-message');
        statusMessageElement.style.color = "#333"; // Set text color to dark grey

        // Now, highlight the correct circles based on the status

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
        element.style.opacity = '1';         // 100% visible (fully solid)
        element.style.fontWeight = 'bold';   // Bold text
    }
});
