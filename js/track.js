/*
 * TRACKING LOGIC
 * This file allows anyone to check the status of a report using its ID.
 * It does NOT require a login token (it is public).
 */

document.addEventListener('DOMContentLoaded', () => {

    // 1. TRACK BUTTON Click Event
    const trackBtn = document.getElementById('track-btn');

    if (trackBtn) {
        trackBtn.addEventListener('click', async () => {

            // Get the ID typed by the user
            const idInput = document.getElementById('tracking-id-input');
            const id = idInput.value.trim(); // .trim() removes spaces around the text

            // Validation: Ensure ID is not empty
            if (!id) {
                alert("Please enter a tracking ID.");
                return;
            }

            // Show a "Searching..." message so user knows something is happening
            const messageBox = document.getElementById('status-message');
            messageBox.innerText = "Searching...";
            messageBox.style.color = "blue";

            try {
                // Fetch status from backend (No token needed here)
                const response = await fetch(`${API_BASE_URL}/reports/track/${id}`);

                if (response.ok) {
                    // SUCCESS: Found the report
                    const data = await response.json();

                    // Call our helper function to update the screen
                    updateTrackingUI(data.status);
                } else {
                    // FAILURE: Report not found usually
                    // Hide the progress bar circles
                    document.getElementById('progress-container').style.display = 'none';
                    messageBox.innerText = "Report not found. Please check the ID.";
                    messageBox.style.color = "red";
                }

            } catch (error) {
                // NETWORK ERROR
                console.error("Tracking error:", error);
                messageBox.innerText = "Error connecting to the server.";
                messageBox.style.color = "red";
            }
        });
    }

    /**
     * HELPER: Update the Tracking UI
     * This function highlights the correct circle (Received, In Progress, Resolved)
     * based on the status we got from the backend.
     */
    function updateTrackingUI(status) {
        // Show the circles container
        const container = document.getElementById('progress-container');
        container.style.display = 'flex';

        // Get the 3 status elements
        const received = document.getElementById('status-received');
        const inprogress = document.getElementById('status-inprogress');
        const resolved = document.getElementById('status-resolved');

        // Reset all to "dim/inactive" first
        resetStyle(received);
        resetStyle(inprogress);
        resetStyle(resolved);

        const messageBox = document.getElementById('status-message');
        messageBox.style.color = "#333"; // Reset text color to black

        // Highlight based on status
        if (status === 'received') {
            highlightStyle(received);
            messageBox.innerText = "Report Received. We are reviewing the details.";

        } else if (status === 'in_progress' || status === 'active') {
            highlightStyle(received);
            highlightStyle(inprogress);
            messageBox.innerText = "Rescue in Progress. Help is on the way!";

        } else if (status === 'resolved') {
            highlightStyle(received);
            highlightStyle(inprogress);
            highlightStyle(resolved);
            messageBox.innerText = "Resolved. The individual has been rescued or the case is closed.";

        } else {
            // Unknown status
            messageBox.innerText = `Current Status: ${status}`;
        }
    }

    // Helper: Make an element look "inactive" (faded)
    function resetStyle(element) {
        element.style.opacity = '0.3';
        element.style.fontWeight = 'normal';
    }

    // Helper: Make an element look "active" (bright and bold)
    function highlightStyle(element) {
        element.style.opacity = '1';
        element.style.fontWeight = 'bold';
    }
});
