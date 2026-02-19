document.addEventListener("DOMContentLoaded", init);

async function init() {

    checkLogin();

    const id = new URLSearchParams(location.search).get("id");

    if (!id) return redirect("./main.html");

    setupBackButton();
    loadReport(id);
}


// ================= BACK BUTTON =================

function setupBackButton() {

    const btn = document.getElementById("back-to-dash");
    if (!btn) return;

    btn.onclick = async e => {

        e.preventDefault();

        try {

            const res = await fetchWithAuth(`${API_BASE_URL}/auth/me`);
            if (!res.ok) return redirect("./main.html");

            const user = await res.json();

            const routes = {
                admin: "./admin_control.html",
                rescue_team: "./rescue_team.html",
                user: "./my_reports.html"
            };

            redirect(routes[user.role] || "./main.html");

        } catch {

            redirect("./main.html");

        }
    };
}


// ================= LOAD =================

async function loadReport(id) {

    try {

        const res = await fetchWithAuth(`${API_BASE_URL}/reports/${id}`);

        if (!res.ok) return alert("Report not found.");

        const report = await res.json();

        displayReport(report);

        setupStatusUpdate(report.id, report.status);

    } catch (e) {

        console.error(e);

    }
}


// ================= DISPLAY =================

function displayReport(r) {

    setText("case-title", r.condition);

    setText("case-id",
        "ID: RSC-" + String(r.id).padStart(6, "0")
    );

    setText("case-date",
        "Reported: " + new Date(r.created_at).toLocaleString()
    );

    setText("summary-text", r.description);

    setText("reporter-name", r.contact_name);

    setText("reporter-phone", r.contact_phone);


    // Location

    const loc = document.getElementById("location-text");

    if (loc) {

        loc.innerHTML =
            r.location +
            (r.latitude
                ? `<br><a target="_blank"
                href="https://www.google.com/maps?q=${r.latitude},${r.longitude}">
                View on Map</a>`
                : "");
    }


    // Status

    setHTML("case-status-text",
        `Status: <span class="tag ${r.status}">
        ${r.status}</span>`
    );


    // Image

    const img = document.getElementById("case-image");

    if (img) {

        if (!r.photo_url) img.style.display = "none";

        else {

            img.src =
                r.photo_url.startsWith("http") ||
                    r.photo_url.startsWith("data:")
                    ? r.photo_url
                    : `${API_BASE_URL}/${r.photo_url}`;

            img.style.display = "block";
        }
    }


    setValue("field-review", r.field_review);

    setValue("rescued-location", r.rescued_location);


    renderTimeline(r);

    if (window.lucide) lucide.createIcons();
}


// ================= TIMELINE =================

function renderTimeline(r) {

    const steps =
        ["received", "in_progress", "active", "resolved"];

    const current = steps.indexOf(r.status);

    steps.forEach((s, i) => {

        const el = document.getElementById(`step-${s}`);

        if (el && i <= current)
            el.classList.add("active");
    });
}


// ================= UPDATE =================

function setupStatusUpdate(id, status) {

    const drop = document.getElementById("status-dropdown");
    const btn = document.getElementById("update-btn");

    if (!drop || !btn) return;

    drop.value = status;

    btn.onclick = () =>
        updateReport(
            id,
            drop.value,
            getValue("field-review"),
            getValue("rescued-location")
        );
}


async function updateReport(id, status, review, location) {

    try {

        const res = await fetchWithAuth(
            `${API_BASE_URL}/reports/${id}`,
            {
                method: "PUT",

                headers:
                    { "Content-Type": "application/json" },

                body: JSON.stringify({
                    status,
                    field_review: review,
                    rescued_location: location
                })
            }
        );

        if (!res.ok)
            return alert("Update failed");

        alert("Case updated");

        location.reload();

    }
    catch {

        alert("Server error");

    }
}


// ================= HELPERS =================

const setText = (id, text) =>
    document.getElementById(id).innerText = text;

const setHTML = (id, html) =>
    document.getElementById(id).innerHTML = html;

const setValue = (id, val) => {

    const el = document.getElementById(id);

    if (el && val) el.value = val;
};

const getValue = id =>
    document.getElementById(id)?.value || "";

const redirect = url =>
    location.href = url;
