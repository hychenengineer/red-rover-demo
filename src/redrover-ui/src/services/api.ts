import * as signalR from '@microsoft/signalr';
import { Absence, CreateAbsenceDto, DistrictMetrics, TimeEntry, EmployeeRecord, School, Teacher, Substitute } from '../types';

const API_BASE = '/api';

export const api = {
  async getAbsences(): Promise<Absence[]> {
    const res = await fetch(`${API_BASE}/absences`);
    if (!res.ok) throw new Error(`Failed to fetch absences: ${res.statusText}`);
    return await res.json();
  },

  async getMetrics(): Promise<DistrictMetrics> {
    const res = await fetch(`${API_BASE}/absences/metrics`);
    if (!res.ok) throw new Error(`Failed to fetch metrics: ${res.statusText}`);
    return await res.json();
  },

  async createAbsence(dto: CreateAbsenceDto): Promise<Absence> {
    const res = await fetch(`${API_BASE}/absences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || `Failed to create absence: ${res.statusText}`);
    }
    return await res.json();
  },

  async claimShift(absenceId: string, subId: string, subName: string, expectedVersion: string): Promise<{ success: boolean; data?: Absence; error?: string }> {
    const res = await fetch(`${API_BASE}/absences/${absenceId}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        substituteId: subId,
        substituteName: subName,
        expectedVersion: expectedVersion
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return { success: true, data };
    }
    const err = await res.json().catch(() => ({ message: 'Shift claim failed.' }));
    return { success: false, error: err.message || 'Shift was already claimed by another substitute.' };
  },

  async overrideAssignment(absenceId: string, subId: string, subName: string, status: string = 'Offered'): Promise<Absence | null> {
    const res = await fetch(`${API_BASE}/absences/${absenceId}/override`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ substituteId: subId, substituteName: subName, status }),
    });
    if (!res.ok) throw new Error(`Failed to override assignment: ${res.statusText}`);
    return await res.json();
  },

  async respondToOffer(absenceId: string, accepted: boolean): Promise<Absence | null> {
    const res = await fetch(`${API_BASE}/absences/${absenceId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accepted }),
    });
    if (!res.ok) throw new Error(`Failed to respond to offer: ${res.statusText}`);
    return await res.json();
  },

  async getTimeEntries(): Promise<TimeEntry[]> {
    const res = await fetch(`${API_BASE}/timetracking/entries`);
    if (!res.ok) throw new Error(`Failed to fetch time entries: ${res.statusText}`);
    return await res.json();
  },

  async punchClock(employeeName: string, role: string, entryType: 'ClockIn' | 'ClockOut'): Promise<TimeEntry> {
    const res = await fetch(`${API_BASE}/timetracking/punch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeName, role, entryType }),
    });
    if (!res.ok) throw new Error(`Failed to punch clock: ${res.statusText}`);
    return await res.json();
  },

  async submitExtraDuty(employeeName: string, hours: number, reason: string): Promise<TimeEntry> {
    const ratePerHour = 45.0;
    const res = await fetch(`${API_BASE}/timetracking/extra-duty`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeName, hours, reason, ratePerHour }),
    });
    if (!res.ok) throw new Error(`Failed to submit extra duty: ${res.statusText}`);
    return await res.json();
  },

  async getEmployeeRecords(): Promise<EmployeeRecord[]> {
    const res = await fetch(`${API_BASE}/records`);
    if (!res.ok) throw new Error(`Failed to fetch employee records: ${res.statusText}`);
    return await res.json();
  },

  async getSchools(): Promise<School[]> {
    const res = await fetch(`${API_BASE}/records/schools`);
    if (!res.ok) throw new Error(`Failed to fetch schools: ${res.statusText}`);
    return await res.json();
  },

  async getTeachers(): Promise<Teacher[]> {
    const res = await fetch(`${API_BASE}/records/teachers`);
    if (!res.ok) throw new Error(`Failed to fetch teachers: ${res.statusText}`);
    return await res.json();
  },

  async getSubstitutes(): Promise<Substitute[]> {
    const res = await fetch(`${API_BASE}/records/substitutes`);
    if (!res.ok) throw new Error(`Failed to fetch substitutes: ${res.statusText}`);
    return await res.json();
  },

  async triggerBurstSimulation(): Promise<{ status: string; notificationsDispatched: number; batchCount: number; averageThroughputMsgPerSec: number; simulatedDurationMs: number }> {
    const res = await fetch('http://localhost:7071/api/dispatch-burst');
    if (!res.ok) throw new Error('Azure Function Worker is offline at http://localhost:7071');
    return await res.json();
  }
};

// SignalR Connection Builder
export function createSignalRConnection(
  onAbsenceCreated?: (absence: Absence) => void,
  onAbsenceUpdated?: (absence: Absence) => void
): signalR.HubConnection {
  const connection = new signalR.HubConnectionBuilder()
    .withUrl('/hubs/absences', {
      skipNegotiation: false,
      transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000])
    .configureLogging(signalR.LogLevel.Warning)
    .build();

  if (onAbsenceCreated) {
    connection.on('AbsenceCreated', onAbsenceCreated);
  }

  if (onAbsenceUpdated) {
    connection.on('AbsenceUpdated', onAbsenceUpdated);
  }

  return connection;
}
