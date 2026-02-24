// Initialize the report tracking view
document.addEventListener("DOMContentLoaded", () => {
    checkLogin(); // Ensure user is authenticated
    const id = new URLSearchParams(window.location.search).get("id");

    // Setup UI listeners
    const input = document.getElementById("tracking-id-input");
    const btn = document.getElementById("track-btn");

    if (id) {
        input.value = id;
        loadTrackingInfo(id);
    }

    btn.onclick = () => {
        const val = input.value.trim();
        if (val) loadTrackingInfo(val);
        else alert("Please enter a Tracking ID");
    };
});

// --- DATA FETCHING ---

// Fetch the tracking status from the API
async function loadTrackingInfo(id) {
    const msg = document.getElementById("status-message");
    const detailedInfo = document.getElementById("detailed-info");
    const progressContainer = document.getElementById("progress-container");

    msg.innerText = "🔍 Searching for report RSC-" + String(id).padStart(6, "0") + "...";
    detailedInfo.style.display = "none";
    progressContainer.style.display = "none";

    try {
        const res = await fetchWithAuth(`${API_BASE_URL}/reports/track/${id}`);
        if (!res.ok) {
            msg.innerText = "❌ Report not found. Please check the ID.";
            msg.style.color = "#ef4444";
            return;
        }

        const report = await res.json();
        renderTrackingDashboard(report);
    } catch (err) {
        msg.innerText = "⚠️ Network error. Try again later.";
    }
}

// --- UI RENDERING ---

// Update the dashboard with the latest report data
function renderTrackingDashboard(r) {
    const status = r.status || "received";
    const msg = document.getElementById("status-message");
    const badge = document.getElementById("status-badge");
    const detailedInfo = document.getElementById("detailed-info");
    const progressContainer = document.getElementById("progress-container");

    // 1. Show Containers
    detailedInfo.style.display = "grid";
    progressContainer.style.display = "flex";
    msg.style.color = "inherit";

    // 2. Update Header & Progress Message
    badge.innerText = status.replace("_", " ").toUpperCase();
    badge.className = `status-badge ${status}`;
    msg.innerText = getFriendlyMessage(status);

    // 3. Update Team Info
    const teamName = (r.assigned_team_name && r.assigned_team_name !== "Unassigned")
        ? r.assigned_team_name
        : "Volunteer Team Assigning...";

    setText("info-team-name", teamName);
    setText("info-team-phone", r.assigned_team_phone && r.assigned_team_phone !== "N/A"
        ? `📞 ${r.assigned_team_phone}`
        : "Contact pending...");

    // 4. Update Status Updates
    setText("info-status-label", getStatusTitle(status));
    setText("info-updated", `Last update: ${new Date(r.updated_at).toLocaleString()}`);

    // 5. Update Rescue Location & Notes
    setText("info-rescue-location", r.rescued_location || "Awaiting rescue completion...");

    const notesBox = document.getElementById("field-review-container");
    if (r.field_review) {
        notesBox.style.display = "flex";
        setText("info-field-review", r.field_review);
    } else {
        notesBox.style.display = "none";
    }

    // 6. Update Progress Stepper
    updateProgressSteps(status);

    if (window.lucide) lucide.createIcons();
}

// --- UI HELPERS ---

function updateProgressSteps(status) {
    const steps = ["received", "in_progress", "resolved"];
    // Map 'active' to the second step (index 1) which is 'In Progress'
    const currentIdx = status === "active" ? 1 : steps.indexOf(status);

    // Update icons/labels
    steps.forEach((step, idx) => {
        const id = step === "in_progress" ? "inprogress" : step;
        const el = document.getElementById(`status-${id}`);
        if (el) {
            if (idx <= currentIdx) el.classList.add("active");
            else el.classList.remove("active");
        }
    });

    // Update connecting lines
    const lines = document.querySelectorAll(".progress-line");
    lines.forEach((line, idx) => {
        // Line 0 connects step 0 and 1. Line 1 connects step 1 and 2.
        if (idx < currentIdx) line.classList.add("active");
        else line.classList.remove("active");
    });
}

function getFriendlyMessage(s) {
    const msgs = {
        received: "We've received your report and are verifying the details.",
        active: "A rescue team has been alerted and is reviewing the case.",
        in_progress: "Heroes are currently on their way to the location!",
        resolved: "Success! The individual has been safely rescued and cared for."
    };
    return msgs[s] || "Tracking your report progress...";
}

function getStatusTitle(s) {
    const titles = {
        received: "Ticket Logged",
        active: "Team Alerted",
        in_progress: "Rescue in Action",
        resolved: "Mission Accomplished"
    };
    return titles[s] || "Processing";
}

function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.innerText = val;
}