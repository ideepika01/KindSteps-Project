document.addEventListener("DOMContentLoaded", () => {

    checkLogin();

    const input = document.getElementById("tracking-id-input");
    const btn = document.getElementById("track-btn");

    const id = new URLSearchParams(location.search).get("id");

    if (id) {
        input.value = id;
        load(id);
    }

    btn.onclick = () => {
        const val = input.value.trim();
        if (!val) return alert("Please enter a Tracking ID");
        load(val);
    };
});


// -------- FETCH DATA --------
async function load(id) {

    const msg = $("#status-message");
    const info = $("#detailed-info");
    const progress = $("#progress-container");

    msg.innerText = `🔍 Searching for report RSC-${String(id).padStart(6,"0")}...`;

    info.style.display = "none";
    progress.style.display = "none";

    try {

        const res = await fetchWithAuth(`${API_BASE_URL}/reports/track/${id}`);

        if (!res.ok) {
            msg.innerText = "❌ Report not found. Please check the ID.";
            msg.style.color = "#ef4444";
            return;
        }

        const report = await res.json();
        render(report);

    } catch {
        msg.innerText = "⚠️ Network error. Try again later.";
    }
}


// -------- RENDER DASHBOARD --------
function render(r){

    const status = r.status || "received";

    $("#detailed-info").style.display = "grid";
    $("#progress-container").style.display = "flex";

    const badge=$("#status-badge");
    badge.innerText = status.replace("_"," ").toUpperCase();
    badge.className = `status-badge ${status}`;

    $("#status-message").innerText = messages[status] || messages.default;

    const teamName =
        r.assigned_team_name && r.assigned_team_name!=="Unassigned"
        ? r.assigned_team_name
        : "Volunteer Team Assigning...";

    $("#info-team-name").innerText = teamName;

    $("#info-team-phone").innerText =
        r.assigned_team_phone && r.assigned_team_phone!=="N/A"
        ? `📞 ${r.assigned_team_phone}`
        : "Contact pending...";

    $("#info-status-label").innerText = titles[status] || "Processing";

    $("#info-updated").innerText =
        `Last update: ${new Date(r.updated_at).toLocaleString()}`;

    $("#info-rescue-location").innerText =
        r.rescued_location || "Awaiting rescue completion...";

    const notes=$("#field-review-container");

    if(r.field_review){
        notes.style.display="flex";
        $("#info-field-review").innerText=r.field_review;
    }else{
        notes.style.display="none";
    }

    progressSteps(status);

    lucide?.createIcons();
}


// -------- PROGRESS STEPPER --------
function progressSteps(status){

    const steps=["received","in_progress","resolved"];

    const idx = status==="active" ? 1 : steps.indexOf(status);

    steps.forEach((s,i)=>{
        const id=s==="in_progress"?"inprogress":s;
        const el=$(`#status-${id}`);
        if(!el) return;

        el.classList.toggle("active", i<=idx);
    });

    document.querySelectorAll(".progress-line")
        .forEach((l,i)=>l.classList.toggle("active", i<idx));
}


// -------- STATUS MAPS --------
const messages={
    received:"We've received your report and are verifying the details.",
    active:"A rescue team has been alerted and is reviewing the case.",
    in_progress:"Heroes are currently on their way to the location!",
    resolved:"Success! The individual has been safely rescued and cared for.",
    default:"Tracking your report progress..."
};

const titles={
    received:"Ticket Logged",
    active:"Team Alerted",
    in_progress:"Rescue in Action",
    resolved:"Mission Accomplished"
};


// -------- SHORT DOM HELPER --------
function $(id){
    return document.getElementById(id.replace("#",""));
}