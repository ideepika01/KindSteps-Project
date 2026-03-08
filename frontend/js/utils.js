// -------- TOKEN STORAGE --------

// Get token
function getToken() {
    return localStorage.getItem("access_token") || null;
}

// Save token
function saveToken(token) {
    localStorage.setItem("access_token", token);
}

// Remove token
function clearToken() {
    localStorage.removeItem("access_token");
}

// Get correct path for redirects (handling root vs /pages/ directory)
function getRedirectPath(page) {
    const rootPages = ["index.html", "about.html", "contact.html", "works.html"];
    const inPagesDir = window.location.pathname.includes("/pages/");

    if (rootPages.includes(page)) {
        return inPagesDir ? `../${page}` : `./${page}`;
    }

    return inPagesDir ? `./${page}` : `./pages/${page}`;
}


// -------- AUTH --------

// Logout user
function logout() {
    clearToken();
    window.location.href = getRedirectPath("index.html");
}

// Ensure user logged in
function checkLogin() {
    const token = getToken();
    if (!token) logout();
    return token;
}


// -------- FETCH HELPER --------

async function fetchWithAuth(url, options = {}) {

    const token = getToken();

    const headers = {
        ...options.headers,
        Authorization: token ? `Bearer ${token}` : ""
    };

    let body = options.body;

    if (body && typeof body === "object" && !(body instanceof FormData)) {
        body = JSON.stringify(body);
        headers["Content-Type"] = "application/json";
    }

    const res = await fetch(url, {
        ...options,
        headers,
        body
    });

    // If token expired
    if (res.status === 401) {
        logout();
        throw new Error("Unauthorized");
    }

    return res;
}


// -------- NAVBAR --------

function setupNavbar() {
    const btn = document.querySelector(".logout-btn");

    if (btn) {
        btn.addEventListener("click", e => {
            e.preventDefault();
            logout();
        });
    }
}


// -------- INIT --------

document.addEventListener("DOMContentLoaded", setupNavbar);