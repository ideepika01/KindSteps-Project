document.addEventListener("DOMContentLoaded", () => {
  checkLogin();

  photoPreview();

  cameraInit();

  aiScan();

  formSubmit();

  mapInit();
});

// -------- PHOTO --------

function photoPreview() {
  const input = document.getElementById("report-photo");

  const box = document.querySelector(".upload-box");

  const content = document.querySelector(".upload-content");

  const ai = document.getElementById("ai-scan-container");

  if (!input || !box) return;

  box.onclick = () => input.click();

  input.onchange = () => {
    const file = input.files[0];

    content.innerHTML = file ? `Selected: ${file.name}` : "Click to upload";

    if (ai) ai.style.display = file ? "block" : "none";
  };
}

// -------- CAMERA --------

function cameraInit() {
  const startBtn = document.getElementById("start-camera-btn");
  const stopBtn = document.getElementById("stop-camera-btn");
  const captureBtn = document.getElementById("capture-btn");
  const cameraContainer = document.getElementById("camera-container");
  const video = document.getElementById("camera-feed");
  const canvas = document.getElementById("camera-canvas");
  const input = document.getElementById("report-photo");

  if (!startBtn || !cameraContainer || !video || !canvas || !input) return;

  let stream = null;

  startBtn.onclick = async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      video.srcObject = stream;
      cameraContainer.style.display = "block";
      startBtn.style.display = "none";
    } catch (err) {
      alert("Camera access denied or not available.");
      console.error(err);
    }
  };

  stopBtn.onclick = () => stopCamera();

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }
    cameraContainer.style.display = "none";
    startBtn.style.display = "flex";
  }

  captureBtn.onclick = () => {
    if (!stream) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob/file
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `capture_${Date.now()}.jpg`, {
        type: "image/jpeg",
      });

      // Create DataTransfer to simulate user selection
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;

      // Trigger change event so photoPreview picks it up
      input.dispatchEvent(new Event("change"));

      stopCamera();
    }, "image/jpeg");
  };
}

// -------- AI --------

function aiScan() {
  const btn = document.getElementById("ai-scan-btn");

  const statusObj = document.getElementById("ai-status");

  if (!btn) return;

  btn.onclick = async () => {
    const photo = document.getElementById("report-photo").files[0];

    if (!photo) return alert("Select photo");

    const form = new FormData();

    form.append("photo", photo);

    btn.disabled = true;

    if (statusObj) statusObj.style.display = "block";

    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/reports/ai-analyze`, {
        method: "POST",

        body: form,
      });

      if (!res.ok) {
        const err = await res.json();
        alert(`AI Analysis Failed: ${err.detail || res.statusText}`);
        return;
      }

      const data = await res.json();

      if (data.description)
        document.getElementById("report-description").value = data.description;
    } catch (e) {
      console.error(e);
      alert(`AI Connection Error: ${e.message}`);
    }

    btn.disabled = false;

    if (statusObj) statusObj.style.display = "none";
  };
}

// -------- SUBMIT --------

function formSubmit() {
  const btn = document.getElementById("submit-report-btn");

  if (!btn) return;

  btn.onclick = async (e) => {
    e.preventDefault();

    const form = new FormData();

    const fields = {
      "report-condition": "condition",
      "report-description": "description",
      "report-location": "location",
      "location_details": "location_details",
      "contact-name": "contact_name",
      "contact-phone": "contact_phone",
      "report-lat": "latitude",
      "report-lng": "longitude"
    };

    for (const [id, apiField] of Object.entries(fields)) {
      const val = document.getElementById(id)?.value;
      // Append even if empty string so backend validation catches it properly
      if (val !== undefined && val !== null) form.append(apiField, val);
    }

    const photo = document.getElementById("report-photo").files[0];

    if (photo) form.append("photo", photo);

    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/reports/`, {
        method: "POST",

        body: form,
      });

      if (res.ok) {
        location.href = "./my_reports.html";
      } else {
        // Try to get error message from server
        try {
          const errorData = await res.json();
          alert(`Submit failed:\n${formatError(errorData)}`);
        } catch (e) {
          alert(`Submit failed: ${res.statusText}`);
        }
      }
    } catch (err) {
      console.error(err);
      alert(`Server connection error: ${err.message}`);
    }
  };
}

// Helper to format validation errors
function formatError(data) {
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.detail)) {
    return data.detail.map(e => `${e.loc.join(".")} : ${e.msg}`).join("\n");
  }
  return JSON.stringify(data);
}

// -------- MAP --------

function mapInit() {
  const div = document.getElementById("report-map");

  if (!div) return;

  let marker;

  const map = L.map(div).setView([13.0827, 80.2707], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

  map.onclick = (e) => set(e.latlng);

  navigator.geolocation?.getCurrentPosition((pos) => set(pos.coords));

  function set(p) {
    const lat = p.lat || p.latitude;

    const lng = p.lng || p.longitude;

    if (!marker) marker = L.marker([lat, lng], { draggable: true }).addTo(map);
    else marker.setLatLng([lat, lng]);

    document.getElementById("report-lat").value = lat;

    document.getElementById("report-lng").value = lng;
  }
}
