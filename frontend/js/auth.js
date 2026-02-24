// start when page loads
document.addEventListener("DOMContentLoaded", () => {
    bind("login-form", login);
    bind("signup-form", signup);
});


// login user
async function login(e) {

    e.preventDefault();

    const email = val("login-email");
    const password = val("login-password");

    if (!validEmail(email)) return alert("Invalid email");
    if (!password) return alert("Enter password");

    const btn = document.getElementById("login-btn");
    setLoading(btn, true);

    const data = await send(
        "/auth/login",
        new URLSearchParams({ username: email, password }),
        "application/x-www-form-urlencoded"
    );

    if (!data) return setLoading(btn, false);

    saveToken(data.access_token);

    redirectUser();
}



// signup user
async function signup(e) {

    e.preventDefault();

    const full_name = val("signup-name");
    const email = val("signup-email");
    const phone = val("signup-phone");
    const password = val("signup-password");

    const role =
        document.querySelector('input[name="role"]:checked')?.value || "user";


    if (!full_name) return alert("Enter name");

    if (!validEmail(email)) return alert("Invalid email");

    if (!password || password.length < 6)
        return alert("Password too short");

    if (phone && !/^[0-9]{10}$/.test(phone))
        return alert("Invalid phone");


    const data = await send("/auth/signup", {
        full_name,
        email,
        phone,
        password,
        role
    });


    if (!data) return;

    alert("Account created");

    location.href = "../index.html";
}



// redirect based on role
async function redirectUser() {

    try {

        const res = await fetchWithAuth(`${API_BASE_URL}/auth/me`);

        if (!res.ok) return goHome();

        const user = await res.json();

        if (user.role === "admin")
            location.href = "./pages/admin_control.html";

        else if (user.role === "rescue_team")
            location.href = "./pages/rescue_team.html";

        else
            goHome();

    }
    catch {

        goHome();

    }
}



// default home
function goHome() {

    location.href = "./pages/main.html";

}



// send post request
async function send(url, body, type = "application/json") {

    try {

        const res = await fetch(`${API_BASE_URL}${url}`, {

            method: "POST",

            headers: { "Content-Type": type },

            body:
                type === "application/json"
                    ? JSON.stringify(body)
                    : body

        });


        const data = await res.json().catch(() => null);


        if (!res.ok) {

            alert(data?.detail || "Failed");

            return null;

        }


        return data;

    }
    catch {

        alert("Server error");

        return null;

    }

}



// helpers

function val(id) {
    return document.getElementById(id)?.value.trim();
}

function bind(id, fn) {
    document.getElementById(id)?.addEventListener("submit", fn);
}

function validEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setLoading(btn, state) {

    if (!btn) return;

    btn.disabled = state;

    btn.innerHTML = state
        ? '<span class="loader"></span>'
        : "Login";

}