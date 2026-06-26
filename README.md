# Lenovo Elite Engineer Certification Program
An advanced, production-grade, full-stack certification platform designed specifically for **Lenovo Field Operations**. The application conducts high-stakes engineering exams led by virtual interviewer **Alex** and continuously calculates technical competency and proctoring integrity metrics to award high-fidelity certificates.

---

## 🚀 Key Deliverables & System Architecture

### 1. Visual Theme & Theme Choices
* **Theme**: Lenovo Slate Professional (Light-Mode Only).
* **Palette**: Rich Off-White Canvas, Slate Grays, Crimson Lenovo Red (`#e2231a`), and Charcoal Dark Accents.
* **Layout**: Compact, responsive, desktop-first dashboards built using native CSS grids.

### 2. Virtual Interviewer "Alex" Engine
* **Technology**: Pure HTML5 Vector Canvas & 2D Skeletal bone-rigging with coordinate-lerping.
* **Vocal profile**: Native Indian Male English Voice using the browser Web Speech API.
* **State Expressions**: Neutral, Smile, Frown, Thinking, Celebration, Approval, and Concern.
* **Real-time Lip Sync**: Dynamically modulates mouth amplitude using speech-synthesis utterance frequency callbacks.
* **Gestures**: Slid-in Thumbs-up badge overlay, nodding, head-shaking, and idle breathing.

### 3. Unified Proctoring Integrity Suite
* **Browser Sandbox Locks**: Intercepts tab switching, context menus, mouse out-of-screen bounds, right-clicks, and clipboard copying.
* **Device Detection**: Standard camera feed integration with browser-optimized **TensorFlow.js & COCO-SSD MobileNet** models to detect mobile devices.
* **Gaze & Face Check**: Periodic canvas pixel-luminous heuristics combined with TFJS bounding calculations to track eyeball gaze (Center, Left, Right, Down), face centering, and multiple face entries.

### 4. Client-side PDF Certificate Generator
* **Library**: `jsPDF` at 300-DPI high resolution.
* **Elements**: Golden-metallic geometry borders, Certificate ID hashes, issuance timestamps, competency ratios, scan-to-verify secure QR codes, and digital signatories.

---

## 🛠️ Multi-Cloud Deployment Guide

### 1. Docker & Docker-Compose (Recommended)
Build and run the entire full-stack app locally using Docker:
```bash
# Build & Run via Docker Compose
docker-compose up --build

# Run in background (Daemon Mode)
docker-compose up -d --build
```
The application will boot and bind securely to `http://localhost:3000`.

### 2. Render Deployment
1. Connect your Git repository to [Render](https://render.com/).
2. Select **Web Service**.
3. Choose the **Docker** runtime environment.
4. Set Environment Variables:
   - `NODE_ENV=production`
   - `PORT=3000`
5. Deploy. Render will automatically pull the multi-stage `Dockerfile` and serve the platform over an HTTPS domain.

### 3. Railway Deployment
1. Connect your Github to [Railway](https://railway.app/).
2. Create a new project and select **Deploy from Github Repo**.
3. Railway automatically detects the multi-stage `Dockerfile` and builds the image.
4. Set the container port variable to `PORT=3000`.

### 4. Microsoft Azure App Services
1. Go to the Azure Portal and search for **App Services**.
2. Select **Web App** -> Create.
3. In **Publish**, select **Docker Container** -> Linux OS.
4. In **Docker Options**, select **Single Container** -> **Docker Hub** or push your container to an **Azure Container Registry (ACR)**.
5. In Configuration, set the Application Setting `WEBSITES_PORT_LIMITATOR` or `PORT` to `3000`.

### 5. Amazon Web Services (AWS Elastic Beanstalk)
1. Create an AWS Elastic Beanstalk application.
2. Select **Docker** as the platform.
3. Zip your `Dockerfile`, `docker-compose.yml`, `package.json`, and source code.
4. Upload and deploy the source bundle.

---

## 🔒 Security Hardening Standards

1. **Anti-Tampering DevTools Check**: Real-time browser outer-width and inner-width layout variance audits detect console dock triggers, immediately issuing a `-30` integrity deduction.
2. **Click Validation Guard**: Custom event bubble filters block and penalize click inputs landing outside registered exam option targets, protecting against automated background macros.
3. **Lazy SDK DB Instantiations**: The database is structured in a non-blocking JSON file storage pattern in `/database.json`, mimicking SQLite/PostgreSQL, protecting state transactions against concurrent engine threads.
4. **Credential Locks**: Candidate credentials are permanently verified against the registry during entry. If an employee ID is registered as "Completed" or "Disqualified", re-entry is blocked.

---

## 🧪 Automated Test Cases

The application integrates full verification testing endpoints. To test manually, use the following test patterns:

| Test Target | Input / Action | Expected Result |
| :--- | :--- | :--- |
| **Credential Check** | Input duplicate Employee ID | Block login and display validation error alert. |
| **Integrity Loss** | Switch browser tabs | Tab Switch registered. Score reduced by 25 points. |
| **Right Click** | Trigger standard context menu | Context menu blocked. Score reduced by 10 points. |
| **Keyboard Type** | Press key during click-only exam | Key intercepted. Score reduced by 10 points. |
| **Score Termination** | Accumulate <60 Integrity points | Immediate stoppage. Disqualification view rendered. Reattempt blocked. |
| **Certification Pass** | Get ≥90% Tech & ≥60% Integrity | Award Lenovo Elite Engineer title and unlock PDF download. |
