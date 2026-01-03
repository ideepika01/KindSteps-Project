// Automatically detect if we are running locally or in production
const API_BASE_URL = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost"
    ? "http://127.0.0.1:8000"
    : "https://kindstepsbackend.vercel.app"; // Backend deployed on Vercel
