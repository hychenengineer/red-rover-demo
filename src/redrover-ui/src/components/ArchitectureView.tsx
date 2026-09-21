import React, { useState } from 'react';
import { api } from '../services/api';
import { 
  Server, 
  Database, 
  Cloud, 
  Zap, 
  Radio, 
  Layers, 
  ShieldCheck, 
  Cpu, 
  Smartphone, 
  Laptop, 
  MessageSquare,
  ArrowDown,
  ArrowRight,
  Activity
} from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  const [burstResult, setBurstResult] = useState<any | null>(null);
  const [isRunningBurst, setIsRunningBurst] = useState(false);

  const handleRunBurst = async () => {
    setIsRunningBurst(true);
    setBurstResult(null);
    try {
      const res = await api.triggerBurstSimulation();
      setBurstResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRunningBurst(false);
    }
  };

  return (
    <div className="tab-content architecture-view">
      <div className="section-header-banner">
        <div>
          <h2>Production Cloud Architecture & Burst Scalability</h2>
          <p className="subtitle">
            Engineered specifically for K-12 morning peaks: High-frequency REST API, Real-Time SignalR WebSockets,
            and Serverless Azure Function burst workers for the 6:00 AM substitute blast.
          </p>
        </div>
        <button
          className="btn-action-race flex-items-center gap-2"
          disabled={isRunningBurst}
          onClick={handleRunBurst}
        >
          <Zap size={16} />
          <span>{isRunningBurst ? 'Running 15,000 Burst...' : 'Trigger 6:00 AM Burst Test'}</span>
        </button>
      </div>

      {burstResult && (
        <div className="alert-box alert-box-success mb-6">
          <Activity size={22} className="text-emerald" />
          <div className="w-full">
            <div className="flex-between">
              <strong>⚡ Azure Function (SubNotificationDispatcher) Burst Benchmark Succeeded!</strong>
              <span className="badge badge-success text-xs">{burstResult.status}</span>
            </div>
            <div className="burst-metrics-row mt-2">
              <div className="burst-stat">
                <span className="text-xs text-muted">Total Notifications:</span>
                <strong>{burstResult.notificationsDispatched.toLocaleString()} SMS</strong>
              </div>
              <div className="burst-stat">
                <span className="text-xs text-muted">Parallel Batches:</span>
                <strong>{burstResult.batchCount} batches (500/batch)</strong>
              </div>
              <div className="burst-stat">
                <span className="text-xs text-muted">Calculated Throughput:</span>
                <strong className="text-primary">{burstResult.averageThroughputMsgPerSec.toLocaleString()} msg/sec</strong>
              </div>
              <div className="burst-stat">
                <span className="text-xs text-muted">Burst Latency:</span>
                <strong>{burstResult.simulatedDurationMs} ms</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3-Tier Layered Architecture Diagram */}
      <div className="architecture-diagram-card">
        {/* Tier 1: Client UI */}
        <div className="tier-box tier-clients">
          <div className="tier-header">
            <span className="tier-number">Tier 1</span>
            <span className="tier-title">Client Layer (React + TypeScript SPA)</span>
          </div>
          <div className="tier-components-grid">
            <div className="arch-node">
              <Laptop size={20} className="node-icon text-primary" />
              <div className="node-title">Admin Command Center</div>
              <div className="node-desc">Daily live board, fill-rate metrics, manual sub overrides</div>
            </div>
            <div className="arch-node">
              <Laptop size={20} className="node-icon text-indigo" />
              <div className="node-title">Teacher Absence Portal</div>
              <div className="node-desc">Direct absence entry, lesson plan notes & room assignment</div>
            </div>
            <div className="arch-node">
              <Smartphone size={20} className="node-icon text-success" />
              <div className="node-title">Substitute Mobile App</div>
              <div className="node-desc">1-Tap shift claim with optimistic concurrency protection</div>
            </div>
            <div className="arch-node">
              <Cpu size={20} className="node-icon text-warning" />
              <div className="node-title">Time Kiosk & Personnel</div>
              <div className="node-desc">Wall PIN pad, extra duty stipends, compliance document vault</div>
            </div>
          </div>
        </div>

        <div className="tier-flow-connector">
          <ArrowDown size={22} className="text-muted" />
          <span className="connector-label">HTTPS REST Calls + SignalR WSS Connection</span>
          <ArrowDown size={22} className="text-muted" />
        </div>

        {/* Tier 2: Backend Services */}
        <div className="tier-box tier-backend">
          <div className="tier-header">
            <span className="tier-number">Tier 2</span>
            <span className="tier-title">Backend Services Layer (Azure App Service + Serverless Functions)</span>
          </div>

          <div className="tier-components-grid">
            <div className="arch-node highlight-node">
              <Server size={22} className="node-icon text-primary" />
              <div className="node-title">Azure App Service</div>
              <div className="node-badge">Always-On .NET 8/10 API</div>
              <div className="node-desc">
                Core REST API with EF Core connection pooling. Eliminates cold-start latency during morning peak hours.
              </div>
            </div>

            <div className="arch-node">
              <Radio size={22} className="node-icon text-emerald" />
              <div className="node-title">Azure SignalR Service</div>
              <div className="node-badge">Managed WebSockets</div>
              <div className="node-desc">
                Offloads 10,000+ persistent browser WebSocket connections so API web servers remain lightweight and responsive.
              </div>
            </div>

            <div className="arch-node">
              <Layers size={22} className="node-icon text-amber" />
              <div className="node-title">Azure Service Bus</div>
              <div className="node-badge">sub-notification-queue</div>
              <div className="node-desc">
                Decouples core API from notification pipeline. Prevents API blocking during 6:00 AM absence spikes.
              </div>
            </div>

            <div className="arch-node highlight-function">
              <Zap size={22} className="node-icon text-red" />
              <div className="node-title">SubNotificationDispatcher</div>
              <div className="node-badge badge-func">Azure Function (Burst Worker)</div>
              <div className="node-desc">
                Serverless consumption worker. Dynamically auto-scales to fan out 15,000 SMS messages across telco gateways in seconds.
              </div>
            </div>
          </div>
        </div>

        <div className="tier-flow-connector">
          <ArrowDown size={22} className="text-muted" />
          <span className="connector-label">EF Core DbContext Pool + Azure SDK Clients</span>
          <ArrowDown size={22} className="text-muted" />
        </div>

        {/* Tier 3: Storage & External Services */}
        <div className="tier-box tier-storage">
          <div className="tier-header">
            <span className="tier-number">Tier 3</span>
            <span className="tier-title">Data Storage & External Providers</span>
          </div>

          <div className="tier-components-grid">
            <div className="arch-node">
              <Database size={22} className="node-icon text-indigo" />
              <div className="node-title">SQLite / Azure SQL</div>
              <div className="node-badge">Optimistic Concurrency</div>
              <div className="node-desc">
                Row-level concurrency tokens (Guid Version) enforce atomic shift claiming and eliminate double bookings.
              </div>
            </div>

            <div className="arch-node">
              <Cloud size={22} className="node-icon text-primary" />
              <div className="node-title">Azure Blob Storage</div>
              <div className="node-badge">Personnel Document Vault</div>
              <div className="node-desc">
                Encrypted storage for teacher licenses, background checks, and emergency lesson plan attachments.
              </div>
            </div>

            <div className="arch-node">
              <MessageSquare size={22} className="node-icon text-success" />
              <div className="node-title">Twilio / Telco Aggregators</div>
              <div className="node-badge">High-Throughput SMS</div>
              <div className="node-desc">
                10-DLC registered short codes delivering instant substitute shift opportunities to mobile phones.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Engineering Talking Points for Senior Software Engineer Interview */}
      <div className="interview-cheatsheet mt-6">
        <h3>Senior Software Engineer Architectural Rationale</h3>
        <div className="cheatsheet-grid">
          <div className="cheat-card">
            <h4>1. Why App Service for Core API instead of Pure Functions?</h4>
            <p>
              K-12 attendance workflows require zero-cold-start responsiveness. If 300 teachers post absences between 6:00 AM and 6:15 AM, 
              cold starts in consumption functions would create 3-5 second delays. Running the Core REST API on Always-On Azure App Service 
              guarantees warm instances, sub-50ms API responses, and keeps connection pools to SQL alive.
            </p>
          </div>

          <div className="cheat-card">
            <h4>2. Why SubNotificationDispatcher as an Azure Function?</h4>
            <p>
              Unlike steady-state REST queries, the 6:00 AM notification blast is a spiky batch workload: 15,000 SMS messages sent in 2 minutes, 
              then near-idle for hours. Azure Functions on Consumption plan scale out from 0 to 50 instances instantly to handle the fan-out, 
              saving 80% on compute costs while shielding the Core API from backpressure.
            </p>
          </div>

          <div className="cheat-card">
            <h4>3. How is Concurrency Handled Without Deadlocks?</h4>
            <p>
              We avoid heavy pessimistic table locks that could freeze the database. Instead, the <code>Absence</code> entity contains an 
              EF Core <code>[ConcurrencyCheck] Guid Version</code>. When a substitute claims a shift, EF Core issues 
              <code>UPDATE Absences SET Status='Filled', Version=NEWID() WHERE Id=@id AND Version=@expectedVersion</code>. 
              If another transaction committed first, rows affected = 0, throwing <code>DbUpdateConcurrencyException</code> and returning 
              <code>409 Conflict</code>.
            </p>
          </div>

          <div className="cheat-card">
            <h4>4. Why Managed Azure SignalR Service?</h4>
            <p>
              In large school districts with 200+ schools, hundreds of school administrators and campus coordinators keep their browser absence boards open all day. 
              Managing thousands of open WebSocket TCP connections directly inside the ASP.NET API servers exhausts server ports and memory. 
              Offloading WebSockets to Azure SignalR Service frees the API servers to focus solely on fast stateless request processing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
