// Run when page loads
document.addEventListener("DOMContentLoaded", () => {
    bind("login-form", login);
    bind("signup-form", signup);
});


// ---------- LOGIN ----------
async function login(e) {
    e.preventDefault();

    const email = val("login-email");
    const password = val("login-password");

    if (!validEmail(email)) return alert("Invalid email");
    if (!password) return alert("Enter password");

    const btn = document.getElementById("login-btn");
    setLoading(btn, true);

    try {
        const data = await send(
            "/auth/login",
            new URLSearchParams({ username: email, password }),
            "application/x-www-form-urlencoded"
        );

        if (!data) {
            setLoading(btn, false);
            return;
        }

        saveToken(data.access_token);
        
        if (data.user) {
            localStorage.setItem("user_role", data.user.role);
            handleRedirect(data.user);
        } else {
            await redirectUser();
        }
    } catch (error) {
        console.error("Login process error:", error);
        setLoading(btn, false);
        alert("Something went wrong during login.");
    }
}


// ---------- SIGNUP ----------
async function signup(e) {

    e.preventDefault();

    const full_name = val("signup-name");
    const email = val("signup-email");
    const phone = val("signup-phone");
    const password = val("signup-password");

    const role = document.querySelector('input[name="role"]:checked')?.value || "user";

    if (!full_name) return alert("Enter name");
    if (!validEmail(email)) return alert("Invalid email");
    if (!password || password.length < 6) return alert("Password too short");
    if (phone && !/^[0-9]{10}$/.test(phone)) return alert("Invalid phone");

    const data = await send("/auth/signup", { full_name, email, phone, password, role });

    if (!data) return;

    alert("Account created");
    location.href = getRedirectPath("index.html");
}


// ---------- REDIRECT BASED ON ROLE ----------
async function redirectUser() {
    try {
        const res = await fetchWithAuth(`${API_BASE_URL}/auth/me`);
        if (!res.ok) return goHome();

        const user = await res.json();
        localStorage.setItem("user_role", user.role);
        handleRedirect(user);
    } catch {
        goHome();
    }
}

function handleRedirect(user) {
    if (user.role === "admin")
        location.href = getRedirectPath("admin_control.html");
    else if (user.role === "rescue_team")
        location.href = getRedirectPath("rescue_team.html");
    else
        goHome();
}


// Default home page
function goHome() {
    location.href = getRedirectPath("main.html");
}


// ---------- API REQUEST ----------
async function send(url, body, type = "application/json") {

    try {

        const res = await fetch(`${API_BASE_URL}${url}`, {
            method: "POST",
            headers: { "Content-Type": type },
            body: type === "application/json" ? JSON.stringify(body) : body
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
            alert(data?.detail || "Request failed");
            return null;
        }

        return data;

    } catch {
        alert("Server error");
        return null;
    }
}


// ---------- HELPERS ----------

// Get input value
function val(id) {
    return document.getElementById(id)?.value.trim();
}

// Bind form submit
function bind(id, fn) {
    document.getElementById(id)?.addEventListener("submit", fn);
}

// Basic email validation
function validEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Show loading spinner on button
function setLoading(btn, state) {

    if (!btn) return;

    btn.disabled = state;
    btn.innerHTML = state
        ? '<span class="loader"></span>'
        : "Login";
}