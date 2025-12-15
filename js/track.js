
document.addEventListener('DOMContentLoaded', () => {
    const trackBtn = document.getElementById('track-btn');
    if (trackBtn) {
        trackBtn.addEventListener('click', async () => {
            const idInput = document.getElementById('tracking-id-input');
            const id = idInput.value.trim();

            if (!id) {
                alert("Please enter a tracking ID.");
                return;
            }

            // Simple loading state
            document.getElementById('status-message').innerText = "Searching...";

            try {
                const response = await fetch(`${API_BASE_URL}/reports/track/${id}`);

                if (response.ok) {
                    const data = await response.json();
                    updateUI(data.status);
                } else {
                    document.getElementById('progress-container').style.display = 'none';
                    document.getElementById('status-message').innerText = "Report not found. Please check the ID.";
                    document.getElementById('status-message').style.color = "red";
                }
            } catch (error) {
                console.error("Tracking error:", error);
                document.getElementById('status-message').innerText = "An error occurred while connecting to the server.";
            }
        });
    }

    function updateUI(status) {
        const container = document.getElementById('progress-container');
        container.style.display = 'flex';

        const received = document.getElementById('status-received');
        const inprogress = document.getElementById('status-inprogress');
        const resolved = document.getElementById('status-resolved');

        // Reset styles (using opacity for inactive state visual)
        [received, inprogress, resolved].forEach(el => {
            el.style.opacity = '0.3';
            el.style.fontWeight = 'normal';
        });

        document.getElementById('status-message').style.color = "#333";

        // Logic to highlight progress
        if (status === 'received') {
            received.style.opacity = '1';
            received.style.fontWeight = 'bold';
            document.getElementById('status-message').innerText = "Report Received. We are reviewing the details.";
        } else if (status === 'in_progress' || status === 'active') {
            received.style.opacity = '1';
            inprogress.style.opacity = '1';
            inprogress.style.fontWeight = 'bold';
            document.getElementById('status-message').innerText = "Rescue in Progress. Help is on the way/Active.";
        } else if (status === 'resolved') {
            received.style.opacity = '1';
            inprogress.style.opacity = '1';
            resolved.style.opacity = '1';
            resolved.style.fontWeight = 'bold';
            document.getElementById('status-message').innerText = "Resolved. The individual has been rescued or the case is closed.";
        } else {
            document.getElementById('status-message').innerText = `Current Status: ${status}`;
        }
    }
});
