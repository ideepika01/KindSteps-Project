// Handles the "Create New Report" form.

document.addEventListener('DOMContentLoaded', () => {

    checkLogin();

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
            event.preventDefault();

            // Get Values
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

            // Prepare Data
            const formData = new FormData();
            formData.append('condition', condition);
            formData.append('description', description);
            formData.append('location', location);
            formData.append('contact_name', contactName);
            formData.append('contact_phone', contactPhone);

            if (photoInput.files.length > 0) {
                formData.append('photo', photoInput.files[0]);
            }

            try {
                const response = await fetchWithAuth(`${API_BASE_URL}/reports/`, {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    const data = await response.json();
                    alert(`Report submitted! ID: ${data.id}`);
                    window.location.href = './track_report.html';
                } else {
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
