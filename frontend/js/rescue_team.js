document.addEventListener("DOMContentLoaded", () => {
    checkLogin();
    load();
});


// -------- LOAD DATA --------
async function load() {

    const grid = document.getElementById("rescue-reports-grid");
    if (!grid) return;

    try {

        const res = await fetchWithAuth(`${API_BASE_URL}/reports/my-assignments`);
        if (!res.ok) return message(grid, "Unable to load cases");

        const reports = await res.json();

        updateStats(reports);
        setupFilters(reports, grid);

    } catch {
        message(grid, "Server error");
    }
}


// -------- UPDATE DASHBOARD STATS --------
function updateStats(reports) {

    const s = reports.reduce((a, r) => {

        const st = r.status?.toLowerCase();

        a.total++;

        if (st === "resolved") a.resolved++;
        if (st === "active" || st === "in_progress") a.progress++;

        return a;

    }, { total:0, progress:0, resolved:0 });

    set("stat-total", s.total);
    set("stat-progress", s.progress);
    set("stat-resolved", s.resolved);
}

function set(id,val){
    const el=document.getElementById(id);
    if(el) el.textContent=val;
}


// -------- FILTER HANDLING --------
function setupFilters(reports, grid) {

    const status = document.getElementById("status-filter");
    const start  = document.getElementById("start-date");
    const end    = document.getElementById("end-date");

    const apply = () => {

        const s = status.value;
        const sDate = start.value ? new Date(start.value) : null;
        const eDate = end.value ? new Date(end.value) : null;

        const filtered = reports.filter(r => {

            const rs = r.status;
            const d = new Date(r.updated_at || r.created_at);

            if (s !== "all" && rs !== s && !(s==="in_progress" && rs==="active"))
                return false;

            if (sDate && d < sDate) return false;
            if (eDate && d > eDate) return false;

            return true;
        });

        render(filtered, grid);
    };

    status.onchange = start.onchange = end.onchange = apply;
    apply();
}


// -------- RENDER CASE CARDS --------
function render(list, grid) {

    if (!list.length) return message(grid,"No assigned cases found.");

    grid.innerHTML = list
        .sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))
        .map((r,i)=>card(r,i))
        .join("");

    lucide?.createIcons();
}


// -------- CARD TEMPLATE --------
function card(r,i){

    const s=r.status.toLowerCase();

    const badge =
        s==="resolved" ? "resolved" :
        (s==="active"||s==="in_progress") ? "in_progress" :
        "received";

    const desc=r.description||"";
    const short=desc.substring(0,60)+(desc.length>60?"...":"");

    return `
    <div class="case-card" style="animation-delay:${i*100}ms">

        <div class="case-top">
            <span class="case-id">#CASE-${String(r.id).padStart(4,"0")}</span>
            <span class="status-badge ${badge}">
                ${r.status.replace("_"," ")}
            </span>
        </div>

        <h3>${r.condition}</h3>

        <ul class="case-info">
            <li>
                <i data-lucide="map-pin"></i>
                <span>${r.location}</span>
            </li>

            <li>
                <i data-lucide="file-text"></i>
                <span>${short}</span>
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

    </div>`;
}


// -------- SIMPLE MESSAGE --------
function message(el,msg){
    el.innerHTML=`<p>${msg}</p>`;
}