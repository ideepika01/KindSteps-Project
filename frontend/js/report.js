// Initialize incident reporting features
document.addEventListener("DOMContentLoaded", () => {
  checkLogin(); // Ensure the user is authenticated
  setupPhotoPreview(); // Handle image upload preview
  setupCamera(); // Enable camera capture
  setupAIScan(); // AI-powered description helper
  setupFormSubmit(); // Handle final report submission
  setupMap(); // Initialize location picker
});

// --- IMAGE UPLOAD ---

// Update UI when a photo is selected
function setupPhotoPreview() {
  const input = document.getElementById("report-photo"), content = document.querySelector(".upload-content");
  if (!input || !content) return;

  input.onchange = () => {
    const file = input.files[0];
    content.innerHTML = file ? `<b>Selected:</b> ${file.name}` : "Click to upload";
    const ai = document.getElementById("ai-scan-container");
    if (ai) ai.style.display = file ? "block" : "none";
  };
}

// --- CAMERA HELPER ---

// Manage the camera stream and frame capture
function setupCamera() {
  const startBtn = document.getElementById("start-camera-btn"), video = document.getElementById("camera-feed");
  const canvas = document.getElementById("camera-canvas"), input = document.getElementById("report-photo");
  const container = document.getElementById("camera-container"), stopBtn = document.getElementById("stop-camera-btn");
  const captureBtn = document.getElementById("capture-btn");
  if (!startBtn || !video || !canvas || !input) return;

  let stream = null;

  startBtn.onclick = async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      video.srcObject = stream;
      container.style.display = "block";
      startBtn.style.display = "none";
    } catch (err) { alert("Camera access denied."); }
  };

  const stop = () => {
    if (stream) stream.getTracks().forEach(t => t.stop());
    stream = null; container.style.display = "none"; startBtn.style.display = "flex";
  };
  stopBtn.onclick = stop;

  captureBtn.onclick = () => {
    if (!stream) return;
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      const file = new File([blob], `capture_${Date.now()}.jpg`, { type: "image/jpeg" });
      const dt = new DataTransfer(); dt.items.add(file); input.files = dt.files;
      input.dispatchEvent(new Event("change"));
      stop();
    }, "image/jpeg");
  };
}

// --- AI INTELLIGENCE ---

// Call the AI to automatically analyze the scene
function setupAIScan() {
  const btn = document.getElementById("ai-scan-btn"), status = document.getElementById("ai-status");
  if (!btn) return;

  btn.onclick = async () => {
    const photo = document.getElementById("report-photo").files[0];
    if (!photo) { status.innerText = "Please select a photo first."; status.style.color = "#ef4444"; return; }

    btn.disabled = true;
    status.innerText = "AI is analyzing... please wait."; status.style.color = "#666";
    status.style.display = "block";

    try {
      const form = new FormData(); form.append("photo", photo);
      const res = await fetchWithAuth(`${API_BASE_URL}/reports/ai-analyze`, { method: "POST", body: form });
      if (!res.ok) throw new Error("Analysis failed");

      const data = await res.json();
      if (data.description) document.getElementById("report-description").value = data.description;

      const adviceCard = document.getElementById("ai-compassion-card"), adviceList = document.getElementById("ai-advice-list");
      if (data.advice && adviceCard) {
        adviceList.innerHTML = data.advice.map(i => `<li>${i}</li>`).join("");
        adviceCard.style.display = "block";
      }
      status.style.display = "none";
    } catch (e) { status.innerText = "AI Service temporarily unavailable."; status.style.color = "#ef4444"; }
    btn.disabled = false;
  };
}

// --- INCIDENT SUBMISSION ---

// Validate and send the rescue report to the backend
function setupFormSubmit() {
  const btn = document.getElementById("submit-report-btn");
  if (!btn) return;

  btn.onclick = async (e) => {
    e.preventDefault();
    const errorBox = document.getElementById("form-error-msg");
    const showError = (msg) => { errorBox.innerText = msg; errorBox.style.display = "block"; errorBox.scrollIntoView({ behavior: "smooth", block: "center" }); };
    if (errorBox) errorBox.style.display = "none";

    // Gather required fields
    const photo = document.getElementById("report-photo").files[0];
    const condition = document.getElementById("report-condition").value;
    const desc = document.getElementById("report-description").value.trim();
    const locName = document.getElementById("report-location").value.trim();
    const contactName = document.getElementById("contact-name").value.trim();
    const contactPhone = document.getElementById("contact-phone").value.trim();
    const lat = document.getElementById("report-lat").value;
    const lng = document.getElementById("report-lng").value;

    // Perform validation
    if (!photo) return showError("Please upload or capture a photo.");
    if (!condition) return showError("Please select the individual's condition.");
    if (desc.length < 15) return showError("Description too short (need 15 chars).");
    if (!locName) return showError("Please specify a landmark or street address.");
    if (!contactName) return showError("Please enter your name.");
    if (!/^[0-9]{10}$/.test(contactPhone)) return showError("Please enter a valid 10-digit phone number.");
    if (!lat || lat === "0") return showError("Please pin the location on the map.");

    // Prepare data for the API
    const form = new FormData();
    form.append("condition", condition);
    form.append("description", desc);
    form.append("location", locName);
    form.append("contact_name", contactName);
    form.append("contact_phone", contactPhone);
    form.append("latitude", lat);
    form.append("longitude", lng);
    form.append("photo", photo);

    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/reports/`, { method: "POST", body: form });
      if (res.ok) window.location.href = "./my_reports.html";
      else showError("Submission failed. Please check your connection.");
    } catch (err) { showError("Server connection error."); }
  };
}

// --- LOCATION PICKER ---

// Setup the Leaflet map for precise incident location tagging
function setupMap() {
  const div = document.getElementById("report-map");
  if (!div) return;

  let marker;
  const map = L.map(div).setView([13.0827, 80.2707], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

  const updatePos = (p) => {
    const lat = p.lat || p.latitude, lng = p.lng || p.longitude;
    if (!marker) {
      marker = L.marker([lat, lng], { draggable: true }).addTo(map);
      marker.on("dragend", () => updatePos(marker.getLatLng()));
    } else marker.setLatLng([lat, lng]);
    document.getElementById("report-lat").value = lat;
    document.getElementById("report-lng").value = lng;
  };

  map.on("click", (e) => updatePos(e.latlng));
  navigator.geolocation?.getCurrentPosition((pos) => updatePos(pos.coords));
}
