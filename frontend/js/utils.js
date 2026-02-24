// Get token from storage
function getToken() {

    return localStorage.getItem("access_token");

}


// Save token after login
function saveToken(token) {

    localStorage.setItem("access_token", token);

}


// Logout user
function logout() {

    localStorage.removeItem("access_token");

    location.href = "index.html";

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

    const res = await fetch(url, {

        ...options,

        headers: {
            Authorization: "Bearer " + getToken()
        }

    });


    if (res.status === 401) {

        logout();

    }


    return res;

}


// Setup logout button
function setupNavbar() {

    const btn =
        document.querySelector(".logout-btn");


    if (btn) {

        btn.onclick = logout;

    }

}


// Run when page loads
document.addEventListener("DOMContentLoaded", function () {

    setupNavbar();

});