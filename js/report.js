document.addEventListener('DOMContentLoaded', () => {

    checkLogin();

    const submitReportButton = document.getElementById('submit-report-btn');

    if (submitReportButton) {
        submitReportButton.addEventListener('click', async (event) => {
            event.preventDefault(); // Stop page reload

            const condition = document.getElementById('report-condition').value;
            const description = document.getElementById('report-description').value;
            const location = document.getElementById('report-location').value;
            const contactName = document.getElementById('contact-name').value;
            const contactPhone = document.getElementById('contact-phone').value;
            const photoInput = document.getElementById('report-photo');

            if (!condition || !description || !location || !contactName || !contactPhone) {
                alert("Please fill all required fields.");
                return;
            }

            const formData = new FormData();
            formData.append('condition', condition);
            formData.append('description', description);
            formData.append('location', location);
            formData.append('contact_name', contactName);
            formData.append('contact_phone', contactPhone);

            // If a photo was chosen, add it too
            if (photoInput.files.length > 0) {
                formData.append('photo', photoInput.files[0]);
            }

            try {
                const response = await fetchWithAuth(`${API_BASE_URL}/reports/`, {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    // SUCCESS
                    const data = await response.json();
                    alert(`Report submitted! ID: ${data.id}`);

                    // Redirect to the tracking page so they can see it
                    window.location.href = './track_report.html';
                } else {
                    // FAILURE
                    const error = await response.json();
                    alert("Failed to submit report. Please try again.");
                }

            } catch (error) {
                console.error("Submission error:", error);
                alert("Network error while submitting.");
            }
        });
    }
});
