// ---------------- TOKEN HELPERS ----------------

// Get token from browser storage
function getToken() {
    return localStorage.getItem('access_token');
}

// Save token after login
function saveToken(token) {
    localStorage.setItem('access_token', token);
}

// Remove token and send user to login page
function logout() {
    localStorage.removeItem('access_token');
    window.location.href = '/index.html';
}


// ---------------- LOGIN CHECK ----------------

// Used on protected pages
function checkLogin() {
    const token = getToken();

    if (!token) {
        alert('You must be logged in to view this page.');
        window.location.href = '/index.html';
        return null;
    }

    return token;
}


// ---------------- AUTH FETCH ----------------

// Automatically adds token to API requests
async function fetchWithAuth(url, options = {}) {
    const token = getToken();

    const headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`
    };

    const response = await fetch(url, {
        ...options,
        headers
    });

    // Token expired or invalid
    if (response.status === 401) {
        logout();
    }

    return response;
}


// ---------------- DYNAMIC NAVBAR ----------------

async function setupDynamicNavbar() {
    const token = getToken();
    if (!token) return;

    try {
        // We use a simple cache or just fetch it. Fetching is safer.
        const response = await fetchWithAuth(`${typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'http://localhost:8000'}/auth/me`);
        if (!response.ok) return;

        const user = await response.json();

        // Update Brand/Logo links
        const logoLinks = document.querySelectorAll('.logo, .brand');
        logoLinks.forEach(link => {
            if (link.tagName === 'A') {
                link.href = getDashboardUrl(user.role);
            }
        });

        // Update Nav "Home" or "Dashboard" links
        const navLinks = document.querySelectorAll('.nav-links a, .nav-links li a');
        navLinks.forEach(link => {
            if (link.textContent.toLowerCase() === 'home' || link.textContent.toLowerCase() === 'dashboard') {
                link.href = getDashboardUrl(user.role);
            }
        });

    } catch (error) {
        console.error('Error setting up dynamic navbar:', error);
    }
}

function getDashboardUrl(role) {
    const isInsidePages = window.location.pathname.includes('/pages/');
    const prefix = isInsidePages ? './' : './pages/';

    // If we're already in pages, some links might need ../ if they aren't in same dir
    // But for simplicity, let's assume all main dashboards are in /pages/

    if (role === 'admin') return prefix + 'admin_control.html';
    if (role === 'rescue_team') return prefix + 'rescue_team.html';
    return prefix + 'main.html';
}

// Auto-run if possible or let pages call it
document.addEventListener('DOMContentLoaded', setupDynamicNavbar);
