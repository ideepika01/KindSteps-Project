function getToken() {
    return localStorage.getItem('access_token');
}

function saveToken(token) {
    localStorage.setItem('access_token', token);
}

function logout() {
    localStorage.removeItem('access_token');
    window.location.href = '/index.html'; // Go back to the Login Page
}

function checkLogin() {
    const token = getToken();
    if (!token) {
        // No token found? You are not logged in!
        alert("You must be logged in to view this page.");
        window.location.href = '/index.html';
    }
    return token;
}

async function fetchWithAuth(url, options = {}) {
    // Get the saved token
    const token = getToken();

    const headers = {
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };

    // Send the request to the server
    const response = await fetch(url, {
        ...options,
        headers: headers
    });

    if (response.status === 401) {
        logout(); // Force the user to log in again
    }

    return response;
}
