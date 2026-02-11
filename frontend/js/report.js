// This file manages the report form, including photo previews and map pins.

document.addEventListener('DOMContentLoaded', () => {
    checkLogin();           // Safety first: make sure the user is signed in

    // Getting everything ready for the user
    setupPhotoPreview();
    setupSubmission();
    initLocationMap();
});

// Showing the user which photo they've selected
function setupPhotoPreview() {
    const input = document.getElementById('report-photo');
    const displayArea = document.querySelector('.upload-content');
    if (!input || !displayArea) return;

    input.addEventListener('change', () => {
        if (input.files.length > 0) {
            const fileName = input.files[0].name;
            displayArea.innerHTML = `<p class="success-text">Nice! You selected: <strong>${fileName}</strong></p>`;
        } else {
            // If they clear the selection, show the original tip
            displayArea.innerHTML = `<p>Drag & drop, or click to browse</p>`;
        }
    });
}

// Sending the finalized report to the database
function setupSubmission() {
    const btn = document.getElementById('submit-report-btn');
    if (!btn) return;

    btn.addEventListener('click', async (e) => {
        e.preventDefault(); // Stop the page from refreshing

        // Collecting all the details from the form
        const formData = new FormData();
        const fields = {
            condition: document.getElementById('report-condition').value,
            description: document.getElementById('report-description').value,
            location: document.getElementById('report-location').value,
            contact_name: document.getElementById('contact-name').value,
            contact_phone: document.getElementById('contact-phone').value,
            latitude: document.getElementById('report-lat').value,
            longitude: document.getElementById('report-lng').value
        };

        // Making sure the most important boxes are checked
        if (!fields.condition || !fields.location || !fields.contact_name) {
            return alert('Wait! We need at least the condition, location, and your name to help.');
        }

        // Tucking the text fields into our request package
        for (const key in fields) {
            if (fields[key]) formData.append(key, fields[key]);
        }

        // Adding the photo if the user provided one
        const photoFile = document.getElementById('report-photo').files[0];
        if (photoFile) formData.append('photo', photoFile);

        try {
            // Sending the report off to our team
            const res = await fetchWithAuth(`${API_BASE_URL}/reports/`, {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                window.location.href = './my_reports.html'; // Heading over to the dashboard to see progress
            } else {
                const data = await res.json();
                const errorMsg = data.detail || data.error || 'Something went wrong. Please try again.';
                alert(`Submission Failed: ${errorMsg}`);
            }
        } catch (err) {
            alert('We lost connection with the server. Is it awake?');
        }
    });
}

// Setting up the interactive map so users can point to where help is needed
let mapObj;
let pin;

function initLocationMap() {
    const mapDiv = document.getElementById('report-map');
    if (!mapDiv) return;

    // We start the map centered on Bangalore by default
    mapObj = L.map('report-map').setView([12.9716, 77.5946], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(mapObj);

    // When the user clicks the map, we place a pin right there
    mapObj.on('click', (e) => {
        updatePinLocation(e.latlng.lat, e.latlng.lng);
    });

    // If the browser allows it, we'll try to find where the user is currently standing
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            const { latitude, longitude } = pos.coords;
            mapObj.setView([latitude, longitude], 15);
            updatePinLocation(latitude, longitude);
        });
    }
}

// Putting the pin on the map and saving the coordinates
function updatePinLocation(lat, lng) {
    if (pin) {
        pin.setLatLng([lat, lng]); // Move the existing pin
    } else {
        pin = L.marker([lat, lng], { draggable: true }).addTo(mapObj); // Create a brand new pin
        pin.on('dragend', () => {
            const pos = pin.getLatLng();
            saveCoords(pos.lat, pos.lng);
        });
    }
    saveCoords(lat, lng);
}

// Storing the coordinates in hidden boxes so our form can send them
function saveCoords(lat, lng) {
    document.getElementById('report-lat').value = lat;
    document.getElementById('report-lng').value = lng;
}
