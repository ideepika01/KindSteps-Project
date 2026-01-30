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
