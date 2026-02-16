document.addEventListener("DOMContentLoaded", () => {
    checkLogin();
    loadMyReports();
});

// ---------------- LOAD REPORTS ----------------

async function loadMyReports() {
    const container = document.getElementById("my-reports-grid");
    if (!container) return;

    try {
        const res = await fetchWithAuth(`${API_BASE_URL}/reports/`);

        if (!res.ok) {
            return showMessage(container, "Failed to load reports.", true);
        }

        const reports = await res.json();
        renderReports(reports, container);

    } catch (err) {
        console.error("Load reports error:", err);
        showMessage(container, "Server connection error. Please try again later.", true);
    }
}

// ---------------- RENDER ----------------

function renderReports(reports, container) {
    container.innerHTML = "";

    if (!reports.length) {
        container.innerHTML = `
            <div class="empty-state" data-aos="fade-up">
                <i data-lucide="heart" style="width: 48px; height: 48px; color: #f87171; margin-bottom: 20px;"></i>
                <p>The world is waiting for your kindness. No reports yet.</p>
                <a href="./report.html" class="track-btn" style="max-width: 200px; margin-top: 20px;">Share Care Now</a>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }

    reports.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    reports.forEach((report, index) => {
        const card = createCard(report, index);
        container.appendChild(card);
    });

    // Initialize icons after all cards are in the DOM
    if (window.lucide) {
        lucide.createIcons();
    }
}

// ---------------- CARD FACTORY ----------------

function createCard(report, index) {
    const article = document.createElement("article");
    article.className = "case-card";
    article.setAttribute("data-aos", "fade-up");
    article.setAttribute("data-aos-delay", (index * 100) % 500);

    const date = new Date(report.created_at).toLocaleDateString(undefined, {
        month: 'short', day: 'numeric', year: 'numeric'
    });

    const statusObj = getStatusLabel(report.status);
    const priority = report.priority || "Medium";

    article.innerHTML = `
        <div class="card-header">
            <span class="report-id">RSC-${String(report.id).padStart(6, "0")}</span>
            <span class="priority-tag priority-${priority.toLowerCase()}">${priority}</span>
        </div>

        <div class="case-body">
            <h3>${report.condition || "A heart seeking help"}</h3>
            
            <div class="meta-info">
                <div class="meta-item">
                    <i data-lucide="map-pin"></i>
                    <span>${report.location || "Waiting for location details..."}</span>
                </div>
                <div class="meta-item">
                    <i data-lucide="calendar"></i>
                    <span>Shared on ${date}</span>
                </div>
                <div class="meta-item">
                    <i data-lucide="users"></i>
                    <span>Gently handled by: ${report.assigned_team_name || "Kindness Team Assigned"}</span>
                </div>
            </div>
        </div>

        <div class="status-tracker">
            <div class="status-badge ${report.status}">
                <i data-lucide="${statusObj.icon}"></i>
                ${statusObj.text}
            </div>
        </div>

        <div class="card-actions">
            <a href="./track_report.html?id=${report.id}" class="track-btn">
                <span>Follow the Care Journey</span>
                <i data-lucide="heart"></i>
            </a>
        </div>
    `;

    return article;
}

// ---------------- HELPERS ----------------

function getStatusLabel(status) {
    const config = {
        received: { text: "Your report is being reviewed with care", icon: "clock" },
        in_progress: { text: "Kind hands are on their way to help", icon: "heart" },
        active: { text: "Kind hands are on their way to help", icon: "heart" },
        resolved: { text: "They are now in safe hands. Thank you.", icon: "check-circle" }
    };
    return config[status] || { text: "We are looking into this...", icon: "help-circle" };
}

function showMessage(container, message, isError = false) {
    container.innerHTML = `
        <div class="loading-state" style="color:${isError ? "#ef4444" : "inherit"}">
            <i data-lucide="${isError ? 'alert-circle' : 'info'}" style="margin-bottom: 20px;"></i>
            <p>${message}</p>
        </div>
    `;
    if (window.lucide) lucide.createIcons();
}
