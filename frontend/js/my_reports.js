// ================= INIT =================

document.addEventListener("DOMContentLoaded", init);

function init() {
    checkLogin();
    loadReports();
}


// ================= API =================

async function loadReports() {
    const container = document.getElementById("my-reports-grid");
    if (!container) return;

    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/reports/`);

        if (!response.ok) {
            showError(container, "Failed to load reports");
            return;
        }

        const reports = await response.json();
        displayReports(container, reports);

    } catch {
        showError(container, "Network error");
    }
}


// ================= DISPLAY =================

function displayReports(container, reports) {

    if (!reports.length) {
        container.innerHTML = "<p>No reports submitted yet.</p>";
        return;
    }

    container.innerHTML = "";

    const sorted = reports.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    sorted.forEach((report, index) => {
        container.appendChild(createCard(report, index));
    });

    if (window.lucide) lucide.createIcons();
}


// ================= CARD =================

function createCard(report, index) {

    const status = getStatus(report.status);

    const card = document.createElement("article");

    card.className = "case-card";

    card.innerHTML = `
        <div class="card-header">
            <span>RSC-${String(report.id).padStart(6, "0")}</span>
            <span>Priority: ${report.priority || "Medium"}</span>
        </div>

        <h3>${report.condition || "Incident Report"}</h3>

        <p>${report.location || "Unknown Location"}</p>

        <p>${formatDate(report.created_at)}</p>

        <div class="status-box ${report.status}">
            <i data-lucide="${status.icon}"></i>
            ${status.text}
        </div>

        <a href="./track_report.html?id=${report.id}" class="track-btn">
            Track Update
        </a>
    `;

    return card;
}


// ================= HELPERS =================

function getStatus(status) {

    const map = {

        received:
        { text: "Received", icon: "clock" },

        active:
        { text: "Active", icon: "heart" },

        in_progress:
        { text: "Hero on Way", icon: "heart" },

        resolved:
        { text: "Safe & Resolved", icon: "check-circle" }
    };

    return map[status] ||
    { text: "Pending", icon: "help-circle" };
}


function formatDate(date) {
    return new Date(date).toLocaleDateString();
}


function showError(container, message) {
    container.innerHTML =
        `<p style="color:red">${message}</p>`;
}