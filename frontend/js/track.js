document.addEventListener("DOMContentLoaded", start);

function start() {
    const token = checkLogin();
    if (!token) return;

    const id = new URLSearchParams(window.location.search).get("id");

    if (!id) {
        window.location.href = "./my_reports.html";
        return;
    }

    const input = document.getElementById("tracking-id-input");
    const button = document.getElementById("track-btn");

    if (input) {
        input.value = id;
    }

    if (button) {
        button.addEventListener("click", trackReport);
    }

    if (id) {
        trackReport();
    }
}

// ================= TRACK REPORT =================

async function trackReport() {
    const id = document
        .getElementById("tracking-id-input")
        .value.trim();

    if (!id) {
        alert("Enter tracking ID");
        return;
    }

    const statusMessage = document.getElementById("status-message");
    const progress = document.getElementById("progress-container");
    const details = document.getElementById("detailed-info");

    statusMessage.textContent = "Searching...";
    statusMessage.style.color = "white";
    progress.style.display = "none";
    details.style.display = "none";

    try {
        const res = await fetchWithAuth(
            `${API_BASE_URL}/reports/track/${id}`
        );

        if (res.status === 403) {
            statusMessage.textContent = "Access denied";
            statusMessage.style.color = "orange";
            return;
        }

        if (!res.ok) {
            statusMessage.textContent = "Report not found";
            statusMessage.style.color = "red";
            return;
        }

        const report = await res.json();
        updateUI(report);

    } catch {
        statusMessage.textContent =
            "Server error. Try again later.";
        statusMessage.style.color = "red";
    }
}

// ================= UPDATE UI =================

function updateUI(report) {
    const statusMessage = document.getElementById("status-message");
    const statusBadge = document.getElementById("status-badge");
    const progress = document.getElementById("progress-container");
    const details = document.getElementById("detailed-info");

    progress.style.display = "flex";
    details.style.display = "grid";

    const status = (report.status || "").toLowerCase();

    // ===== Status Badge & Message =====
    statusBadge.textContent = status.replace("_", " ");
    statusBadge.style.background = status === "resolved" ? "#dcfce7" : "#eff6ff";
    statusBadge.style.color = status === "resolved" ? "#166534" : "#2563eb";

    // ===== Progress Bar =====

    const stepReceived = document.getElementById("status-received");
    const stepProgress = document.getElementById("status-inprogress");
    const stepResolved = document.getElementById("status-resolved");

    const steps = [stepReceived, stepProgress, stepResolved];

    steps.forEach(step => {
        step.classList.remove("highlight");
        step.style.opacity = "0.3";
    });

    if (status === "received") {
        highlight(stepReceived);
    }

    if (status === "in_progress" || status === "active") {
        highlight(stepReceived);
        highlight(stepProgress);
    }

    if (status === "resolved") {
        highlight(stepReceived);
        highlight(stepProgress);
        highlight(stepResolved);
    }

    // ===== Status Message =====

    const statusLabels = {
        received: "Your report has been received. We're currently reviewing it with care.",
        in_progress: "Our kind volunteers are on their way to help.",
        active: "Our kind volunteers are on their way to help.",
        resolved: "The rescue was successful, and they are now in safe hands."
    };

    statusMessage.textContent = statusLabels[status] || "Current Status: " + status;
    const statusLabelEl = document.getElementById("info-status-label");
    if (statusLabelEl) {
        statusLabelEl.textContent = status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ");
    }

    // ===== Team Info =====

    document.getElementById("info-team-name").textContent =
        report.assigned_team_name || "Assigning Your Team Soon";

    const phoneEl = document.getElementById("info-team-phone");
    phoneEl.textContent = report.assigned_team_phone
        ? "You can reach them at: " + report.assigned_team_phone
        : "Contact info will be shared soon";

    // ===== Last Update =====

    const updateLabel = status === "resolved" ? "Completed on" : "Last updated on";
    document.getElementById("info-updated").textContent =
        updateLabel + ": " + new Date(report.updated_at).toLocaleDateString() + " at " + new Date(report.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // ===== Field Review =====

    const reviewBox = document.getElementById("field-review-container");
    const reviewText = document.getElementById("info-field-review");

    if (report.field_review) {
        reviewBox.style.display = "flex";
        reviewText.textContent = report.field_review;
    } else {
        reviewBox.style.display = "none";
    }

    // ===== Rescue Location =====

    const locationText = document.getElementById("info-rescue-location");
    if (report.rescued_location) {
        locationText.textContent = "Safe at " + report.rescued_location;
    } else {
        locationText.textContent = "Coordinating Rescue Location";
    }

    // Initialize Lucide icons
    if (window.lucide) {
        lucide.createIcons();
    }
}

// ================= SMALL HELPER =================

function highlight(element) {
    element.style.opacity = "1";
    element.style.fontWeight = "bold";
}
