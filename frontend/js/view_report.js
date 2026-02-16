document.addEventListener("DOMContentLoaded", start);

async function start() {
    checkLogin();

    const reportId = new URLSearchParams(window.location.search).get("id");

    if (!reportId) {
        alert("No Report ID found.");
        window.location.href = "./main.html";
        return;
    }

    setupBackButton();
    loadReport(reportId);
}


// ================= BACK BUTTON =================

function setupBackButton() {
    const backBtn = document.getElementById("back-to-dash");
    if (!backBtn) return;

    backBtn.onclick = async (e) => {
        e.preventDefault();

        try {
            const res = await fetchWithAuth(`${API_BASE_URL}/auth/me`);
            if (!res.ok) {
                window.location.href = "./main.html";
                return;
            }

            const user = await res.json();

            if (user.role === "admin") {
                window.location.href = "./admin_control.html";
                return;
            }

            if (user.role === "rescue_team") {
                window.location.href = "./rescue_team.html";
                return;
            }

            window.location.href = "./my_reports.html";

        } catch {
            window.location.href = "./main.html";
        }
    };
}


// ================= LOAD REPORT =================

async function loadReport(reportId) {
    try {
        const res = await fetchWithAuth(`${API_BASE_URL}/reports/${reportId}`);

        if (!res.ok) {
            alert("Report not found.");
            return;
        }

        const report = await res.json();
        displayReport(report);
        setupStatusUpdate(report.id, report.status);

    } catch (error) {
        console.error("Load error:", error);
    }
}


// ================= DISPLAY REPORT =================

function displayReport(report) {

    // Basic info
    document.getElementById("case-title").innerText = report.condition;
    document.getElementById("case-id").innerText =
        "ID: RSC-" + String(report.id).padStart(6, "0");

    document.getElementById("case-date").innerText =
        "Reported: " + new Date(report.created_at).toLocaleString();

    document.getElementById("summary-text").innerText =
        report.description;

    document.getElementById("reporter-name").innerText =
        report.contact_name;

    document.getElementById("reporter-phone").innerText =
        report.contact_phone;


    // Location
    const locationEl = document.getElementById("location-text");
    locationEl.innerText = report.location;

    if (report.latitude && report.longitude) {
        locationEl.innerHTML +=
            `<br>
            <a href="https://www.google.com/maps?q=${report.latitude},${report.longitude}" target="_blank">
                View on Google Maps
            </a>`;
    }


    // Status
    const status = report.status || "received";
    document.getElementById("case-status-text").innerHTML =
        `Status: <span class="tag ${status}">${status}</span>`;


    // Image
    const img = document.getElementById("case-image");

    if (!report.photo_url) {
        img.style.display = "none";
    } else {
        const fullUrl =
            report.photo_url.startsWith("http") ||
                report.photo_url.startsWith("data:")
                ? report.photo_url
                : API_BASE_URL + "/" + report.photo_url;

        img.src = fullUrl;
        img.style.display = "block";
    }


    // Field review
    const reviewInput = document.getElementById("field-review");
    if (reviewInput && report.field_review) {
        reviewInput.value = report.field_review;
    }

    // Rescued location
    const rescuedInput = document.getElementById("rescued-location");
    if (rescuedInput && report.rescued_location) {
        rescuedInput.value = report.rescued_location;
    }

    // Refresh icons if using Lucide
    if (window.lucide) {
        lucide.createIcons();
    }

    renderTimeline(report);
}


function renderTimeline(report) {
    const status = report.status || "received";
    const steps = ["received", "in_progress", "active", "resolved"];
    const currentIdx = steps.indexOf(status);

    steps.forEach((step, idx) => {
        const stepEl = document.getElementById(`step-${step}`);
        if (stepEl && idx <= currentIdx) {
            stepEl.classList.add("active");

            // Add time for the received step
            if (step === "received") {
                document.getElementById("time-received").innerText =
                    new Date(report.created_at).toLocaleTimeString();
            }

            // Mocking update times for other steps for dry run visibility
            if (idx > 0 && idx <= currentIdx) {
                const timeStr = new Date(report.updated_at).toLocaleTimeString();
                const timeId = `time-${step === 'in_progress' ? 'dispatched' : step === 'active' ? 'active' : 'resolved'}`;
                const timeEl = document.getElementById(timeId);
                if (timeEl) timeEl.innerText = timeStr;
            }
        }
    });
}


// ================= UPDATE STATUS =================

function setupStatusUpdate(reportId, currentStatus) {
    const dropdown = document.getElementById("status-dropdown");
    const button = document.getElementById("update-btn");

    if (!dropdown || !button) return;

    dropdown.value = currentStatus;

    button.onclick = () => {
        const review =
            document.getElementById("field-review").value;

        const rescuedLocation =
            document.getElementById("rescued-location").value;

        updateReport(reportId, dropdown.value, review, rescuedLocation);
    };
}


async function updateReport(reportId, status, review, rescuedLocation) {
    try {
        const res = await fetchWithAuth(
            `${API_BASE_URL}/reports/${reportId}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    status: status,
                    field_review: review,
                    rescued_location: rescuedLocation
                })
            }
        );

        if (!res.ok) {
            alert("Update failed.");
            return;
        }

        alert("Case updated.");
        location.reload();

    } catch (error) {
        console.error("Update error:", error);
    }
}
