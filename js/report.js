
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const token = checkAuth(); // Redirects if not logged in

    const submitBtn = document.getElementById('submit-report-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            // Gather data
            const condition = document.getElementById('report-condition').value;
            const description = document.getElementById('report-description').value;
            const location = document.getElementById('report-location').value;
            const contactName = document.getElementById('contact-name').value;
            const contactPhone = document.getElementById('contact-phone').value;

            // Check required fields
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
            // Default priority is medium in backend

            const fileInput = document.getElementById('report-photo');
            if (fileInput.files.length > 0) {
                formData.append('photo', fileInput.files[0]);
            }

            try {
                // Using valid token
                const response = await fetch(`${API_BASE_URL}/reports/`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                        // Browser sets Content-Type automatically for FormData
                    },
                    body: formData
                });

                if (response.ok) {
                    const data = await response.json();
                    alert(`Report submitted successfully! Report ID: ${data.id}`);
                    window.location.href = './track_report.html';
                } else {
                    const err = await response.json();
                    console.error('Submission error:', err);
                    alert("Failed to submit report. Please try again.");
                }
            } catch (error) {
                console.error("Error submitting report:", error);
                alert("An error occurred while submitting the report.");
            }
        });
    }
});
