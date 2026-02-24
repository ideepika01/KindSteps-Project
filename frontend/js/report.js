// Run when page loads
document.addEventListener("DOMContentLoaded", function () {

  checkLogin();

  photoPreview();

  startCamera();

  scanAI();

  submitForm();

  initMap();

});


// Show selected photo name
function photoPreview() {

  const input = document.getElementById("report-photo");

  const text = document.querySelector(".upload-content");

  if (!input) return;

  input.onchange = function () {

    if (input.files.length > 0)
      text.innerText = "Selected: " + input.files[0].name;
    else
      text.innerText = "Click to upload";

  };
}



// Start camera
function startCamera() {

  const start = document.getElementById("start-camera-btn");

  const video = document.getElementById("camera-feed");

  const canvas = document.getElementById("camera-canvas");

  const capture = document.getElementById("capture-btn");

  const input = document.getElementById("report-photo");

  if (!start) return;

  let stream;

  start.onclick = async function () {

    stream = await navigator.mediaDevices.getUserMedia({ video: true });

    video.srcObject = stream;

  };


  capture.onclick = function () {

    canvas.width = video.videoWidth;

    canvas.height = video.videoHeight;

    canvas.getContext("2d").drawImage(video, 0, 0);

    canvas.toBlob(function (blob) {

      const file = new File([blob], "photo.jpg");

      const dt = new DataTransfer();

      dt.items.add(file);

      input.files = dt.files;

    });

  };

}



// Scan using AI
function scanAI() {

  const btn = document.getElementById("ai-scan-btn");

  if (!btn) return;

  btn.onclick = async function () {

    const photo =
      document.getElementById("report-photo").files[0];

    if (!photo) {

      alert("Select photo");

      return;
    }

    const form = new FormData();

    form.append("photo", photo);

    const res = await fetchWithAuth(
      API_BASE_URL + "/reports/ai-analyze",
      {
        method: "POST",
        body: form
      }
    );

    const data = await res.json();

    document.getElementById("report-description").value =
      data.description;

  };

}



// Submit report
function submitForm() {

  const btn =
    document.getElementById("submit-report-btn");

  if (!btn) return;

  btn.onclick = async function (e) {

    e.preventDefault();

    const photo =
      document.getElementById("report-photo").files[0];

    const desc =
      document.getElementById("report-description").value;

    const phone =
      document.getElementById("contact-phone").value;

    const lat =
      document.getElementById("report-lat").value;

    const lng =
      document.getElementById("report-lng").value;


    if (!photo || !desc || !phone) {

      alert("Fill all fields");

      return;
    }


    const form = new FormData();

    form.append("description", desc);

    form.append("phone", phone);

    form.append("lat", lat);

    form.append("lng", lng);

    form.append("photo", photo);


    const res = await fetchWithAuth(
      API_BASE_URL + "/reports/",
      {
        method: "POST",
        body: form
      }
    );


    if (res.ok)
      location.href = "my_reports.html";
    else
      alert("Failed");

  };

}



// Initialize map
function initMap() {

  const map =
    L.map("report-map")
      .setView([13.0827, 80.2707], 13);


  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  ).addTo(map);


  let marker;


  map.on("click", function (e) {

    const lat = e.latlng.lat;

    const lng = e.latlng.lng;


    if (!marker)
      marker = L.marker([lat, lng]).addTo(map);
    else
      marker.setLatLng([lat, lng]);


    document.getElementById("report-lat").value = lat;

    document.getElementById("report-lng").value = lng;

  });

}