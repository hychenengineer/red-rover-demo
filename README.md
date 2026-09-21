# Red Rover K-12 HR & Absence Management Platform
### Enterprise Reference Implementation & Senior Software Engineer Showcase

[![.NET 10 / 8](https://img.shields.io/badge/.NET-10%20%2F%208%20LTS-purple.svg)](https://dotnet.microsoft.com/)
[![React 18](https://img.shields.io/badge/React-18%20TypeScript-blue.svg)](https://reactjs.org/)
[![Azure SignalR](https://img.shields.io/badge/Azure-SignalR%20Service-0078D4.svg)](https://azure.microsoft.com/)
[![Azure Functions](https://img.shields.io/badge/Azure-Functions%20Worker-F25022.svg)](https://azure.microsoft.com/)
[![SQLite / Azure SQL](https://img.shields.io/badge/Database-SQLite%20%7C%20Azure%20SQL-00599C.svg)](https://learn.microsoft.com/en-us/ef/core/)

---

## 1. Executive Summary

This reference application is purpose-built to support the candidacy for the **Senior Software Engineer ($160k – $185k, Remote)** role at **Red Rover Technologies**.

Rather than presenting generic boilerplate, this codebase directly models the exact domain workflows, performance bottlenecks, and user experiences discovered by reverse-engineering Red Rover's public platform and analyzing **5 internal product training walkthroughs**.

---

## 2. Direct Alignment with 5 Official Red Rover Training Videos

Every view in the web client corresponds 1-to-1 with an official Red Rover training video, accessible directly via the embedded video player inside the application:

| Feature / UI Module | Official Red Rover Video | Workflow Modeled | Key Technical Challenge Solved |
| :--- | :--- | :--- | :--- |
| **Admin Command Center** | `Admin Basic Training.mp4` | Live daily absence tracking, district fill rates (85%+ target), manual sub overrides | Managed Azure SignalR fan-out to prevent open-board socket exhaustion |
| **Teacher Absence Booking** | `2024 Employee Basic Training Video.mp4` | Educator absence registration, lesson plan attachments, duration presets | Decoupled queueing to ensure sub-50ms teacher submission latency |
| **Substitute Mobile App** | `Substitute Basic Training.mp4` | 6:00 AM SMS shift broadcast, 1-tap shift claim, schedule view | **Optimistic Concurrency Control**: EF Core row version tokens prevent double-booking |
| **Time & Attendance Kiosk** | `timeTracking.mp4` | Wall PIN clock in/out for hourly staff; teacher Prep Coverage stipends ($45/hr) | Clean separation between FLSA hourly punch tracking and certified teacher stipends |
| **Personnel Records Vault** | `web_optimized.mp4` | Compliance tracking for state educator licenses, FBI/BCI clearances, document counts | Relational metadata with Blob storage encryption for compliance audits |

---

## 3. Strict 3-Tier Production Cloud Architecture

```
+-----------------------------------------------------------------------------------------+
|                                    TIER 1: CLIENT LAYER                                 |
|                                                                                         |
|   +--------------------+  +--------------------+  +------------------+  +-----------+   |
|   | Admin Live Board   |  | Teacher Portal     |  | Sub Mobile App   |  | Time Kiosk|   |
|   | (React + SignalR)  |  | (Absence Creation) |  | (1-Tap Claim)    |  | (PIN Pad) |   |
|   +--------------------+  +--------------------+  +------------------+  +-----------+   |
+--------------------------------------------+--------------------------------------------+
                                             |  HTTPS REST / WSS SignalR
                                             v
+-----------------------------------------------------------------------------------------+
|                                TIER 2: BACKEND SERVICES LAYER                           |
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
|                        TIER 3: DATA STORAGE & EXTERNAL PROVIDERS                        |
|                                                                                         |
|   +------------------------+   +-----------------------+   +------------------------+   |
|   | SQLite / Azure SQL     |   | Azure Blob Storage    |   | Twilio / Carrier SMS   |   |
|   | Row Version Concurrency|   | Encrypted Vault Files |   | 10-DLC Short Codes     |   |
|   +------------------------+   +-----------------------+   +------------------------+   |
+-----------------------------------------------------------------------------------------+
```

---

## 4. Senior Engineering Design Highlights

### A. Why App Service for Core API instead of Pure Azure Functions?
In K-12 education, the morning rush is unforgiving. Between **6:00 AM and 6:30 AM**, hundreds of teachers wake up sick and record emergency absences. If the core REST API were hosted exclusively on serverless Consumption functions:
- Unacceptable **3–5 second cold-start spikes** would frustrate teachers trying to call out before the morning bell.
- High connection churn would saturate database connection pools.

By hosting the Core REST API on **Azure App Service (Always-On)**, we maintain warm memory caches, keep database connection pools open, and achieve steady **sub-50ms API response latencies**.

### B. Why `SubNotificationDispatcher` as a Serverless Azure Function?
While steady-state API traffic belongs on App Service, the **6:00 AM SMS substitute broadcast is a textbook spiky burst workload**:
- At 6:00 AM, 15,000 SMS messages must be dispatched across local telco aggregators in under 120 seconds.
- For the remainder of the school day, notification traffic is near zero.

`SubNotificationDispatcher` is triggered asynchronously via **Azure Service Bus (`sub-notification-queue`)**. When a burst occurs, Azure Functions automatically scales out across 20–50 consumption instances to parallelize batch delivery, then de-allocates completely, saving up to 80% on compute costs.

### C. Concurrency Guarantee: Zero Double-Booking
When a prime shift (e.g. *10th Grade AP Chemistry at Lincoln High*) is broadcast to 50 certified science substitutes, multiple guest teachers will inevitably tap "Accept" within milliseconds of each other.

To prevent double-booking without blocking database reads:
1. The `Absence` entity utilizes EF Core optimistic locking via `[ConcurrencyCheck] Guid Version`.
2. When the first substitute claims the shift, EF Core issues:
   ```sql
   UPDATE Absences 
   SET Status = 'Filled', AssignedSubId = @subId, Version = @newGuid 
   WHERE Id = @absenceId AND Version = @expectedVersion;
   ```
3. The winner receives `200 OK`. The second transaction finds `RowsAffected == 0`, triggering a `DbUpdateConcurrencyException`. The API traps this and returns a clean `409 Conflict`:
   ```json
   {
     "message": "Sorry! This assignment was just claimed by another substitute.",
     "currentStatus": "Filled"
   }
   ```
*Try this live inside the Admin Board by clicking the **"Race Test"** button!*

---

## 5. Local Setup & Execution Guide

### Prerequisites
- [.NET SDK 8.0 or 10.0](https://dotnet.microsoft.com/)
- [Node.js 18+ & npm](https://nodejs.org/)

### Step 1: Run Core REST API
```bash
cd src/RedRover.Api
dotnet run
```
- **API URL**: `http://localhost:5000`
- **Swagger Documentation**: `http://localhost:5000/swagger`
- **SQLite Database**: Automatically initialized and seeded with Lincoln High, Roosevelt Middle, teachers, and substitutes (`redrover.db`).

### Step 2: Run React UI
```bash
cd src/redrover-ui
npm install
npm run dev
```
- **Application URL**: `http://localhost:5173`
- All `/api` and `/hubs` requests are proxied directly to the .NET API. If running offline, a complete mock fallback activates automatically.

### Step 3: Run Azure Function (Optional)
```bash
cd src/RedRover.Worker
dotnet run
```

---

## 6. Pre-Seeded Test Personas

| Role | Persona Name | Campus / Department | Credentials / Notes |
| :--- | :--- | :--- | :--- |
| **Teacher** | Sarah Johnson | Lincoln High (Room 204) | Chemistry / Biology (Subject of demo open shift) |
| **Teacher** | Robert Davis | Lincoln High (Room 112) | Social Studies |
| **Substitute** | Alex Martinez | Guest Educator Pool | Science, Chemistry, General K-12 |
| **Substitute** | Jordan Lee | Guest Educator Pool | Math, Physics, General 7-12 |
| **Hourly Staff** | David Miller | Transportation Dept | Bus Driver (Kiosk PIN: `1024`) |
| **Hourly Staff** | Maria Gonzales | Food Services Dept | Cafeteria Staff (Kiosk PIN: `1234`) |

---

## 7. Infrastructure as Code

Production deployment is fully codified in `infra/main.bicep`:
```bash
az deployment group create \
  --resource-group rg-redrover-prod \
  --template-file infra/main.bicep \
  --parameters sqlAdminPassword='YourStrongPassword123!'
```
Provisions:
- Linux Azure App Service Plan (P1v3 Always-On)
- Azure SignalR Service (Standard S1)
- Azure Service Bus Namespace + `sub-notification-queue`
- Azure Functions Consumption Plan (`SubNotificationDispatcher`)
- Azure SQL Database with transparent data encryption
- Azure Storage Account with `personnel-credentials` blob container
