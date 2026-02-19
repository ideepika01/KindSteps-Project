document.addEventListener("DOMContentLoaded", init);

function init() {
    document.getElementById("login-form")?.addEventListener("submit", login);
    document.getElementById("signup-form")?.addEventListener("submit", signup);
}


// ---------- LOGIN ----------
async function login(e) {

    e.preventDefault();

    const email = get("login-email");
    const password = get("login-password");

    if (!email || !password)
        return alert("Enter email and password");

    const data = await send("/auth/login",
        new URLSearchParams({ username: email, password }),
        "application/x-www-form-urlencoded"
    );

    if (!data) return;

    saveToken(data.access_token);

    redirectUser();
}


// ---------- SIGNUP ----------
async function signup(e) {

    e.preventDefault();

    const data = await send("/auth/signup", {

        full_name: get("signup-name"),
        email: get("signup-email"),
        phone: get("signup-phone"),
        password: get("signup-password"),
        role: document.querySelector('input[name="role"]:checked')?.value || "user"

    });

    if (!data) return;

    alert("Account created");

    location.href = "../index.html";
}


// ---------- REDIRECT ----------
async function redirectUser() {

    try {

        const res = await fetchWithAuth(`${API_BASE_URL}/auth/me`);

        if (!res.ok) return goHome();

        const user = await res.json();

        const pages = {
            admin: "./pages/admin_control.html",
            rescue_team: "./pages/rescue_team.html"
        };

        location.href = pages[user.role] || "./pages/main.html";

    }
    catch {
        goHome();
    }
}

function goHome() {

    location.href = "./pages/main.html";
}


// ---------- COMMON SEND ----------
async function send(endpoint, body, type = "application/json") {

    try {

        const res = await fetch(`${API_BASE_URL}${endpoint}`, {

            method: "POST",

            headers: { "Content-Type": type },

            body: type === "application/json"
                ? JSON.stringify(body)
                : body
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {

            alert(data?.detail || data?.error || "Failed");

            return null;
        }

        return data;
    }
    catch {

        alert("Server error");

        return null;
    }
}


// ---------- HELPER ----------
function get(id) {

    return document.getElementById(id)?.value.trim();
}
