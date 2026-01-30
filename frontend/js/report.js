// Run when the page is fully loaded
document.addEventListener('DOMContentLoaded', function () {

    checkLogin();

    setupPhotoPreview();
    setupReportSubmit();
});


// ---------------- PHOTO PREVIEW ----------------

function setupPhotoPreview() {
    const photoInput = document.getElementById('report-photo');
    if (!photoInput) return;

    photoInput.addEventListener('change', function () {
        updatePhotoPreview(photoInput);
    });
}

function updatePhotoPreview(photoInput) {
    const uploadContent = document.querySelector('.upload-content');

    if (photoInput.files.length > 0) {
        const fileName = photoInput.files[0].name;
        uploadContent.innerHTML =
            `<p style="color:green; font-weight:bold;">Selected: ${fileName}</p>`;
    } else {
        uploadContent.innerHTML = `
            <div class="upload-icon">📷</div>
            <p>Drag & drop photo here, or click to browse</p>
            <span>Supported formats: JPG, PNG (max 5MB)</span>
        `;
    }
}


// ---------------- SUBMIT REPORT ----------------

function setupReportSubmit() {
    const submitBtn = document.getElementById('submit-report-btn');
    if (!submitBtn) return;

    submitBtn.addEventListener('click', handleReportSubmit);
}

async function handleReportSubmit(event) {
    event.preventDefault();

    const formValues = getReportFormValues();

    if (!formValues) {
        alert('Please fill all required fields.');
        return;
    }

    const formData = buildReportFormData(formValues);

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
            alert('Failed to submit report. Please try again.');
        }

    } catch (error) {
        console.error(error);
        alert('Network error while submitting.');
    }
}


// ---------------- HELPERS ----------------

function getReportFormValues() {
    const condition = document.getElementById('report-condition').value;
    const description = document.getElementById('report-description').value;
    const location = document.getElementById('report-location').value;
    const contactName = document.getElementById('contact-name').value;
    const contactPhone = document.getElementById('contact-phone').value;
    const photoInput = document.getElementById('report-photo');

    if (!condition || !description || !location || !contactName || !contactPhone) {
        return null;
    }

    return {
        condition,
        description,
        location,
        contactName,
        contactPhone,
        photoInput
    };
}

function buildReportFormData(values) {
    const formData = new FormData();

    formData.append('condition', values.condition);
    formData.append('description', values.description);
    formData.append('location', values.location);
    formData.append('contact_name', values.contactName);
    formData.append('contact_phone', values.contactPhone);

    if (values.photoInput.files.length > 0) {
        formData.append('photo', values.photoInput.files[0]);
    }

    return formData;
}
