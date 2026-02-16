// ================= AUTH SYSTEM =================

// Get token
function getToken() {
    return localStorage.getItem("access_token");
}

// Save token
function saveToken(token) {
    localStorage.setItem("access_token", token);
}

// Logout
function logout() {
    localStorage.removeItem("access_token");
    // Ensure we go back to the root landing page regardless of where we are
    const isPage = window.location.pathname.includes("/pages/");
    window.location.href = isPage ? "../index.html" : "./index.html";
}

// Check login
function checkLogin() {
    const token = getToken();

    if (!token) {
        alert("Please sign in first.");
        window.location.href = "../index.html";
        return null;
    }

    return token;
}


// ================= FETCH WITH AUTH =================

async function fetchWithAuth(url, options = {}) {
    const token = getToken();

    const response = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            Authorization: "Bearer " + token
        }
    });

    // If unauthorized → logout
    if (response.status === 401) {
        logout();
    }

    return response;
}


// ================= ROLE DASHBOARD =================

function getDashboardUrl(role) {
    const insidePages = window.location.pathname.includes("/pages/");
    const base = insidePages ? "./" : "./pages/";

    if (role === "admin") {
        return base + "admin_control.html";
    }

    if (role === "rescue_team") {
        return base + "rescue_team.html";
    }

    return base + "main.html";
}


// ================= DYNAMIC NAVBAR =================

async function setupDynamicNavbar() {
    // Attach logout event to any logout buttons found
    const logoutBtns = document.querySelectorAll(".logout-btn");
    logoutBtns.forEach(btn => {
        btn.onclick = (e) => {
            e.preventDefault();
            logout();
        };
    });

    const token = getToken();
    if (!token) return;

    try {
        const res = await fetchWithAuth(`${API_BASE_URL}/auth/me`);
        if (!res.ok) return;

        const user = await res.json();
        const dashboardUrl = getDashboardUrl(user.role);

        const links = document.querySelectorAll(
            ".logo, .brand, .nav-links a"
        );

        links.forEach(link => {
            const text = link.textContent.toLowerCase();

            if (text === "home" || link.classList.contains("logo")) {
                link.href = dashboardUrl;
            }
        });

    } catch (error) {
        console.error("Navbar setup failed:", error);
    }
}


// ================= MOBILE MENU =================

function setupMobileMenu() {
    const navContainer = document.querySelector(".nav-container");
    const navLinks = document.querySelector(".nav-links");

    if (!navContainer || !navLinks) return;

    // Create btn if it doesn't exist
    let menuBtn = document.querySelector(".mobile-menu-btn");
    if (!menuBtn) {
        menuBtn = document.createElement("button");
        menuBtn.className = "mobile-menu-btn";
        menuBtn.innerHTML = "<span></span><span></span><span></span>";
        navContainer.appendChild(menuBtn);
    }

    menuBtn.onclick = () => {
        menuBtn.classList.toggle("active");
        navLinks.classList.toggle("active");
        document.body.style.overflow = navLinks.classList.contains("active") ? "hidden" : "";
    };

    // Close menu when clicking a link
    navLinks.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            menuBtn.classList.remove("active");
            navLinks.classList.remove("active");
            document.body.style.overflow = "";
        });
    });
}


// ================= RUN ON LOAD =================

document.addEventListener(
    "DOMContentLoaded",
    () => {
        setupDynamicNavbar();
        setupMobileMenu();
    }
);
