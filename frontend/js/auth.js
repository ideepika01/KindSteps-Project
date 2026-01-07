document.addEventListener('DOMContentLoaded', () => {

    const loginButton = document.getElementById('login-btn');
    if (loginButton) {
        loginButton.addEventListener('click', async (event) => {
            event.preventDefault();

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
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: formData
                });

                if (response.ok) {
                    const data = await response.json();
                    saveToken(data.access_token);
                    await redirectUserBasedOnRole();
                } else {
                    const errorText = await response.text();
                    let msg = errorText;
                    try { msg = JSON.parse(errorText).detail || msg; } catch (e) { }
                    alert(`Login failed: ${msg}`);
                }

            } catch (error) {
                console.error("Login error:", error);
                alert(`Error: ${error.message}`);
            }
        });
    }

    const signupButton = document.getElementById('signup-btn');
    if (signupButton) {
        signupButton.addEventListener('click', async (event) => {
            event.preventDefault();

            const fullName = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const phone = document.getElementById('signup-phone').value;
            const password = document.getElementById('signup-password').value;

            const roleInput = document.querySelector('input[name="role"]:checked');
            const role = roleInput ? roleInput.value : 'user';

            if (!fullName || !email || !password || !phone) {
                alert("Please fill in all fields");
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/auth/signup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
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
                    window.location.href = '../index.html';
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

async function redirectUserBasedOnRole() {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/auth/me`);
        if (response.ok) {
            const user = await response.json();

            if (user.role === 'admin') {
                window.location.href = './pages/admin_dashboard.html';
            } else if (user.role === 'rescue_team') {
                window.location.href = './pages/report_list.html';
            } else {
                window.location.href = './pages/main.html';
            }
        } else {
            window.location.href = './pages/main.html';
        }
    } catch (e) {
        window.location.href = './pages/main.html';
    }
}
