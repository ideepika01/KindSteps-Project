// ================= TOKEN =================

const getToken = () => localStorage.getItem("access_token");

const saveToken = token =>
    localStorage.setItem("access_token", token);

function logout() {
    localStorage.removeItem("access_token");

    // Determine redirect path
    const isPages = window.location.pathname.includes("/pages/");
    const base = isPages ? "../" : "./";

    window.location.href = base + "index.html";
}

function checkLogin() {
    const token = getToken();

    if (!token) {
        // Only alert if we ARE on a protected page
        const isProtected = window.location.pathname.includes("/pages/") &&
            !window.location.pathname.includes("login.html");

        if (isProtected) {
            alert("Please sign in first.");
            logout();
        }
        return null;
    }

    return token;
}


// ================= FETCH =================

async function fetchWithAuth(url, options = {}) {

    const res = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            Authorization: "Bearer " + getToken()
        }
    });

    if (res.status === 401) logout();

    return res;
}


// ================= DASHBOARD =================

function getDashboardUrl(role) {
    const isPages = window.location.pathname.includes("/pages/");
    const base = isPages ? "./" : "./pages/";

    const pages = {
        admin: "admin_control.html",
        rescue_team: "rescue_team.html",
        user: "main.html"
    };

    return base + (pages[role] || "main.html");
}


// ================= NAVBAR =================

async function setupNavbar() {

    // Attach logout to ALL .logout-btn elements
    // Attach logout to ALL .logout-btn elements
    const logoutBtns = document.querySelectorAll(".logout-btn");

    logoutBtns.forEach(btn => {
        // Remove old listener if any (safety)
        btn.onclick = null;

        btn.addEventListener("click", (e) => {
            e.preventDefault();
            console.log("Logout clicked");
            logout();
        });
    });

    const token = getToken();
    if (!token) return;

    try {

        const res = await fetchWithAuth(`${API_BASE_URL}/auth/me`);
        if (!res.ok) return;

        const user = await res.json();
        const dashboard = getDashboardUrl(user.role);

        document.querySelectorAll(".logo, .brand, .nav-links a")
            .forEach(link => {

                const text = link.textContent.toLowerCase();

                if (text === "home" || link.classList.contains("logo"))
                    link.href = dashboard;
            });

    } catch (err) {
        console.error("Navbar error:", err);
    }
}


// ================= MOBILE MENU =================

function setupMobileMenu() {
    const nav = document.querySelector(".nav-container");
    const links = document.querySelector(".nav-links");
    if (!nav || !links) return;

    let btn = document.querySelector(".mobile-menu-btn");
    if (!btn) {
        btn = document.createElement("button");
        btn.className = "mobile-menu-btn";
        btn.innerHTML = "<span></span><span></span><span></span>";
        nav.appendChild(btn);
    }

    // Use a fresh click handler to avoid duplicates if called multiple times
    btn.onclick = (e) => {
        e.stopPropagation();
        btn.classList.toggle("active");
        links.classList.toggle("active");

        if (links.classList.contains("active")) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
    };

    // Close menu when clicking any link
    links.querySelectorAll("a").forEach(link => {
        link.onclick = () => {
            btn.classList.remove("active");
            links.classList.remove("active");
            document.body.style.overflow = "";
        };
    });

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
        if (links.classList.contains("active") && !links.contains(e.target) && !btn.contains(e.target)) {
            btn.classList.remove("active");
            links.classList.remove("active");
            document.body.style.overflow = "";
        }
    });
}


// ================= INIT =================

document.addEventListener("DOMContentLoaded", () => {

    setupNavbar();
    setupMobileMenu();

});
