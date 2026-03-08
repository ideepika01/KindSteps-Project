// Set API base URL depending on environment
const host = window.location.hostname;

const API_BASE_URL =
    host === "localhost" || host === "127.0.0.1"
        ? `http://127.0.0.1:8000`
        : "https://kindsteps-project.vercel.app";