// This script handles the "Create New Report" form.
// It collects user input, including photos, and sends it to the backend.

document.addEventListener('DOMContentLoaded', () => {

    checkLogin(); // Ensure user is logged in

    const submitReportButton = document.getElementById('submit-report-btn');
    const photoInput = document.getElementById('report-photo');

    // Show filename when file is selected
    if (photoInput) {
        photoInput.addEventListener('change', () => {
            const uploadContent = document.querySelector('.upload-content');
            if (photoInput.files.length > 0) {
                const fileName = photoInput.files[0].name;
                uploadContent.innerHTML = `<p style="color:green; font-weight:bold;">Selected: ${fileName}</p>`;
            } else {
                uploadContent.innerHTML = `
                    <div class="upload-icon">📷</div>
                    <p>Drag & drop photo here, or click to browse</p>
                    <span>Supported formats: JPG, PNG (max 5MB)</span>`;
            }
        });
    }

    if (submitReportButton) {
        submitReportButton.addEventListener('click', async (event) => {
            event.preventDefault(); // Stop page reload

            // 1. Get Values from Form
            const condition = document.getElementById('report-condition').value;
            const description = document.getElementById('report-description').value;
            const location = document.getElementById('report-location').value;
            const contactName = document.getElementById('contact-name').value;
            const contactPhone = document.getElementById('contact-phone').value;
            const photoInput = document.getElementById('report-photo');

            // 2. Simple Validation
            if (!condition || !description || !location || !contactName || !contactPhone) {
                alert("Please fill all required fields.");
                return;
            }

            // 3. Prepare Data (Using FormData to handle file uploads)
            const formData = new FormData();
            formData.append('condition', condition);
            formData.append('description', description);
            formData.append('location', location);
            formData.append('contact_name', contactName);
            formData.append('contact_phone', contactPhone);

            // If a photo was chosen, append it to the form
            if (photoInput.files.length > 0) {
                formData.append('photo', photoInput.files[0]);
            }

            try {
                // 4. Send POST request to create report
                const response = await fetchWithAuth(`${API_BASE_URL}/reports/`, {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    // SUCCESS
                    const data = await response.json();
                    alert(`Report submitted! ID: ${data.id}`);

                    // Redirect to the tracking page so they can see their new report
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
