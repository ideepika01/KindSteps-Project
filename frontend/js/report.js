document.addEventListener("DOMContentLoaded", () => {
    checkLogin();
    initPhotoPreview();
    initForm();
    initMap();
});


// ---------------- PHOTO PREVIEW ----------------

function initPhotoPreview() {
    const input = document.getElementById("report-photo");
    const display = document.querySelector(".upload-content");
    const aiContainer = document.getElementById("ai-scan-container");

    if (!input || !display) return;

    input.addEventListener("change", () => {
        const file = input.files[0];
        display.innerHTML = file
            ? `<p>Selected: <strong>${file.name}</strong></p>`
            : `<p>Drag & drop or click to upload</p>`;

        if (file && aiContainer) {
            aiContainer.style.display = "block";
        } else if (aiContainer) {
            aiContainer.style.display = "none";
        }
    });

    initAIScan();
}


// ---------------- AI SCAN ----------------

function initAIScan() {
    const btn = document.getElementById("ai-scan-btn");
    if (!btn) return;

    btn.addEventListener("click", async () => {
        const photo = document.getElementById("report-photo")?.files[0];
        if (!photo) return alert("Please select a photo first.");

        const status = document.getElementById("ai-status");
        const descriptionField = document.getElementById("report-description");

        btn.disabled = true;
        if (status) status.style.display = "block";

        const formData = new FormData();
        formData.append("photo", photo);

        try {
            const res = await fetchWithAuth(`${API_BASE_URL}/reports/ai-analyze`, {
                method: "POST",
                body: formData
            });

            if (res.ok) {
                const data = await res.json();

                // Populate description
                if (data && data.description) {
                    descriptionField.value = data.description;
                }

                // Populate Compassion Card
                const card = document.getElementById("ai-compassion-card");
                const list = document.getElementById("ai-advice-list");
                if (card && list && data.advice) {
                    list.innerHTML = data.advice.map(item => `<li>${item}</li>`).join("");
                    card.style.display = "block";
                }
            } else {
                alert("AI analysis failed.");
            }
        } catch (err) {
            console.error(err);
            alert("Error connecting to AI service.");
        } finally {
            btn.disabled = false;
            if (status) status.style.display = "none";
        }
    });
}


// ---------------- FORM SUBMIT ----------------

function initForm() {
    const btn = document.getElementById("submit-report-btn");
    if (!btn) return;

    btn.addEventListener("click", submitReport);
}

async function submitReport(e) {
    e.preventDefault();

    const condition = getVal("report-condition");
    const description = getVal("report-description");
    const location = getVal("report-location");
    const location_details = getVal("location_details");
    const contact_name = getVal("contact-name");
    const contact_phone = getVal("contact-phone");
    const latitude = getVal("report-lat");
    const longitude = getVal("report-lng");

    if (!condition || !location || !contact_name) {
        return alert("Condition, location, and name are required.");
    }

    const formData = new FormData();
    [
        ["condition", condition],
        ["description", description],
        ["location", location],
        ["location_details", location_details],
        ["contact_name", contact_name],
        ["contact_phone", contact_phone],
        ["latitude", latitude],
        ["longitude", longitude]
    ].forEach(([key, value]) => {
        if (value) formData.append(key, value);
    });

    const photo = document.getElementById("report-photo")?.files[0];
    if (photo) formData.append("photo", photo);

    try {
        const res = await fetchWithAuth(`${API_BASE_URL}/reports/`, {
            method: "POST",
            body: formData
        });

        if (res.ok) {
            window.location.href = "./my_reports.html";
        } else {
            const data = await safeJSON(res);
            alert(data?.detail || "Submission failed.");
        }

    } catch {
        alert("Server error.");
    }
}

function getVal(id) {
    return document.getElementById(id)?.value.trim() || "";
}

async function safeJSON(res) {
    try { return await res.json(); }
    catch { return null; }
}


// ---------------- MAP ----------------

function initMap() {
    const mapDiv = document.getElementById("report-map");
    if (!mapDiv) return;

    let marker;

    const map = L.map("report-map").setView([12.9716, 77.5946], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap"
    }).addTo(map);

    map.on("click", e => setMarker(e.latlng.lat, e.latlng.lng));

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            const { latitude, longitude } = pos.coords;
            map.setView([latitude, longitude], 15);
            setMarker(latitude, longitude);
        });
    }

    function setMarker(lat, lng) {
        if (marker) {
            marker.setLatLng([lat, lng]);
        } else {
            marker = L.marker([lat, lng], { draggable: true }).addTo(map);
            marker.on("dragend", () => {
                const pos = marker.getLatLng();
                saveCoords(pos.lat, pos.lng);
            });
        }
        saveCoords(lat, lng);
    }
}

function saveCoords(lat, lng) {
    const latInput = document.getElementById("report-lat");
    const lngInput = document.getElementById("report-lng");
    if (latInput) latInput.value = lat;
    if (lngInput) lngInput.value = lng;
}
