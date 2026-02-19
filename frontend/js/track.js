document.addEventListener("DOMContentLoaded", init);

// ================= INIT =================

function init() {
    const token = checkLogin();
    if (!token) return;

    const reportId = new URLSearchParams(window.location.search).get("id");

    if (!reportId) {
        window.location.href = "./my_reports.html";
        return;
    }

    document.getElementById("tracking-id-input").value = reportId;
    document.getElementById("track-btn").addEventListener("click", trackReport);

    trackReport();
}


// ================= TRACK REPORT =================

async function trackReport() {

    const idInput = document.getElementById("tracking-id-input");
    const statusMsg = document.getElementById("status-message");
    const progress = document.getElementById("progress-container");
    const details = document.getElementById("detailed-info");

    const id = idInput.value.trim();

    if (!id) {
        alert("Enter tracking ID");
        return;
    }

    // Reset UI
    statusMsg.textContent = "Searching...";
    statusMsg.style.color = "white";
    progress.style.display = "none";
    details.style.display = "none";

    try {

        const res = await fetchWithAuth(`${API_BASE_URL}/reports/track/${id}`);

        if (res.status === 403) {
            showError("Access denied", "orange");
            return;
        }

        if (!res.ok) {
            showError("Report not found", "red");
            return;
        }

        const report = await res.json();

        updateUI(report);

    } catch {
        showError("Server error. Try again later.", "red");
    }
}


// ================= UPDATE UI =================

function updateUI(report) {

    const status = (report.status || "received").toLowerCase();

    showBasicInfo(status, report);
    updateProgress(status);
    updateTeam(report);
    updateDates(status, report);
    updateExtra(report);

    if (window.lucide) lucide.createIcons();
}


// ================= BASIC INFO =================

function showBasicInfo(status, report) {

    const statusMsg = document.getElementById("status-message");
    const badge = document.getElementById("status-badge");

    document.getElementById("progress-container").style.display = "flex";
    document.getElementById("detailed-info").style.display = "grid";

    badge.textContent = status.replace("_", " ");

    if (status === "resolved") {
        badge.style.background = "#dcfce7";
        badge.style.color = "#166534";
    } else {
        badge.style.background = "#eff6ff";
        badge.style.color = "#2563eb";
    }

    const messages = {
        received: "Your report has been received.",
        in_progress: "Rescue team is on the way.",
        active: "Rescue team is on the way.",
        resolved: "Rescue completed successfully."
    };

    statusMsg.textContent = messages[status] || status;
}


// ================= PROGRESS =================

function updateProgress(status) {

    const received = document.getElementById("status-received");
    const progress = document.getElementById("status-inprogress");
    const resolved = document.getElementById("status-resolved");

    resetStep(received);
    resetStep(progress);
    resetStep(resolved);

    highlight(received);

    if (status === "in_progress" || status === "active" || status === "resolved") {
        highlight(progress);
    }

    if (status === "resolved") {
        highlight(highlight(resolved));
    }
}

function resetStep(step) {
    step.style.opacity = "0.3";
}

function highlight(step) {
    step.style.opacity = "1";
    step.style.fontWeight = "bold";
}


// ================= TEAM =================

function updateTeam(report) {

    document.getElementById("info-team-name").textContent =
        report.assigned_team_name || "Assigning Team Soon";

    document.getElementById("info-team-phone").textContent =
        report.assigned_team_phone
            ? "Phone: " + report.assigned_team_phone
            : "Phone not available";
}


// ================= DATE =================

function updateDates(status, report) {

    const date = new Date(report.updated_at);

    const label =
        status === "resolved"
            ? "Completed on: "
            : "Last updated on: ";

    document.getElementById("info-updated").textContent =
        label + date.toLocaleDateString() + " " +
        date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}


// ================= EXTRA =================

function updateExtra(report) {

    const reviewBox = document.getElementById("field-review-container");
    const reviewText = document.getElementById("info-field-review");

    if (report.field_review) {
        reviewBox.style.display = "flex";
        reviewText.textContent = report.field_review;
    } else {
        reviewBox.style.display = "none";
    }

    document.getElementById("info-rescue-location").textContent =
        report.rescued_location
            ? "Safe at " + report.rescued_location
            : "Rescue location pending";
}


// ================= ERROR =================

function showError(message, color) {

    const statusMsg = document.getElementById("status-message");

    statusMsg.textContent = message;
    statusMsg.style.color = color;
}
