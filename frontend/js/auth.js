document.addEventListener("DOMContentLoaded", init);

function init() {
    document.getElementById("login-form")?.addEventListener("submit", login);
    document.getElementById("signup-form")?.addEventListener("submit", signup);
}


// ---------- LOGIN ----------
async function login(e) {

    e.preventDefault();

    const rawEmail = document.getElementById("login-email")?.value || "";
    const email = rawEmail.trim();
    const password = document.getElementById("login-password")?.value || "";

    // Validation: No whitespace allowed in "username" (email)
    if (rawEmail !== email || email.includes(" ")) {
        return alert("Email should not contain any spaces or whitespace.");
    }

    // Validation: Strict Email Format (no extra special chars except @ and .)
    // Allows alphanumeric, dots, underscores, plus, and hyphens before @
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        return alert("Please enter a valid email address (e.g. user@example.com). Extra special characters are not allowed.");
    }

    if (!email || !password)
        return alert("Enter email and password");

    const btn = document.getElementById("login-btn");
    const originalText = btn.innerHTML;

    // Show Loading
    btn.innerHTML = '<span class="loader"></span>';
    btn.disabled = true;

    try {
        const data = await send("/auth/login",
            new URLSearchParams({ username: email, password }),
            "application/x-www-form-urlencoded"
        );

        if (!data) throw new Error("Login failed");

        saveToken(data.access_token);
        redirectUser();
        // Keep loading state during redirect

    } catch (err) {
        // Reset on error
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}


// ---------- SIGNUP ----------
async function signup(e) {

    e.preventDefault();

    const fullName = get("signup-name");
    const email = get("signup-email");
    const phone = get("signup-phone");
    const password = get("signup-password");
    const role = document.querySelector('input[name="role"]:checked')?.value || "user";

    // Strict Email Validation for Signup too
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        return alert("Invalid email format. Special characters other than @, dot, underscore, and hyphen are not permitted.");
    }

    // Full Name whitespace validation
    if (!fullName || fullName.trim().split(" ").length < 1) {
        return alert("Please enter your full name.");
    }

    // Password Strength
    if (!password || password.length < 6) {
        return alert("Password must be at least 6 characters long.");
    }

    // Phone Validation (basic 10 digit check)
    const phoneRegex = /^[0-9]{10}$/;
    if (phone && !phoneRegex.test(phone)) {
        return alert("Please enter a valid 10-digit phone number without spaces or symbols.");
    }

    const data = await send("/auth/signup", {
        full_name: fullName,
        email: email,
        phone: phone,
        password: password,
        role: role
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
