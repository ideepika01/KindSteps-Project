document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const signupForm = document.getElementById("signup-form");

    if (loginForm) loginForm.addEventListener("submit", login);
    if (signupForm) signupForm.addEventListener("submit", signup);
});


// ---------------- LOGIN ----------------

async function login(e) {
    e.preventDefault();

    const email = getValue("login-email");
    const password = getValue("login-password");

    if (!email || !password) {
        return alert("Enter email and password.");
    }

    try {
        const body = new URLSearchParams({ username: email, password });

        const data = await postForm("/auth/login", body);
        if (!data) return;

        saveToken(data.access_token);
        redirectUser();

    } catch {
        alert("Unable to connect to server.");
    }
}


// ---------------- SIGNUP ----------------

async function signup(e) {
    e.preventDefault();

    const full_name = getValue("signup-name");
    const email = getValue("signup-email");
    const phone = getValue("signup-phone");
    const password = getValue("signup-password");
    const role = document.querySelector('input[name="role"]:checked')?.value || "user";

    if (!full_name || !email || !password) {
        return alert("Fill required fields.");
    }

    try {
        const data = await postJSON("/auth/signup", {
            full_name,
            email,
            phone,
            password,
            role
        });

        if (!data) return;

        alert("Account created. Please login.");
        window.location.href = "../index.html";

    } catch {
        alert("Server error. Try again.");
    }
}


// ---------------- REDIRECT ----------------

async function redirectUser() {
    try {
        const res = await fetchWithAuth(`${API_BASE_URL}/auth/me`);
        if (!res.ok) return goHome();

        const user = await res.json();

        const routes = {
            admin: "./pages/admin_control.html",
            rescue_team: "./pages/rescue_team.html"
        };

        window.location.href = routes[user.role] || "./pages/main.html";

    } catch {
        goHome();
    }
}

function goHome() {
    window.location.href = "./pages/main.html";
}


// ---------------- HELPERS ----------------

function getValue(id) {
    return document.getElementById(id)?.value.trim();
}

async function postForm(endpoint, body) {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body
    });

    if (!res.ok) {
        const error = await safeJSON(res);
        alert(error?.detail || error?.error || "Request failed.");
        return null;
    }

    return res.json();
}

async function postJSON(endpoint, data) {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    if (!res.ok) {
        const error = await safeJSON(res);
        alert(error?.detail || "Request failed.");
        return null;
    }

    return res.json();
}

async function safeJSON(res) {
    try {
        return await res.json();
    } catch {
        return null;
    }
}
