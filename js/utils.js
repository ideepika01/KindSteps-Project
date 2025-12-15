
// Helper to get the token
function getAuthToken() {
    return localStorage.getItem('access_token');
}

// Helper to save the token
function setAuthToken(token) {
    localStorage.setItem('access_token', token);
}

// Helper to remove the token (logout)
function logout() {
    localStorage.removeItem('access_token');
    window.location.href = '/index.html'; // Redirect to login
}

// Helper to check if logged in
function checkAuth() {
    const token = getAuthToken();
    if (!token) {
        window.location.href = '/index.html';
    }
    return token;
}

// Helper for making authenticated requests
async function authFetch(url, options = {}) {
    const token = getAuthToken();
    const headers = {
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };

    const response = await fetch(url, {
        ...options,
        headers
    });

    if (response.status === 401) {
        // Token expired or invalid
        logout();
    }

    return response;
}
