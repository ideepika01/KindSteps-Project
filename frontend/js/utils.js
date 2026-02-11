// This file holds all the little helpers we use across the whole app.

// Getting the login token from the user's browser storage
function getToken() {
    return localStorage.getItem('access_token');
}

// Saving the secret token so the user stays signed in
function saveToken(token) {
    localStorage.setItem('access_token', token);
}

// Say goodbye: clearing the session and heading home
function logout() {
    localStorage.removeItem('access_token');
    window.location.href = '../index.html';
}

// Checking if the user is logged in. If not, we kindly ask them to sign in.
function checkLogin() {
    const token = getToken();

    if (!token) {
        alert('Hold on! You need to sign in to see this page.');
        window.location.href = '../index.html';
        return null;
    }
    return token;
}

// A special tool that fetches data and carries our login key for us automatically
async function fetchWithAuth(url, options = {}) {
    const token = getToken();

    // Adding the 'authorization' stamp to our request envelope
    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };

    // Sending the request out
    const response = await fetch(url, { ...options, headers });

    // If the server doesn't recognize our key anymore, we'll log out to keep things safe.
    if (response.status === 401) {
        logout();
    }

    return response;
}

// Updating the navbar links based on who is logged in (Admin, Team, or Citizen)
async function setupDynamicNavbar() {
    const token = getToken();
    if (!token) return;

    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/auth/me`);
        if (!response.ok) return;

        const user = await response.json();
        const dashboardUrl = getDashboardUrl(user.role);

        // Making sure the "Home" and Logo links send you to your specific dashboard
        document.querySelectorAll('.logo, .brand, .nav-links a').forEach(link => {
            const text = link.textContent.toLowerCase();
            if (text === 'home' || link.classList.contains('logo')) {
                link.href = dashboardUrl;
            }
        });

    } catch (err) {
        console.warn('Skipping navbar update for now.');
    }
}

// Figuring out which dashboard page belongs to which role
function getDashboardUrl(role) {
    const inPages = window.location.pathname.includes('/pages/');
    const p = inPages ? './' : './pages/';

    if (role === 'admin') return p + 'admin_control.html';
    if (role === 'rescue_team') return p + 'rescue_team.html';
    return p + 'main.html';
}

// Running the navbar setup as soon as the page is ready
document.addEventListener('DOMContentLoaded', setupDynamicNavbar);

// Initialize navbar automatically when the page loads
document.addEventListener('DOMContentLoaded', setupDynamicNavbar);
