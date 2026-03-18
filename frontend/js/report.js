// Initialize report page
document.addEventListener("DOMContentLoaded", () => {
  checkLogin();
  setupPhotoPreview();
  // setupCamera();
  setupAIScan();
  setupFormSubmit();
  setupMap();
});


// ---------- PHOTO PREVIEW ----------
function setupPhotoPreview() {
  const input = document.getElementById("report-photo");
  const content = document.querySelector(".upload-content");
  const ai = document.getElementById("ai-scan-container");
  if (!input || !content) return;

  input.onchange = () => {
    const file = input.files[0];
    content.innerHTML = file ? `<b>Selected:</b> ${file.name}` : "Click to upload";
    if (ai) ai.style.display = file ? "block" : "none";
  };
}


// ---------- CAMERA ----------
/*
function setupCamera() {

  const start = document.getElementById("start-camera-btn");
  const stop = document.getElementById("stop-camera-btn");
  const capture = document.getElementById("capture-btn");
  const video = document.getElementById("camera-feed");
  const canvas = document.getElementById("camera-canvas");
  const input = document.getElementById("report-photo");
  const box = document.getElementById("camera-container");

  if (!start || !video || !canvas || !input) return;

  let stream;

  start.onclick = async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      video.srcObject = stream;
      box.style.display = "block";
      start.style.display = "none";
    } catch {
      alert("Camera access denied");
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach(t => t.stop());
    stream = null;
    box.style.display = "none";
    start.style.display = "flex";
  };

  stop.onclick = stopCamera;

  capture.onclick = () => {
    if (!stream) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    canvas.toBlob(blob => {
      const file = new File([blob], `capture_${Date.now()}.jpg`, { type: "image/jpeg" });
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      input.dispatchEvent(new Event("change"));
      stopCamera();
    });
  };
}
*/


// ---------- AI SCAN ----------
function setupAIScan() {

  const btn = document.getElementById("ai-scan-btn");
  const status = document.getElementById("ai-status");

  if (!btn) return;

  btn.onclick = async () => {

    const photo = document.getElementById("report-photo").files[0];
    if (!photo) return showStatus("Please select a photo", true);

    btn.disabled = true;
    showStatus("AI analyzing...");

    try {

      const form = new FormData();
      form.append("photo", photo);

      const res = await fetchWithAuth(`${API_BASE_URL}/reports/ai-analyze`, { method: "POST", body: form });
      if (!res.ok) throw new Error();

      const data = await res.json();

      // Fill description
      if (data.description)
        document.getElementById("report-description").value = data.description;

      // Fill condition
      if (data.condition) {
        const sel = document.getElementById("report-condition");
        if ([...sel.options].some(o => o.value === data.condition))
          sel.value = data.condition;
      }

      // Show advice list
      const advice = [].concat(data.advice || []);
      const card = document.getElementById("ai-compassion-card");
      const list = document.getElementById("ai-advice-list");

      if (card && list && advice.length) {
        list.innerHTML = advice.map(i => `<li>${i}</li>`).join("");
        card.style.display = "block";
      }

      status.style.display = "none";

    } catch {
      showStatus("AI service unavailable", true);
    }

    btn.disabled = false;

    function showStatus(msg, err = false) {
      status.innerText = msg;
      status.style.color = err ? "#ef4444" : "#666";
      status.style.display = "block";
    }
  };
}


// ---------- SUBMIT REPORT ----------
function setupFormSubmit() {

  const btn = document.getElementById("submit-report-btn");
  if (!btn) return;

  btn.onclick = async (e) => {

    e.preventDefault();

    const errBox = document.getElementById("form-error-msg");
    const showErr = msg => {
      errBox.innerText = msg;
      errBox.style.display = "block";
      errBox.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    errBox.style.display = "none";

    const photo = document.getElementById("report-photo").files[0];
    const condition = document.getElementById("report-condition").value;
    const desc = document.getElementById("report-description").value.trim();
    const loc = document.getElementById("report-location").value.trim();
    const name = document.getElementById("contact-name").value.trim();
    const phone = document.getElementById("contact-phone").value.trim();
    const lat = document.getElementById("report-lat").value;
    const lng = document.getElementById("report-lng").value;

    // Simple validation
    if (!photo) return showErr("Upload or capture a photo");
    if (!condition) return showErr("Select condition");
    if (desc.length < 15) return showErr("Description too short");
    if (!loc) return showErr("Enter location");
    if (!name) return showErr("Enter your name");
    if (!/^[0-9]{10}$/.test(phone)) return showErr("Invalid phone number");
    if (!lat || lat === "0") return showErr("Pin location on map");

    const form = new FormData();
    [["condition",condition],["description",desc],["location",loc],
     ["contact_name",name],["contact_phone",phone],
     ["latitude",lat],["longitude",lng],["photo",photo]]
      .forEach(([k,v])=>form.append(k,v));

    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/reports/`, { method: "POST", body: form });
      if (res.ok) location.href = "./my_reports.html";
      else showErr("Submission failed");
    } catch {
      showErr("Server connection error");
    }
  };
}


// ---------- MAP ----------
function setupMap() {

  const div = document.getElementById("report-map");
  if (!div) return;

  let marker;

  const map = L.map(div).setView([13.0827, 80.2707], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png")
    .addTo(map);

  const setPos = p => {

    const lat = p.lat || p.latitude;
    const lng = p.lng || p.longitude;

    marker
      ? marker.setLatLng([lat, lng])
      : marker = L.marker([lat, lng], { draggable: true })
          .addTo(map)
          .on("dragend", () => setPos(marker.getLatLng()));

    document.getElementById("report-lat").value = lat;
    document.getElementById("report-lng").value = lng;
  };

  map.on("click", e => setPos(e.latlng));
  navigator.geolocation?.getCurrentPosition(p => setPos(p.coords));
}