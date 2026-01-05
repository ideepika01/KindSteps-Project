// This script handles Login and Signup functionality.
// It listens for clicks on the login/signup buttons, sends data to the backend,
// and saves the received access token to keep the user logged in.

document.addEventListener('DOMContentLoaded', () => {

    // --- LOGIN LOGIC ---
    const loginButton = document.getElementById('login-btn');

    if (loginButton) {
        loginButton.addEventListener('click', async (event) => {
            // Prevent the form from submitting normally (reloading the page)
            event.preventDefault();

            // 1. Get the values the user typed in
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            // 2. Simple validation: Ensure fields aren't empty
            if (!email || !password) {
                alert("Please fill in all fields");
                return;
            }

            try {
                // 3. Prepare the data to send (OAuth2 expects form data, not JSON)
                const formData = new URLSearchParams();
                formData.append('username', email); // The backend expects 'username' for the email field
                formData.append('password', password);

                // 4. Send the POST request to the Login API
                const response = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: formData
                });

                // 5. Check if login was successful
                if (response.ok) {
                    const data = await response.json();

                    // Save the "Access Token" so the browser remembers the user
                    saveToken(data.access_token);

                    // Send the user to the correct page (Admin vs. User vs. Rescue Team)
                    redirectUserBasedOnRole();

                } else {
                    // Login failed (e.g., wrong password)
                    const errorText = await response.text();
                    let errorMessage = "Unknown error";
                    try {
                        const errorData = JSON.parse(errorText);
                        errorMessage = errorData.detail || errorText;
                    } catch (e) {
                        errorMessage = errorText; // Use raw text if not JSON
                    }
                    alert(`Login failed: ${errorMessage}`);
                }

            } catch (error) {
                console.error("Login error:", error);
                alert(`Network or Server Error: ${error.message}`);
            }
        });
    }

    // --- SIGNUP LOGIC ---
    const signupButton = document.getElementById('signup-btn');

    if (signupButton) {
        signupButton.addEventListener('click', async (event) => {
            event.preventDefault(); // Stop page reload

            // 1. Get input values
            const fullName = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const phone = document.getElementById('signup-phone').value;
            const password = document.getElementById('signup-password').value;

            // Get selected role (User, Rescue Team, etc.)
            const roleInput = document.querySelector('input[name="role"]:checked');
            const role = roleInput ? roleInput.value : 'user';

            // 2. Validate inputs
            if (!fullName || !email || !password || !phone) {
                alert("Please fill in all fields");
                return;
            }

            try {
                // 3. Send POST request to Signup API
                const response = await fetch(`${API_BASE_URL}/auth/signup`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json', // We send JSON for signup
                    },
                    body: JSON.stringify({
                        full_name: fullName,
                        email: email,
                        phone: phone,
                        password: password,
                        role: role
                    })
                });

                // 4. Handle success or failure
                if (response.ok) {
                    alert("Account created! Please login.");
                    window.location.href = '../index.html'; // Redirect to login page
                } else {
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
 * Checks the user's role (Admin, Rescue Team, or User) and redirects them
 * to their specific dashboard.
 */
async function redirectUserBasedOnRole() {
    // We use 'fetchWithAuth' helper to send the token with the request
    const response = await fetchWithAuth(`${API_BASE_URL}/auth/me`);

    if (response.ok) {
        const user = await response.json();

        // Redirect based on the 'role' field from the database
        if (user.role === 'admin') {
            window.location.href = './pages/admin_dashboard.html';
        } else if (user.role === 'rescue_team') {
            window.location.href = './pages/report_list.html';
        } else {
            // Standard user
            window.location.href = './pages/main.html';
        }
    } else {
        // If getting user info fails, default to main page
        window.location.href = './pages/main.html';
    }
}
