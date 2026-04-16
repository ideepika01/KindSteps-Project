// Diagnostic Logging

// Standard Helper
function getEl(id) {
    return document.getElementById(id);
}

// BACK BUTTON LOGIC
function handleBackToDashboard() {

    let role = localStorage.getItem("user_role");

    // Fallback detection if role is missing
    if (!role) {

        window.location.href = getRedirectPath("main.html");
        return;
    }

    if (role === "admin") {
        window.location.href = getRedirectPath("admin_control.html");
    } else if (role === "rescue_team") {
        window.location.href = getRedirectPath("rescue_team.html");
    } else {
        window.location.href = getRedirectPath("main.html");
    }
}

// UPDATE CASE LOGIC
async function updateCase(id) {

    const statusEl = getEl("status-dropdown");
    const reviewEl = getEl("field-review");
    const destEl = getEl("rescued-location");

    if (!statusEl || !reviewEl || !destEl) {

        return;
    }

    const status = statusEl.value;
    const review = reviewEl.value.trim();
    const dest = destEl.value.trim();

    if (status === "resolved" && (!review || !dest)) {
        alert("Field notes and rescue destination required for resolved cases.");
        return;
    }

    try {

        const res = await fetchWithAuth(`${API_BASE_URL}/reports/${id}`, {
            method: "PUT",
            body: {
                status,
                field_review: review,
                rescued_location: dest
            }
        });

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));

            alert(data.detail || "Update failed. Please check your permissions.");
            return;
        }

        alert("Case updated successfully.");
        location.reload();

    } catch (err) {

        alert("Could not connect to the server. Please check your internet connection and backend status.");
    }
}

// RENDER HELPERS
function safeText(id, val) {
    const el = getEl(id);
    if (el) el.innerText = val || "";
}

function renderReport(r) {

    safeText("case-title", r.condition);
    safeText("case-id", `ID: RSC-${String(r.id).padStart(6, "0")}`);
    safeText("case-date", `Reported: ${new Date(r.created_at).toLocaleString()}`);
    safeText("summary-text", r.description);
    safeText("reporter-name", r.contact_name);
    safeText("reporter-phone", r.contact_phone);
    safeText("location-text", r.location);

    const statusBadge = getEl("case-status-text");
    if (statusBadge) {
        statusBadge.innerHTML = `Status: <span class="badge ${r.status}">${r.status.replace("_", " ")}</span>`;
    }

    const img = getEl("case-image");
    if (img && r.photo_url) {
        let src = r.photo_url;
        if (!src.startsWith("data:image") && !src.startsWith("http")) {
            src = `data:image/jpeg;base64,${src}`;
        }
        img.src = src;
        img.style.display = "block";
    }

    // MAP Initialization with safety
    if (r.latitude && r.longitude && typeof L !== "undefined") {
        try {
            const mapContainer = getEl("view-map");
            if (mapContainer) {
                const map = L.map("view-map").setView([r.latitude, r.longitude], 15);
                L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                    attribution: "© OpenStreetMap"
                }).addTo(map);
                L.marker([r.latitude, r.longitude]).addTo(map).bindPopup(r.location).openPopup();
            }
        } catch (e) {

        }
    } else if (!r.latitude || !r.longitude) {
        const mapContainer = getEl("view-map");
        if (mapContainer) mapContainer.style.display = "none";
    }

    // Initialize inputs
    const drop = getEl("status-dropdown");
    if (drop) drop.value = r.status || "received";
    
    const reviewInput = getEl("field-review");
    if (reviewInput) reviewInput.value = r.field_review || "";
    
    const destInput = getEl("rescued-location");
    if (destInput) destInput.value = r.rescued_location || "";

    // Attach update listener
    const btn = getEl("update-btn");
    if (btn) {
        btn.onclick = () => updateCase(r.id);

    }
}

// LOAD DATA
async function loadReportData(id) {

    try {
        const res = await fetchWithAuth(`${API_BASE_URL}/reports/${id}`);
        if (!res.ok) {
            alert("Case not found or access denied.");
            return;
        }

        const report = await res.json();

        // Ensure role is in localStorage
        if (!localStorage.getItem("user_role")) {

            try {
                const userRes = await fetchWithAuth(`${API_BASE_URL}/auth/me`);
                if (userRes.ok) {
                    const user = await userRes.json();
                    localStorage.setItem("user_role", user.role);

                }
            } catch (e) {

            }
        }

        renderReport(report);
        
        if (typeof lucide !== "undefined") {
            lucide.createIcons();
        }

    } catch (err) {

        alert("Failed to load case details. Please check the backend connection.");
    }
}

// ENTRY POINT
document.addEventListener("DOMContentLoaded", () => {

    // Ensure checkLogin exists/runs
    if (typeof checkLogin === "function") {
        checkLogin();
    }

    const id = new URLSearchParams(location.search).get("id");
    if (!id) {

        location.href = getRedirectPath("main.html");
        return;
    }

    // Attach back button listener
    const backBtn = getEl("back-to-dash");
    if (backBtn) {
        backBtn.onclick = handleBackToDashboard;

    }

    loadReportData(id);
});