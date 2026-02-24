
// Run when page loads
document.addEventListener("DOMContentLoaded", function () {

    checkLogin();

    start();

});



// Start tracking
function start() {

    const id =
        new URLSearchParams(window.location.search)
        .get("id");


    if (!id) {

        location.href = "my_reports.html";

        return;

    }


    document.getElementById("tracking-id-input").value = id;

    loadReport(id);

}



// Load report from backend
async function loadReport(id) {

    const msg =
        document.getElementById("status-message");

    msg.innerText = "Loading...";


    try {

        const res =
            await fetchWithAuth(
                API_BASE_URL + "/reports/track/" + id
            );


        if (!res.ok) {

            msg.innerText = "Report not found";

            return;

        }


        const report = await res.json();

        showReport(report);

    }
    catch {

        msg.innerText = "Server error";

    }

}



// Show report data
function showReport(r) {

    const status =
        r.status || "received";


    document.getElementById("status-badge")
        .innerText = status;


    document.getElementById("info-team-name")
        .innerText =
        r.assigned_team_name || "Not assigned";


    document.getElementById("info-team-phone")
        .innerText =
        r.assigned_team_phone || "No phone";


    document.getElementById("info-updated")
        .innerText =
        new Date(r.updated_at)
        .toLocaleString();


    document.getElementById("info-rescue-location")
        .innerText =
        r.rescued_location || "Pending";


    document.getElementById("status-message")
        .innerText =
        getMessage(status);

}



// Status message
function getMessage(status) {

    if (status === "resolved")
        return "Rescue completed";

    if (status === "active"
        || status === "in_progress")
        return "Team on the way";

    return "Report received";

}