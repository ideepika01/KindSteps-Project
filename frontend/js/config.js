const API_BASE_URL = (function () {
    const host = window.location.hostname;
    // If we're on localhost/127.0.0.1 or an IP address (likely local network testing)
    if (host === "localhost" || host === "127.0.0.1" || /^(\d+\.){3}\d+$/.test(host)) {
        return `http://${host}:8000`;
    }
    // Production URL fallback
    return "https://kindsteps-project.vercel.app"; // Assuming this is the prod URL mentioned in main.py
})();
