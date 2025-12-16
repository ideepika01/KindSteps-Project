/*
 * AUTHENTICATION LOGIC
 * This file handles user Login and Signup (Registration).
 * It listens for button clicks, sends data to the backend, and handles the response.
 */

document.addEventListener('DOMContentLoaded', () => {

    // 1. LOGIN HANDLING
    const loginBtn = document.getElementById('login-btn');

    // Only run this if the Login Button exists on the page
    if (loginBtn) {
        loginBtn.addEventListener('click', async (event) => {
            // Prevent the form from refreshing the page
            event.preventDefault();

            // Get user input
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            // Simple validation: Ensure fields are not empty
            if (!email || !password) {
                alert("Please fill in all fields");
                return; // Stop here
            }

            try {
                // Prepare data for the backend
                // The backend expects data in a specific "form" format for login
                const formData = new URLSearchParams();
                formData.append('username', email); // Backend expects 'username', but we use email
                formData.append('password', password);

                // Send Login Request
                const response = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: formData
                });

                if (response.ok) {
                    // SUCCESS: Login worked!
                    const data = await response.json();

                    // Save the token so we stay logged in
                    setAuthToken(data.access_token);

                    // Now check who we are (User, Admin, or Rescue Team?)
                    checkUserRoleAndRedirect();

                } else {
                    // FAILURE: Login rejected
                    const errorData = await response.json();
                    alert(`Login failed: ${errorData.detail}`);
                }

            } catch (error) {
                // NETWORK ERROR: Server down or internet issue
                console.error("Login error:", error);
                alert("An error occurred during login. Please try again.");
            }
        });
    }

    // 2. SIGNUP HANDLING
    const signupBtn = document.getElementById('signup-btn');

    // Only run this if the Signup Button exists
    if (signupBtn) {
        signupBtn.addEventListener('click', async (event) => {
            event.preventDefault();

            // Get user input
            const fullName = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const phone = document.getElementById('signup-phone').value;
            const password = document.getElementById('signup-password').value;

            // Find which role is selected (User vs Rescue Team)
            // If none selected, default to 'user'
            const roleInput = document.querySelector('input[name="role"]:checked');
            const role = roleInput ? roleInput.value : 'user';

            // Validation
            if (!fullName || !email || !password || !phone) {
                alert("Please fill in all fields");
                return;
            }

            try {
                // Send Signup Request
                const response = await fetch(`${API_BASE_URL}/auth/signup`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json', // We are sending JSON data
                    },
                    body: JSON.stringify({
                        full_name: fullName,
                        email: email,
                        phone: phone,
                        password: password,
                        role: role
                    })
                });

                if (response.ok) {
                    // SUCCESS: Account created
                    alert("Account created successfully! Please login.");
                    window.location.href = '../index.html'; // Go to login page
                } else {
                    // FAILURE
                    const errorData = await response.json();
                    alert(`Signup failed: ${errorData.detail}`);
                }
            } catch (error) {
                console.error("Signup error:", error);
                alert("An error occurred during signup.");
            }
        });
    }
});

/**
 * HELPER: Check User Role & Redirect
 * This helper fetches user details using the new token and sends them to the right dashboard.
 */
async function checkUserRoleAndRedirect() {
    // We use 'authFetch' because this request needs the token!
    const response = await authFetch(`${API_BASE_URL}/auth/me`);

    if (response.ok) {
        const user = await response.json();

        // Decide where to go based on role
        if (user.role === 'admin') {
            window.location.href = './pages/admin_dashboard.html';
        } else if (user.role === 'rescue_team') {
            window.location.href = './pages/report_list.html';
        } else {
            // Regular user
            window.location.href = './pages/main.html';
        }
    } else {
        // If something went wrong, just go to the main user page
        window.location.href = './pages/main.html';
    }
}
