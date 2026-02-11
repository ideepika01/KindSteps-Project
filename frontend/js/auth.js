// This script handles all the login and signup magic for KindSteps.

document.addEventListener('DOMContentLoaded', () => {
    // We start by finding the login and signup forms on the page
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    // When a user submits a form, we'll handle it right here
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (signupForm) signupForm.addEventListener('submit', handleSignup);
});

// Taking care of the login process
async function handleLogin(event) {
    event.preventDefault(); // Stop the page from reloading

    // Gathering the username and password from the inputs
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    // Making sure both fields are filled in
    if (!email || !password) {
        return alert('Oops! You forgot to enter your email or password.');
    }

    try {
        // We pack the login details into a format the server likes
        const params = new URLSearchParams({
            username: email,
            password: password
        });

        // Sending the login request to our backend
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params
        });

        // First check if the response is actually JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const text = await response.text();
            console.error("Server returned non-JSON response:", text);
            return alert("The server is having a bit of trouble right now (Error 500). Please try again in a few minutes.");
        }

        const data = await response.json();

        if (response.ok) {
            saveToken(data.access_token); // Keeping the login token safe in browser storage
            redirectUserBasedOnRole();    // Sending the user to their specific dashboard
        } else {
            alert(`Login Failed: ${data.detail || 'Check your email and password again.'}`);
        }

    } catch (err) {
        console.error('Login Error:', err);
        alert('We couldn\'t reach the server. Please try again in a moment!');
    }
}

// Handling new account creation
async function handleSignup(event) {
    event.preventDefault();

    // Picking up all the info from the signup form
    const fullName = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const phone = document.getElementById('signup-phone').value;
    const password = document.getElementById('signup-password').value;
    const role = document.querySelector('input[name="role"]:checked')?.value || 'user';

    // Basic check to see if required fields are filled
    if (!fullName || !email || !password) {
        return alert('Please fill in your name, email, and a password to get started.');
    }

    try {
        // Sending the new user data to the server
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ full_name: fullName, email, phone, password, role })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Great news! Your account is ready. You can log in now.');
            window.location.href = '../index.html'; // Sending them back to the sign-in page
        } else {
            alert(`Signup Failed: ${data.detail}`);
        }

    } catch (err) {
        console.error('Signup Error:', err);
        alert('Something went wrong on our end. Please try signing up again later.');
    }
}

// Sending users to the right dashboard after they log in
async function redirectUserBasedOnRole() {
    try {
        // First, we check who is currently logged in
        const response = await fetchWithAuth(`${API_BASE_URL}/auth/me`);

        if (!response.ok) {
            return window.location.href = './pages/main.html';
        }

        const user = await response.json();

        // Sending Admins, Rescue Teams, and Citizens to their own special pages
        if (user.role === 'admin') {
            window.location.href = './pages/admin_control.html';
        } else if (user.role === 'rescue_team') {
            window.location.href = './pages/rescue_team.html';
        } else {
            window.location.href = './pages/main.html';
        }

    } catch (error) {
        window.location.href = './pages/main.html';
    }
}
