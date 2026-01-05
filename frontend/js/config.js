// CONFIGURATION FOR EXTERNAL SUBMISSION
// Automatically detect if running locally or in production
let API_BASE_URL = "https://kindsteps-project.vercel.app"; // Default to production

if (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost") {
    API_BASE_URL = "http://127.0.0.1:8000";
}
