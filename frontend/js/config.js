// set api base url
const host = window.location.hostname;

let API_BASE_URL;

// use local backend if running locally
if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    /^(\d+\.){3}\d+$/.test(host)
) {
    API_BASE_URL = `http://${host}:8000`;
}
else {
    API_BASE_URL = "https://kindsteps-project.vercel.app";
}