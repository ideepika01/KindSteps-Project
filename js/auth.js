document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('login-btn');

    if (loginButton) {
        loginButton.addEventListener('click', async (event) => {
            // STOP the page from reloading (default form behavior)
            event.preventDefault();

            // Get what the user typed
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            if (!email || !password) {
                alert("Please fill in all fields");
                return;
            }

            try {
                const formData = new URLSearchParams();
                formData.append('username', email);
                formData.append('password', password);

                const response = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: formData
                });

                if (response.ok) {
                    const data = await response.json();
                    saveToken(data.access_token);
                    redirectUserBasedOnRole();

                } else {
                    // FAILURE: Wrong password or email
                    const errorData = await response.json();
                    alert(`Login failed: ${errorData.detail}`);
                }

            } catch (error) {
                console.error("Login error:", error);
                alert("An error occurred. Please try again.");
            }
        });
    }

    const signupButton = document.getElementById('signup-btn');

    if (signupButton) {
        signupButton.addEventListener('click', async (event) => {
            event.preventDefault(); // Stop reload

            // Get all inputs
            const fullName = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const phone = document.getElementById('signup-phone').value;
            const password = document.getElementById('signup-password').value;

            // Check which role they chose
            const roleInput = document.querySelector('input[name="role"]:checked');
            const role = roleInput ? roleInput.value : 'user';

            if (!fullName || !email || !password || !phone) {
                alert("Please fill in all fields");
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/auth/signup`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
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
                    alert("Account created! Please login.");
                    window.location.href = '../index.html'; // Go to login page
                } else {
                    const errorData = await response.json();
                    // .detail often contains the specific error message from the server
                    alert(`Signup failed: ${errorData.detail}`);
                }
            } catch (error) {
                console.error("Signup error:", error);
                alert("An error occurred during signup.");
            }
        });
    }
});

async function redirectUserBasedOnRole() {
    // We use 'fetchWithAuth' because we need to show our new token
    const response = await fetchWithAuth(`${API_BASE_URL}/auth/me`);

    if (response.ok) {
        const user = await response.json();

        if (user.role === 'admin') {
            window.location.href = './pages/admin_dashboard.html';
        } else if (user.role === 'rescue_team') {
            window.location.href = './pages/report_list.html';
        } else {
            // Regular user
            window.location.href = './pages/main.html';
        }
    } else {
        // Fallback if something weird happens
        window.location.href = './pages/main.html';
    }
}
