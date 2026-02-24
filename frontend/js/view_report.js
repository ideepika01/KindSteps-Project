// Initialize the case details view
document.addEventListener("DOMContentLoaded", () => {
    checkLogin(); // Ensure user is authenticated
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) return window.location.href = "./main.html";
    setupBackLink();
    loadCaseDetails(id);
});

// --- NAVIGATION ---

// Handle back button behavior
function setupBackLink() {
    const btn = document.getElementById("back-to-dash");
    if (!btn) return;
    btn.onclick = () => { window.history.back(); };
}

// --- DATA LOADING ---

// Fetch case details from the API
async function loadCaseDetails(id) {
    try {
        const res = await fetchWithAuth(`${API_BASE_URL}/reports/${id}`);
        if (!res.ok) return alert("Case not found.");
        const report = await res.json();
        renderCaseDetails(report);
        setupActionControls(report);
    } catch (err) { alert("Failed to connect to the server."); }
}

// --- UI RENDERING ---

// Populate the page with report data
function renderCaseDetails(r) {
    // Fill basic text info
    setText("case-title", r.condition);
    setText("case-id", `ID: RSC-${String(r.id).padStart(6, "0")}`);
    setText("case-date", `Reported: ${new Date(r.created_at).toLocaleString()}`);
    setText("summary-text", r.description);
    setText("reporter-name", r.contact_name);
    setText("reporter-phone", r.contact_phone);
    setText("location-text", r.location);

    // Status display
    const statusEl = document.getElementById("case-status-text");
    if (statusEl) {
        statusEl.innerHTML = `Status: <span class="badge ${r.status}">${r.status.replace("_", " ")}</span>`;
    }

    // Handle case image
    const img = document.getElementById("case-image");
    if (img && r.photo_url) {
        img.src = r.photo_url;
        img.style.display = "block";
    }

    // Initialize Map for location visualization
    if (r.latitude && r.longitude) {
        const map = L.map("view-map").setView([r.latitude, r.longitude], 15);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '© OpenStreetMap'
        }).addTo(map);
        L.marker([r.latitude, r.longitude]).addTo(map).bindPopup(`<b>Incident Location</b><br>${r.location}`).openPopup();
    } else {
        const mapDiv = document.getElementById("view-map");
        if (mapDiv) mapDiv.style.display = "none";
    }

    if (window.lucide) lucide.createIcons();
}

// --- CASE ACTIONS ---

// Prepare the update controls for staff members
function setupActionControls(r) {
    const drop = document.getElementById("status-dropdown");
    const btn = document.getElementById("update-btn");
    if (!drop || !btn) return;

    drop.value = r.status || "received";
    document.getElementById("field-review").value = r.field_review || "";
    document.getElementById("rescued-location").value = r.rescued_location || "";

    btn.onclick = async () => {
        const status = drop.value;
        const review = document.getElementById("field-review").value.trim();
        const destination = document.getElementById("rescued-location").value.trim();

        // Validation for resolving a case
        if (status === "resolved" && (!review || !destination)) {
            return alert("Please provide field notes and a rescue destination to resolve this case.");
        }

        try {
            const res = await fetchWithAuth(`${API_BASE_URL}/reports/${r.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status, field_review: review, rescued_location: destination })
            });
            if (res.ok) {
                alert("Case updated successfully.");
                location.reload();
            } else alert("Update failed.");
        } catch (err) { alert("Server error."); }
    };
}

// --- HELPERS ---
function setText(id, val) { const el = document.getElementById(id); if (el) el.innerText = val; }