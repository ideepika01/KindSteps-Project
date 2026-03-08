// Diagnostic Logging
console.log("view_report.js loaded");

// Standard Helper
function getEl(id) {
    return document.getElementById(id);
}

// BACK BUTTON LOGIC
function handleBackToDashboard() {
    console.log("Back button clicked");
    let role = localStorage.getItem("user_role");
    console.log("Saved role:", role);
    
    // Fallback detection if role is missing
    if (!role) {
        console.log("Role missing, attempting fallback to main...");
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
    console.log("Attempting to update case:", id);
    
    const statusEl = getEl("status-dropdown");
    const reviewEl = getEl("field-review");
    const destEl = getEl("rescued-location");

    if (!statusEl || !reviewEl || !destEl) {
        console.error("Missing required form elements for update.");
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
        console.log("Sending PUT request to backend...");
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
            console.error("Update failed with status:", res.status, data);
            alert(data.detail || "Update failed. Please check your permissions.");
            return;
        }

        console.log("Update successful!");
        alert("Case updated successfully.");
        location.reload();

    } catch (err) {
        console.error("Server error during update:", err);
        alert("Could not connect to the server. Please check your internet connection and backend status.");
    }
}

// RENDER HELPERS
function safeText(id, val) {
    const el = getEl(id);
    if (el) el.innerText = val || "";
}

function renderReport(r) {
    console.log("Rendering report details...");
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
        img.src = r.photo_url;
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
            console.error("Map initialization failed:", e);
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
        console.log("Update button listener attached.");
    }
}

// LOAD DATA
async function loadReportData(id) {
    console.log("Fetching report data for ID:", id);
    try {
        const res = await fetchWithAuth(`${API_BASE_URL}/reports/${id}`);
        if (!res.ok) {
            alert("Case not found or access denied.");
            return;
        }

        const report = await res.json();
        console.log("Report data loaded:", report);

        // Ensure role is in localStorage
        if (!localStorage.getItem("user_role")) {
            console.log("Role missing from storage, fetching from /me...");
            try {
                const userRes = await fetchWithAuth(`${API_BASE_URL}/auth/me`);
                if (userRes.ok) {
                    const user = await userRes.json();
                    localStorage.setItem("user_role", user.role);
                    console.log("Recovered role:", user.role);
                }
            } catch (e) {
                console.warn("Could not recover user role.");
            }
        }

        renderReport(report);
        
        if (typeof lucide !== "undefined") {
            lucide.createIcons();
        }

    } catch (err) {
        console.error("Data load error:", err);
        alert("Failed to load case details. Please check the backend connection.");
    }
}

// ENTRY POINT
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM Content Loaded.");
    
    // Ensure checkLogin exists/runs
    if (typeof checkLogin === "function") {
        checkLogin();
    }

    const id = new URLSearchParams(location.search).get("id");
    if (!id) {
        console.warn("No ID found in URL, redirecting to main.");
        location.href = getRedirectPath("main.html");
        return;
    }

    // Attach back button listener
    const backBtn = getEl("back-to-dash");
    if (backBtn) {
        backBtn.onclick = handleBackToDashboard;
        console.log("Back button listener attached.");
    }

    loadReportData(id);
});