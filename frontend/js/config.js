const API_BASE_URL =
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.hostname === ""
        ? "http://127.0.0.1:8000"
        : "https://kindsteps-project.vercel.app";
