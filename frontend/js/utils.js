// Get token from storage
function getToken() {

    return localStorage.getItem("access_token");

}


// Save token after login
function saveToken(token) {

    localStorage.setItem("access_token", token);

}


// Helper to get correct relative path to root or pages
function getRedirectPath(target) {
    const isInsidePages = window.location.pathname.includes("/pages/");
    if (target === "index.html") {
        return isInsidePages ? "../index.html" : "index.html";
    }
    return isInsidePages ? `./${target}` : `./pages/${target}`;
}


// Logout user
function logout() {
    localStorage.removeItem("access_token");
    window.location.href = getRedirectPath("index.html");
}


// Check user login
function checkLogin() {

    const token = getToken();

    if (!token) {

        alert("Please login first");

        logout();

        return null;

    }

    return token;

}


// Fetch with token
async function fetchWithAuth(url, options = {}) {
    const headers = {
        Authorization: "Bearer " + getToken(),
        ...options.headers
    };

    let body = options.body;
    if (body && typeof body === 'object' && !(body instanceof FormData)) {
        body = JSON.stringify(body);
        if (!headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }
    }

    const res = await fetch(url, {
        ...options,
        headers,
        body
    });

    if (res.status === 401) {
        logout();
    }

    return res;
}


// Setup logout button
function setupNavbar() {

    const btn = document.querySelector(".logout-btn");

    if (btn) {
        btn.onclick = (e) => {
            e.preventDefault();
            logout();
        };
    }

}


// Run when page loads
document.addEventListener("DOMContentLoaded", function () {

    setupNavbar();

});