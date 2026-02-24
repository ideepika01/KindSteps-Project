document.addEventListener("DOMContentLoaded", init);


// Start page
function init() {

    checkLogin();

    const id = new URLSearchParams(location.search).get("id");

    if (!id) return redirect("main.html");

    setupBack();

    loadReport(id);

}


// Back button
function setupBack() {

    const btn = document.getElementById("back-to-dash");

    if (!btn) return;

    btn.onclick = function () {

        redirect("main.html");

    };

}


// Load report
async function loadReport(id) {

    try {

        const res =
            await fetchWithAuth(API_BASE_URL + "/reports/" + id);

        if (!res.ok) {

            alert("Report not found");

            return;

        }

        const report = await res.json();

        showReport(report);

        setupUpdate(report);

    }
    catch {

        alert("Server error");

    }

}


// Show report
function showReport(r) {

    setText("case-title", r.condition);

    setText("case-id", "ID: RSC-" + r.id);

    setText("case-date",
        new Date(r.created_at).toLocaleString()
    );

    setText("summary-text", r.description);

    setText("reporter-name", r.contact_name);

    setText("reporter-phone", r.contact_phone);

    setText("location-text", r.location);

    setHTML("case-status-text",
        "Status: " + r.status
    );


    // Show image
    const img =
        document.getElementById("case-image");

    if (img && r.photo_url) {

        img.src = r.photo_url;

        img.style.display = "block";

    }


    // Fill inputs
    setValue("field-review", r.field_review);

    setValue("rescued-location", r.rescued_location);


    // Show timeline
    showTimeline(r.status);

}


// Timeline
function showTimeline(status) {

    const steps =
        ["received", "in_progress", "active", "resolved"];

    const index =
        steps.indexOf(status);

    steps.forEach(function (s, i) {

        if (i <= index) {

            document
                .getElementById("step-" + s)
                .classList.add("active");

        }

    });

}


// Setup update
function setupUpdate(r) {

    const drop =
        document.getElementById("status-dropdown");

    const btn =
        document.getElementById("update-btn");

    if (!drop || !btn) return;

    drop.value = r.status;

    btn.onclick = function () {

        updateReport(
            r.id,
            drop.value,
            getValue("field-review"),
            getValue("rescued-location")
        );

    };

}


// Update report
async function updateReport(id, status, review, location) {

    if (status === "resolved" && (!review || !location)) {

        alert("Enter review and location");

        return;

    }

    try {

        const res =
            await fetchWithAuth(
                API_BASE_URL + "/reports/" + id,
                {
                    method: "PUT",
                    headers:
                    { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        status: status,
                        field_review: review,
                        rescued_location: location
                    })
                }
            );


        if (!res.ok) {

            alert("Update failed");

            return;

        }


        alert("Updated");

        location.reload();

    }
    catch {

        alert("Server error");

    }

}


// Set text
function setText(id, text) {

    document.getElementById(id).innerText = text;

}


// Set html
function setHTML(id, text) {

    document.getElementById(id).innerHTML = text;

}


// Set input value
function setValue(id, val) {

    const el = document.getElementById(id);

    if (el) el.value = val;

}


// Get input value
function getValue(id) {

    const el = document.getElementById(id);

    return el ? el.value : "";

}


// Redirect page
function redirect(url) {

    location.href = url;

}