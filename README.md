# Red Rover K-12 Absence Management System Demo

An enterprise reference implementation of a K-12 substitute placement and absence management platform, built with **.NET 10 / C# Web API**, **React 18 TypeScript**, and **Azure SignalR real-time WebSockets**.

---

## 1. Quick Setup & Run Guide

### Prerequisites
- [.NET SDK (v8.0 or v10.0)](https://dotnet.microsoft.com/download)
- [Node.js (v18+) & npm](https://nodejs.org/)

---

### Step 1: Start the Backend (.NET Web API)
Open a terminal and start the .NET Web API:

```bash
cd src/RedRover.Api
dotnet run
```

- **API URL**: `http://localhost:5000`
- **Interactive Swagger Docs**: `http://localhost:5000/swagger`
- **Database**: An SQLite database (`redrover.db`) is automatically initialized and seeded with schools, teachers, substitutes, and baseline absence records on startup.

---

### Step 2: Start the Frontend (React 18 UI)
Open a second terminal and start the Vite frontend development server:

```bash
cd src/redrover-ui
npm install
npm run dev
```

- **Application URL**: `http://localhost:5173`
- The React frontend connects directly to the .NET API at `http://localhost:5000` via Vite reverse-proxy for all REST endpoints (`/api`) and SignalR WebSockets (`/hubs`).

---

### Step 3 (Optional): Start the Azure Background Worker
To run the Azure Functions SMS burst dispatcher:

```bash
cd src/RedRover.Worker
dotnet run
```

---

## 2. Concrete Walkthrough Example: Emergency Absence & Substitute Placement

This step-by-step scenario walks through how the three primary personas (**Teacher**, **Administrator**, and **Substitute**) interact with the platform in real time with zero page reloads.

### Scenario: High School Chemistry Teacher Calls Out Sick

#### Step 1: Teacher Creates the Absence
1. Open `http://localhost:5173` in your browser.
2. Click the **Teacher** tab in the top navigation bar.
3. In the **Teacher Persona** dropdown, select **Sarah Johnson (Lincoln High School — Science, Room 204)**.
4. Select the date (e.g., tomorrow), duration (**Full Day**), reason (**Illness / Medical**), and enter notes: `"Lab experiment safety sheets are printed on my desk. Period 4 has Quiz 3."`
5. Click **Create Absence**.
   - *Behind the Scenes*: The .NET API records the absence with status `Open`, triggers the qualification matching engine, and broadcasts an `AbsenceCreated` event across SignalR.

#### Step 2: Administrator Assigns the Shift
1. Switch to the **School Admin** tab (or open it side-by-side in a second browser window).
2. Look at the **Absence Board**:
   - The new absence for **Sarah Johnson** appears immediately in the **Open / Unfilled** list via SignalR with zero page refreshing.
   - Note the **"Substitutes cannot claim directly"** badge: unassigned absences require admin dispatching.
3. Click the **Assign Sub** button on Sarah Johnson's card.
4. In the assignment modal, select qualified substitute **Alex Martinez** (certified in Science/Chemistry).
5. Click **Confirm Assignment**.
   - *Behind the Scenes*: The backend transitions the absence status to `Offered`, assigns `Alex Martinez`, and pushes an `AbsenceUpdated` SignalR broadcast.

#### Step 3: Substitute Reviews and Accepts the Offer
1. Switch to the **Substitute** tab.
2. In the **Substitute Profile** dropdown, select **Alex Martinez**.
3. Under **Assigned Shifts Waiting for Your Decision**, you will see the offered shift at Lincoln High School with two action buttons:
   - **Accept Shift** (Green)
   - **Decline Shift** (Red)
4. Click **Accept Shift**.
   - *Behind the Scenes*: A `POST /api/absences/{id}/respond` request is sent to the backend. The API transitions the status from `Offered` to `Filled`, timestamps `FilledAt`, and updates the optimistic concurrency version token.

#### Step 4: Real-Time Confirmation
1. Switch back to the **School Admin** tab.
2. Observe that Sarah Johnson's absence has automatically moved to the **Filled Absences** section, showing assigned substitute **Alex Martinez**.
3. The top **District Fill Rate** metric counter dynamically updates in real-time.

---

### Bonus: Concurrency Collision Test (Race Condition Simulation)
1. On the **School Admin** tab, click **Live Board**.
2. Click the **Race Test** button.
3. This fires two simultaneous substitute claims at the exact same millisecond with conflicting expected version tokens.
4. The first claim succeeds (`200 OK`), while the second is trapped by EF Core optimistic concurrency and rejected with `409 Conflict`, demonstrating zero double-booking under high morning concurrency.

---

## 3. Strict 3-Tier Production Cloud Architecture

```
+-----------------------------------------------------------------------------------------+
|                                  TIER 1: CLIENT LAYER                                   |
|                                                                                         |
|   +--------------------+  +--------------------+  +------------------+  +-----------+   |
|   | Admin Live Board   |  | Teacher Portal     |  | Sub Mobile App   |  | Time Kiosk|   |
|   | (React + SignalR)  |  | (Absence Creation) |  | (Accept/Decline) |  | (PIN Pad) |   |
|   +--------------------+  +--------------------+  +------------------+  +-----------+   |
+--------------------------------------------+--------------------------------------------+
                                             |  HTTPS REST / WSS SignalR
                                             v
+-----------------------------------------------------------------------------------------+
|                              TIER 2: BACKEND SERVICES LAYER                             |
|                                                                                         |
|   +----------------------+   +-----------------------+   +--------------------------+   |
|   | Azure App Service    |   | Azure SignalR Service |   | Azure Service Bus        |   |
|   | Always-On Core API   |<->| Managed WebSockets    |   | 'sub-notification-queue' |   |
|   | (.NET 8/10 REST)     |   | Connection Offloading |   +------------+-------------+   |
|   +----------+-----------+   +-----------------------+                |                 |
|              |                                                        v                 |
|              |                                          +---------------------------+   |
|              |                                          | SubNotificationDispatcher |   |
|              |                                          | Azure Function (Burst)    |   |
|              |                                          | 6:00 AM Serverless Worker |   |
|              |                                          +-------------+-------------+   |
+--------------+--------------------------------------------------------+-----------------+
               |                                                        |
               | EF Core DbContext Pool                                 | Carrier API
               v                                                        v
+-----------------------------------------------------------------------------------------+
|                      TIER 3: DATA STORAGE & EXTERNAL PROVIDERS                          |
|                                                                                         |
|   +------------------------+   +-----------------------+   +------------------------+   |
|   | SQLite / Azure SQL     |   | Azure Blob Storage    |   | Twilio / Carrier SMS   |   |
|   | Row Version Concurrency|   | Encrypted Vault Files |   | 10-DLC Short Codes     |   |
|   +------------------------+   +-----------------------+   +------------------------+   |
+-----------------------------------------------------------------------------------------+
```

### Architectural Rationale

1. **Always-On Azure App Service for Core API**:
   - Between 6:00 AM and 6:30 AM, hundreds of teachers report morning absences simultaneously.
   - Hosting the core REST API on an Always-On App Service prevents 3–5 second serverless cold starts and preserves pre-warmed database connection pools for steady sub-50ms responses.

2. **Azure SignalR Service Connection Offloading**:
   - School administrators keep attendance dashboards running throughout the school day.
   - Offloading persistent WebSocket connections to Azure SignalR Service prevents API server socket exhaustion and supports instant fan-out without client-side polling.

3. **Serverless Azure Function for Spiky SMS Bursts**:
   - The 6:00 AM substitute broadcast dispatches thousands of outbound SMS alerts in under 2 minutes, then sits idle for the rest of the day.
   - Decoupling notification delivery to Azure Service Bus and a serverless worker allows auto-scaling across dozens of instances during the surge, minimizing compute costs.

4. **Optimistic Concurrency Control (Zero Double-Booking)**:
   - Uses EF Core row version tokens (`Guid Version`) with database-level concurrency checks.
   - If two substitutes attempt to claim or accept the same position simultaneously, the winner receives `200 OK` while the second transaction is safely trapped and returned as `409 Conflict`.
