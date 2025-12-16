/*
 * REPORT SUBMISSION LOGIC
 * This file handles the form where users report a vulnerable individual.
 * It grabs data from the inputs, creates a package (FormData), and uploads it.
 */

document.addEventListener('DOMContentLoaded', () => {

    // 1. CHECK LOGIN STATUS
    // Before letting them submit, make sure they are logged in!
    // checkAuth() comes from 'utils.js'
    const token = checkAuth();

    // 2. SUBMIT BUTTON HANDLING
    const submitBtn = document.getElementById('submit-report-btn');

    if (submitBtn) {
        submitBtn.addEventListener('click', async (event) => {
            // Stop the form from reloading the page
            event.preventDefault();

            // --- STEP A: Get Data from HTML Inputs ---
            const condition = document.getElementById('report-condition').value;
            const description = document.getElementById('report-description').value;
            const location = document.getElementById('report-location').value;
            const contactName = document.getElementById('contact-name').value;
            const contactPhone = document.getElementById('contact-phone').value;
            const fileInput = document.getElementById('report-photo');

            // --- STEP B: Validation ---
            // Check if any required text field is empty
            if (!condition || !description || !location || !contactName || !contactPhone) {
                alert("Please fill all required fields.");
                return; // Stop right here
            }

            // --- STEP C: Prepare Data for Sending ---
            // We use 'FormData' because we might be uploading a file (image).
            // Normal JSON cannot handle file uploads easily.
            const formData = new FormData();
            formData.append('condition', condition);
            formData.append('description', description);
            formData.append('location', location);
            formData.append('contact_name', contactName);
            formData.append('contact_phone', contactPhone);

            // Add the photo if the user selected one
            if (fileInput.files.length > 0) {
                formData.append('photo', fileInput.files[0]);
            }

            // --- STEP D: Send to Backend ---
            try {
                const response = await fetch(`${API_BASE_URL}/reports/`, {
                    method: 'POST',
                    headers: {
                        // We need the token to prove we are logged in
                        'Authorization': `Bearer ${token}`
                        // NOTE: We DO NOT set 'Content-Type' here. 
                        // The browser automatically sets it for FormData (to handle the file).
                    },
                    body: formData // The package we created above
                });

                if (response.ok) {
                    // SUCCESS
                    const data = await response.json();
                    alert(`Report submitted successfully! Report ID: ${data.id}`);

                    // Sending them to the tracking page to see their new report
                    window.location.href = './track_report.html';
                } else {
                    // FAILURE
                    const error = await response.json();
                    console.error('Submission error:', error);
                    alert("Failed to submit report. Please try again.");
                }

            } catch (error) {
                // NETWORK ERROR
                console.error("Error submitting report:", error);
                alert("An error occurred while submitting the report.");
            }
        });
    }
});
