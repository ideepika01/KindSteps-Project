// Run only after page loads
document.addEventListener('DOMContentLoaded', function () {

    const loginForm = document.getElementById('login-form');
    const signupBtn = document.getElementById('signup-btn');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (signupBtn) {
        signupBtn.addEventListener('click', handleSignup);
    }
});


// ---------------- LOGIN ----------------

async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        alert('Please fill in all fields');
        return;
    }

    try {
        const response = await loginUser(email, password);

        if (response.ok) {
            const data = await response.json();
            saveToken(data.access_token);
            await redirectUserBasedOnRole();
        } else {
            showLoginError(response);
        }

    } catch (error) {
        alert('Something went wrong during login');
        console.error(error);
    }
}

function loginUser(email, password) {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    return fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
    });
}

async function showLoginError(response) {
    const text = await response.text();

    try {
        const json = JSON.parse(text);
        alert(`Login failed: ${json.detail}`);
    } catch {
        alert(`Login failed: ${text}`);
    }
}


// ---------------- SIGNUP ----------------

async function handleSignup(event) {
    event.preventDefault();

    const fullName = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const phone = document.getElementById('signup-phone').value;
    const password = document.getElementById('signup-password').value;

    const role =
        document.querySelector('input[name="role"]:checked')?.value || 'user';

    if (!fullName || !email || !phone || !password) {
        alert('Please fill in all fields');
        return;
    }

    try {
        const response = await signupUser({
            full_name: fullName,
            email,
            phone,
            password,
            role
        });

        if (response.ok) {
            alert('Account created! Please login.');
            window.location.href = '../index.html';
        } else {
            const error = await response.json();
            alert(`Signup failed: ${error.detail}`);
        }

    } catch (error) {
        alert('Something went wrong during signup');
        console.error(error);
    }
}

function signupUser(userData) {
    return fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    });
}


// ---------------- ROLE BASED REDIRECT ----------------

async function redirectUserBasedOnRole() {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/auth/me`);

        if (!response.ok) {
            goToMainPage();
            return;
        }

        const user = await response.json();

        if (user.role === 'admin') {
            window.location.href = './pages/admin_control.html';
        } else if (user.role === 'rescue_team') {
            window.location.href = './pages/rescue_team.html';
        } else {
            goToMainPage();
        }

    } catch {
        goToMainPage();
    }
}

function goToMainPage() {
    window.location.href = './pages/main.html';
}
