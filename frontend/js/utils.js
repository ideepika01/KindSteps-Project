function getToken() {
    return localStorage.getItem('access_token');
}

function saveToken(token) {
    localStorage.setItem('access_token', token);
}

function logout() {
    localStorage.removeItem('access_token');
    window.location.href = '/index.html';
}

function checkLogin() {
    const token = getToken();
    if (!token) {
        alert("You must be logged in to view this page.");
        window.location.href = '/index.html';
    }
    return token;
}

async function fetchWithAuth(url, options = {}) {
    const token = getToken();
    const headers = {
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };

    const response = await fetch(url, {
        ...options,
        headers: headers
    });

    if (response.status === 401) {
        logout();
    }

    return response;
}
