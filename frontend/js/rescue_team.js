document.addEventListener("DOMContentLoaded", () => {
    checkLogin();
    loadAssignments();
});


// ---------------- LOAD DATA ----------------

async function loadAssignments() {
    const grid = document.getElementById("rescue-reports-grid");
    if (!grid) return;

    try {
        const res = await fetchWithAuth(
            `${API_BASE_URL}/reports/my-assignments`
        );

        if (!res.ok) {
            return showMessage(grid, "Unable to load cases.");
        }

        const reports = await res.json();
        if (!Array.isArray(reports)) return;

        updateStats(reports);
        initFilters(reports, grid);

    } catch {
        showMessage(grid, "Server connection failed.");
    }
}


// ---------------- FILTERS ----------------

function initFilters(reports, grid) {
    const statusEl = document.getElementById("status-filter");
    const startEl = document.getElementById("start-date");
    const endEl = document.getElementById("end-date");

    function apply() {
        const status = (statusEl.value || "all").toLowerCase();
        const start = startEl.value ? new Date(startEl.value) : null;
        const end = endEl.value ? new Date(endEl.value) : null;

        if (start) start.setHours(0, 0, 0, 0);
        if (end) end.setHours(23, 59, 59, 999);

        const filtered = reports.filter(r => {
            const s = (r.status || "received").toLowerCase();
            const date = new Date(r.updated_at || r.created_at);

            if (status !== "all") {
                if (status === "in_progress" && !(s === "active" || s === "in_progress")) return false;
                if (status !== "in_progress" && s !== status) return false;
            }

            if (start && date < start) return false;
            if (end && date > end) return false;

            return true;
        });

        renderGrid(filtered, grid);
    }

    statusEl.onchange = apply;
    startEl.onchange = apply;
    endEl.onchange = apply;

    apply();
}


// ---------------- STATS ----------------

function updateStats(reports) {
    let total = reports.length;
    let progress = 0;
    let resolved = 0;

    reports.forEach(r => {
        const s = (r.status || "").toLowerCase();
        if (s === "resolved") resolved++;
        if (s === "active" || s === "in_progress") progress++;
    });

    setText("stat-total", total);
    setText("stat-progress", progress);
    setText("stat-resolved", resolved);
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}


// ---------------- RENDER ----------------

function renderGrid(list, container) {
    container.innerHTML = "";

    if (!list.length) {
        return showMessage(container, "No matching cases.");
    }

    list
        .sort((a, b) =>
            new Date(b.updated_at || b.created_at) -
            new Date(a.updated_at || a.created_at)
        )
        .forEach(r => container.appendChild(createCard(r)));

    if (window.AOS) AOS.refresh();
    if (window.lucide) lucide.createIcons();
}


// ---------------- CARD ----------------

function createCard(r) {
    const card = document.createElement("article");
    card.className = "case-card";

    const status = (r.status || "received").toLowerCase();
    const date = new Date(r.created_at).toLocaleDateString();

    card.innerHTML = `
        <div class="case-top">
            <div class="case-id">CASE-${String(r.id).padStart(5, "0")}</div>
            <span class="tag ${status}">${status.replace("_", " ")}</span>
        </div>

        <h3>${r.condition}</h3>

        <ul class="case-info">
            <li><i data-lucide="map-pin"></i> ${r.location}</li>
            <li><i data-lucide="calendar"></i> Assigned: ${date}</li>
            <li><i data-lucide="user"></i> ${r.contact_name} (${r.contact_phone})</li>
        </ul>

        <div class="case-actions">
            <a href="./view_report.html?id=${r.id}" class="btn-case btn-update">
                <i data-lucide="edit-3"></i> Update Case
            </a>
            <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.location)}"
               target="_blank" class="btn-case btn-map">
                <i data-lucide="navigation"></i> Map View
            </a>
        </div>
    `;

    return card;
}


// ---------------- UTIL ----------------

function showMessage(container, message) {
    container.innerHTML = `<div class="empty-state">${message}</div>`;
}
