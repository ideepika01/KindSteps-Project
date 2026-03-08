// Run when page loads
document.addEventListener("DOMContentLoaded", () => {
    checkLogin();
    loadReports();
});


// ---------- LOAD REPORTS ----------
async function loadReports() {

    const box = document.getElementById("my-reports-grid");
    if (!box) return;

    try {

        const res = await fetchWithAuth(`${API_BASE_URL}/reports/`);
        if (!res.ok) return show(box, "Failed to load reports", true);

        const reports = await res.json();

        if (!reports.length) return show(box, "No reports yet");

        // Show newest reports first
        box.innerHTML = reports
            .sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))
            .map((r,i)=>card(r,i))
            .join("");

        lucide?.createIcons();

    } catch {
        show(box, "Server error", true);
    }
}


// ---------- CREATE CARD ----------
function card(r, i){

    const s = status[r.status] || status.default;

    return `
    <article class="case-card" data-aos="fade-up" data-aos-delay="${(i*100)%500}">
        <div class="card-header">
            <span>RSC-${String(r.id).padStart(6,"0")}</span>
            <span>${r.priority || "Medium"}</span>
        </div>

        <h3>${r.condition || "No description"}</h3>
        <p>${r.location || "No location"}</p>
        <p>${new Date(r.created_at).toLocaleDateString()}</p>

        <div class="${r.status}">
            <i data-lucide="${s.icon}"></i>
            ${s.text}
        </div>

        <a href="./track_report.html?id=${r.id}">Track</a>
    </article>`;
}


// ---------- STATUS MAP ----------
const status = {
    received:{ text:"Checking", icon:"clock" },
    active:{ text:"Helping", icon:"heart" },
    in_progress:{ text:"Helping", icon:"heart" },
    resolved:{ text:"Safe", icon:"check-circle" },
    default:{ text:"Pending", icon:"help-circle" }
};


// ---------- SHOW MESSAGE ----------
function show(box,msg,error=false){
    box.innerHTML = `<p style="color:${error?"red":"black"}">${msg}</p>`;
}