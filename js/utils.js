/*
 * UTILITY FUNCTIONS
 * These are helper functions used across different pages of the website.
 * They help with logging in, logging out, and sending simplified requests to the backend.
 */

// 1. Get the "Access Token" from the browser's storage
// This token is like an ID card that proves you are logged in.
function getAuthToken() {
    return localStorage.getItem('access_token');
}

// 2. Save the "Access Token" to the browser's storage
// We do this after a successful login so the user stays logged in.
function setAuthToken(token) {
    localStorage.setItem('access_token', token);
}

// 3. Log the user out
// We remove the token so the "ID card" is gone, then go back to the login page.
function logout() {
    localStorage.removeItem('access_token');
    window.location.href = '/index.html'; // Go to Login Page
}

// 4. Check if the user is allowed to be here
// If they don't have a token, we kick them back to the login page.
function checkAuth() {
    const token = getAuthToken();
    if (!token) {
        // No token found? Redirect to login.
        window.location.href = '/index.html';
    }
    return token;
}

// 5. Make a request to the backend WITH the token
// This is a wrapper around the standard "fetch" function.
// It automatically adds the "Authorization" header for us.
async function authFetch(url, options = {}) {
    const token = getAuthToken();

    // Create the headers object (information sent with the request)
    const headers = {
        'Authorization': `Bearer ${token}`, // Attach the ID card
        ...options.headers // Add any other headers like Content-Type
    };

    // Send the request
    const response = await fetch(url, {
        ...options, // Include method (GET/POST), body, etc.
        headers: headers // Use our new headers with the token
    });

    // If the server says "401 Unauthorized", it means our token is bad/expired.
    if (response.status === 401) {
        logout(); // Force logout
    }

    return response;
}
