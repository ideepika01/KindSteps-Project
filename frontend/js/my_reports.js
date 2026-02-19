document.addEventListener("DOMContentLoaded", () => {
    checkLogin();
    loadReports();
});


// ---------- LOAD ----------
async function loadReports() {

    const box = document.getElementById("my-reports-grid");

    if (!box) return;

    try {

        const res = await fetchWithAuth(`${API_BASE_URL}/reports/`);

        if (!res.ok)
            return show(box, "Failed to load reports", true);

        const reports = await res.json();

        display(reports, box);

    }
    catch {

        show(box, "Server error", true);
    }
}


// ---------- DISPLAY ----------
function display(reports, box) {

    box.innerHTML = "";

    if (!reports.length)
        return show(box, "No reports yet");

    reports
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .forEach((r, i) => box.appendChild(card(r, i)));

    lucide?.createIcons();
}


// ---------- CARD ----------
function card(r, i) {

    const el = document.createElement("article");

    const status = statusInfo(r.status);

    el.className = "case-card";

    el.setAttribute("data-aos", "fade-up");

    el.setAttribute("data-aos-delay", (i * 100) % 500);

    el.innerHTML = `

    <div class="card-header">
        <span>RSC-${String(r.id).padStart(6, "0")}</span>
        <span>${r.priority || "Medium"}</span>
    </div>

    <h3>${r.condition || "No description"}</h3>

    <p>${r.location || "No location"}</p>

    <p>${new Date(r.created_at).toLocaleDateString()}</p>

    <div class="${r.status}">
        <i data-lucide="${status.icon}"></i>
        ${status.text}
    </div>

    <a href="./track_report.html?id=${r.id}">
        Track
    </a>
    `;

    return el;
}


// ---------- STATUS ----------
function statusInfo(s) {

    return {

        received: { text: "Checking", icon: "clock" },

        active: { text: "Helping", icon: "heart" },

        in_progress: { text: "Helping", icon: "heart" },

        resolved: { text: "Safe", icon: "check-circle" }

    }[s] || { text: "Pending", icon: "help-circle" };
}


// ---------- MESSAGE ----------
function show(box, msg, error = false) {

    box.innerHTML =
        `<p style="color:${error ? "red" : "black"}">${msg}</p>`;
}
