document.addEventListener("DOMContentLoaded", () => {

    checkLogin();

    load();

});


// -------- LOAD --------

async function load() {

    const grid = document.getElementById("rescue-reports-grid");

    if (!grid) return;

    try {

        const res = await fetchWithAuth(`${API_BASE_URL}/reports`);

        if (!res.ok) return show(grid, "Unable to load cases");

        const reports = await res.json();

        stats(reports);

        filters(reports, grid);

    }
    catch {

        show(grid, "Server error");

    }

}


// -------- STATS --------

function stats(reports) {

    let total = reports.length,
        progress = 0,
        resolved = 0;

    reports.forEach(r => {

        const s = r.status?.toLowerCase();

        if (s === "resolved") resolved++;

        if (s === "active" || s === "in_progress") progress++;

    });

    text("stat-total", total);

    text("stat-progress", progress);

    text("stat-resolved", resolved);

}

function text(id, val) {

    const el = document.getElementById(id);

    if (el) el.textContent = val;

}


// -------- FILTER --------

function filters(reports, grid) {

    const status = document.getElementById("status-filter");

    const start = document.getElementById("start-date");

    const end = document.getElementById("end-date");

    function apply() {

        const s = status.value;

        const sDate = start.value ? new Date(start.value) : null;

        const eDate = end.value ? new Date(end.value) : null;

        const list = reports.filter(r => {

            const rs = r.status;

            const d = new Date(r.updated_at || r.created_at);

            if (s !== "all" && rs !== s && !(s === "in_progress" && rs === "active"))
                return false;

            if (sDate && d < sDate) return false;

            if (eDate && d > eDate) return false;

            return true;

        });

        render(list, grid);

    }

    status.onchange = start.onchange = end.onchange = apply;

    apply();

}


// -------- RENDER --------

function render(list, grid) {
    grid.innerHTML = "";
    if (!list.length) return show(grid, "No assigned cases found.");

    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    list.forEach((r, index) => {
        const card = document.createElement("div");
        card.className = "case-card";
        // Staggered animation
        card.style.animationDelay = `${index * 100}ms`;

        // Determine status badge class
        const status = r.status.toLowerCase();
        let statusClass = "received";
        if (status === "active" || status === "in_progress") statusClass = "in_progress";
        if (status === "resolved") statusClass = "resolved";

        // Generate HTML
        card.innerHTML = `
            <div class="case-top">
                <span class="case-id">#CASE-${String(r.id).padStart(4, "0")}</span>
                <span class="status-badge ${statusClass}">${r.status.replace("_", " ")}</span>
            </div>

            <h3>${r.condition}</h3>

            <ul class="case-info">
                <li>
                    <i data-lucide="map-pin"></i>
                    <span>${r.location}</span>
                </li>
                <li>
                    <i data-lucide="file-text"></i>
                    <span>${r.description.substring(0, 60)}${r.description.length > 60 ? "..." : ""}</span>
                </li>
                <li>
                    <i data-lucide="calendar"></i>
                    <span>${new Date(r.created_at).toLocaleDateString()}</span>
                </li>
            </ul>

            <div class="case-actions">
                <a href="./view_report.html?id=${r.id}" class="btn-update">
                    Update Status <i data-lucide="arrow-right"></i>
                </a>
            </div>
        `;

        grid.appendChild(card);
    });

    // Re-initialize icons for new elements
    if (window.lucide) lucide.createIcons();
}


// -------- MESSAGE --------

function show(grid, msg) {

    grid.innerHTML = msg;

}
