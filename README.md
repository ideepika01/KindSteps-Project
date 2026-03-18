# KindSteps Project - Application Flow & Frontend Architecture

## 1. Project Overview & Workflow
KindSteps is an application designed to help people report individuals in need of rescue or assistance. The system handles three primary roles:
1. **Public/User**: Can report a case, track its progress, and view their history.
2. **Rescue Team**: Assigned to specific cases. Can view their assigned cases, update the status (e.g., from 'active' to 'in_progress' to 'resolved'), and add field notes.
3. **Admin**: Has an overview of all system statistics, reports, and users. Can manage, assign, or delete cases/users.

**The Complete Flow:**
1. **Authentication**: Users sign up/login. `auth.js` sends credentials to the backend, receives a JWT token, stores it in `localStorage`, and redirects based on user role (`admin`, `rescue_team`, or `user`).
2. **Reporting**: A user logs in and goes to the Report page. They can upload a photo. The photo can be scanned by AI to auto-fill condition and description. A map allows them to pin the location. `report.js` gathers this data into `FormData` and sends it to the backend `POST /reports/` API. The backend saves it to the database.
3. **Tracking**: The user receives a Tracking ID. By entering this ID in the Track page, `track.js` queries `GET /reports/track/{id}` and visually displays the progress status on a stepper.
4. **Rescue Team Action**: A rescue team member logs in and sees cases assigned to them via `rescue_team.js` (fetching `GET /reports/my-assignments`). They can click "Update Status" to see details.
5. **Updating Case**: In `view_report.js`, the rescue member can change the status to "resolved", add field review notes, and rescued location. This sends a `PUT /reports/{id}` request to the backend.
6. **Admin Control**: Admins log in and view total statistics, all users, and all reports via `admin_control.js`. They can filter, view details, or delete records.

---

## 2. Connecting Frontend to Backend & Database
The communication between the frontend and the backend is handled entirely through RESTful APIs using standard JavaScript `fetch`. 

**The Mechanics:**
1. **Configuration (`config.js`)**: Defines `API_BASE_URL`. If running locally, it points to `http://127.0.0.1:8000`. If hosted, it points to the deployed Vercel URL.
2. **Authentication Injection (`utils.js - fetchWithAuth`)**: The frontend stores the JWT Auth Token in `localStorage` upon login. Whenever an API request is made that requires authentication (like creating a report or fetching assignments), the `fetchWithAuth` wrapper function automatically retrieves this token and adds it to the HTTP Headers as `Authorization: Bearer <token>`.
3. **Database Interaction**: The frontend **never** touches the database directly for security reasons. Instead, the JS functions send JSON or Form Data to the Python (FastAPI) Backend. The backend:
   - Validates the token and user role.
   - Uses ORM tools to Query/Insert/Update the actual Database.
   - Returns a JSON response back to the frontend to dynamically update the UI.

---

## 3. Frontend JavaScript Deep Dive (File by File)

### 3.1. `config.js` (Environment Configuration)
- **Functionality**: Sets the `API_BASE_URL` dynamically by checking if the app is running locally (`localhost`) or in production. This acts as the single source of truth for where API calls should be directed.

### 3.2. `utils.js` (Core Utilities & Authentication Carrier)
- **`getToken()`, `saveToken()`, `clearToken()`**: Core helpers to manipulate the JWT access token stored in the browser's `localStorage`.
- **`logout()` & `checkLogin()`**: Functions used independently on every protected page to boot unauthorized users out.
- **`fetchWithAuth(url, options)`**: A crucial, centralized wrapper around the native `fetch` API. It automatically structures the `Authorization: Bearer <token>` header, handles formatting JSON body data vs FormData, and intercepts `401 Unauthorized` responses by auto-logging out the user.

### 3.3. `auth.js` (Authentication & Role Based Routing)
- **`login(e)`**: Triggers on form submission. It captures email and password, validates formatting, and sends form-urlencoded data to `/auth/login`. On success, it saves the token and triggers `handleRedirect()`.
- **`signup(e)`**: Gathers user details, including their selected role (User, Rescue Team, Admin), and sends a POST to `/auth/signup`.
- **`redirectUser()` & `handleRedirect(user)`**: Handles role-based routing map. Admins are forced to `admin_control.html`, rescue teams to `rescue_team.html`, and normal users to `main.html`.
- **`send()`**: A customized fetch wrapper locally tailored for public auth routes (login/signup) where tokens aren't needed yet, handling basic error alerts.

### 3.4. `report.js` (Creating Cases & APIs)
- **`setupPhotoPreview()`**: Updates DOM to show selected photo names.
- **`setupAIScan()`**: Sends the selected photo to the `/reports/ai-analyze` endpoint. Receives parsed intelligence back to auto-fill the severity/condition, generated descriptions, and populates compassion advice lists on the UI.
- **`setupMap()`**: Initializes an OpenStreetMap integration using Leaflet.js. Listens to map clicks to adjust a draggable marker or uses Navigator Geolocation API to auto-define lat/lng values for the current user location.
- **`setupFormSubmit()`**: Intercepts the submit button, extracts strings/files, performs heavy field validations, constructs a `FormData` payload (supporting multipart file uploads), and executes a POST to `/reports/`.

### 3.5. `my_reports.js` (User Dashboard)
- **`loadReports()`**: Executed on DOM load. Hits `GET /reports/` using the auth token.
- **`card(report, index)`**: The layout engine mapping database values (ID, date, priority, status) into semantic HTML strings, dynamically injecting dynamic SVG icons via Lucide based on case urgency.

### 3.6. `track.js` (Tracking Specific Case Progress)
- **`load(id)`**: Fetches live tracking info for a unique ID using `/reports/track/${id}`.
- **`render(report)`**: Re-syncs the UI with live values. Shows assigned team names, team contact, detailed update timestamps, and maps system status codes into human-readable messages.
- **`progressSteps(status)`**: Controls an interactive visual step tracker (Received -> Active -> In Progress -> Resolved), manipulating CSS classes to light up the progress path based on backend status maps.

### 3.7. `rescue_team.js` (Responder Dashboard)
- **`load()`**: Secures the cases assigned strictly to the authenticated team via `GET /reports/my-assignments`.
- **`updateStats(reports)`**: Iterates over the payload to tally total, in-progress, and resolved metrics, refreshing the UI statistics.
- **`setupFilters()` & `apply()`**: Harnesses front-end filtering. Takes the memory-loaded reports and visually hides/shows them based on dropdown (status) or date range selections without making extra database heavy calls.
- **`render()` & `card()`**: Builds the UI list of assigned cases, formatting rescue badges based on case state logic.

### 3.8. `view_report.js` (Shared Case View & Modifier)
- **`loadReportData(id)`**: Secures detailed entity info about a specific case. Initiates a Leaflet map explicitly highlighting that case's recorded coordinates.
- **`updateCase(id)`**: Serves as the primary updating engine for Rescue teams. It extracts the new status, field notes, and rescue destination. Critically validates that final rescue location and notes exist if marked as "resolved". Executed as a `PUT /reports/${id}`.
- **`handleBackToDashboard()`**: Intelligent retreat routing. Validates the `localStorage.user_role` to route the returning user back to their correct specific dashboard (Admin vs Team vs Citizen)

### 3.9. `admin_control.js` (Administrative Data Panel)
- **`init()`**: Triggers parallel data grabbing via `Promise.all()` fetching stats, user arrays, and total reports in one blast to optimize admin load speeds.
- **`loadStats()`**: Populates the big top metrics cards summarizing whole-app behavior.
- **`applyAllFilters()`**: A robust unified array-filtering mechanism searching text dynamically across ID, Name, Location or Status across both reports and users based on search bar keystrokes.
- **`renderReportTable()` & `renderUserTable()`**: Dynamically strings JSON data into interactive HTML tabular rows natively formatting time and checking note states.
- **`deleteReport(id)` & `deleteUser(id)`**: Direct destructive functions sending `DELETE` HTTP verbs, firing native browser confirmations to prevent accidental data loss, and forcing table reloads post-execution.
