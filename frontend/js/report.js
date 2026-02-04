// Run when the page is fully loaded
document.addEventListener('DOMContentLoaded', function () {

    checkLogin();

    setupPhotoPreview();
    setupReportSubmit();
    initReportMap();
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

    const lat = document.getElementById('report-lat').value;
    const lng = document.getElementById('report-lng').value;

    if (!condition || !description || !location || !contactName || !contactPhone) {
        return null;
    }

    return {
        condition,
        description,
        location,
        contactName,
        contactPhone,
        photoInput,
        lat,
        lng
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

    if (values.lat && values.lng) {
        formData.append('latitude', values.lat);
        formData.append('longitude', values.lng);
    }

    return formData;
}


// ---------------- MAP LOGIC ----------------

let reportMap;
let reportMarker;

function initReportMap() {
    const mapElement = document.getElementById('report-map');
    if (!mapElement) return;

    // Default to a central location (ensure it's valid)
    reportMap = L.map('report-map').setView([12.9716, 77.5946], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(reportMap);

    // Click to pin
    reportMap.on('click', function (e) {
        const { lat, lng } = e.latlng;
        setReportMarker(lat, lng);
    });

    // Try GeoLocation
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            const { latitude, longitude } = pos.coords;
            reportMap.setView([latitude, longitude], 15);
            setReportMarker(latitude, longitude);
        });
    }
}

function setReportMarker(lat, lng) {
    if (reportMarker) {
        reportMarker.setLatLng([lat, lng]);
    } else {
        reportMarker = L.marker([lat, lng], { draggable: true }).addTo(reportMap);
        reportMarker.on('dragend', function (event) {
            const marker = event.target;
            const position = marker.getLatLng();
            document.getElementById('report-lat').value = position.lat;
            document.getElementById('report-lng').value = position.lng;
        });
    }

    document.getElementById('report-lat').value = lat;
    document.getElementById('report-lng').value = lng;
}
