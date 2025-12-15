
document.addEventListener('DOMContentLoaded', () => {

    // --- LOGIN LOGIC ---
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            if (!email || !password) {
                alert("Please fill in all fields");
                return;
            }

            try {
                // This username field depends on backend OAuth2PasswordRequestForm
                // which expects x-www-form-urlencoded 'username' and 'password'
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
                    setAuthToken(data.access_token);

                    // Fetch user details to check role
                    const userResponse = await authFetch(`${API_BASE_URL}/auth/me`);
                    if (userResponse.ok) {
                        const userData = await userResponse.json();
                        // Redirect based on role
                        if (userData.role === 'admin') {
                            window.location.href = './pages/admin_dashboard.html';
                        } else if (userData.role === 'rescue_team') {
                            window.location.href = './pages/report_list.html';
                        } else {
                            window.location.href = './pages/main.html';
                        }
                    } else {
                        // Fallback if /me fails
                        window.location.href = './pages/main.html';
                    }

                } else {
                    const err = await response.json();
                    alert(`Login failed: ${err.detail}`);
                }
            } catch (error) {
                console.error("Login error:", error);
                alert("An error occurred during login.");
            }
        });
    }

    // --- SIGNUP LOGIC ---
    const signupBtn = document.getElementById('signup-btn');
    if (signupBtn) {
        signupBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            const fullName = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const phone = document.getElementById('signup-phone').value;
            const password = document.getElementById('signup-password').value;

            // Get selected role
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
                    alert("Account created successfully! Please login.");
                    window.location.href = '../index.html';
                } else {
                    const err = await response.json();
                    alert(`Signup failed: ${err.detail}`);
                }
            } catch (error) {
                console.error("Signup error:", error);
                alert("An error occurred during signup.");
            }
        });
    }
});
