import * as signalR from '@microsoft/signalr';
import { Absence, CreateAbsenceDto, DistrictMetrics, TimeEntry, EmployeeRecord, School, Teacher, Substitute } from '../types';

const API_BASE = '/api';

// Initial local fallback seed data matching the C# DbInitializer
let mockSchools: School[] = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Lincoln High School', level: 'High School', address: '100 Education Way, Columbus, OH' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Roosevelt Middle School', level: 'Middle School', address: '240 Valley Rd, Columbus, OH' },
  { id: '33333333-3333-3333-3333-333333333333', name: 'Washington Elementary', level: 'Elementary', address: '50 Maple St, Columbus, OH' },
];

let mockTeachers: Teacher[] = [
  { id: 't1', schoolId: '11111111-1111-1111-1111-111111111111', fullName: 'Sarah Johnson', department: 'Science', email: 's.johnson@district.org', roomNumber: 'Room 204' },
  { id: 't2', schoolId: '11111111-1111-1111-1111-111111111111', fullName: 'Robert Davis', department: 'Social Studies', email: 'r.davis@district.org', roomNumber: 'Room 112' },
  { id: 't3', schoolId: '22222222-2222-2222-2222-222222222222', fullName: 'Emily White', department: 'English / Language Arts', email: 'e.white@district.org', roomNumber: 'Room 305' },
  { id: 't4', schoolId: '33333333-3333-3333-3333-333333333333', fullName: 'Michael Chen', department: 'Grade 4', email: 'm.chen@district.org', roomNumber: 'Room 12' },
];

let mockSubstitutes: Substitute[] = [
  { id: 's1', fullName: 'Alex Martinez', email: 'alex.sub@gmail.com', phoneNumber: '(614) 555-0192', certifications: 'Science, Chemistry, General K-12', isAvailableToday: true, hoursWorkedThisWeek: 14 },
  { id: 's2', fullName: 'Jordan Lee', email: 'jordan.lee@outlook.com', phoneNumber: '(614) 555-0144', certifications: 'Math, Physics, General 7-12', isAvailableToday: true, hoursWorkedThisWeek: 21 },
  { id: 's3', fullName: 'Morgan Taylor', email: 'm.taylor@gmail.com', phoneNumber: '(614) 555-0188', certifications: 'Elementary K-6, Special Ed', isAvailableToday: true, hoursWorkedThisWeek: 7 },
  { id: 's4', fullName: 'Sam Rivera', email: 'sam.rivera@gmail.com', phoneNumber: '(614) 555-0177', certifications: 'Social Studies, History', isAvailableToday: true, hoursWorkedThisWeek: 28 },
];

let mockAbsences: Absence[] = [
  {
    id: 'a1',
    schoolId: '11111111-1111-1111-1111-111111111111',
    schoolName: 'Lincoln High School',
    teacherId: 't2',
    teacherName: 'Robert Davis',
    subject: 'AP US History',
    roomNumber: 'Room 112',
    date: new Date().toISOString().split('T')[0],
    startTime: '07:30 AM',
    endTime: '02:45 PM',
    reason: 'Personal Day',
    notes: 'Students have reading assignment Ch 14 on Google Classroom.',
    status: 'Filled',
    assignedSubId: 's4',
    assignedSubName: 'Sam Rivera',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    filledAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    version: '10000000-0000-0000-0000-000000000001'
  },
  {
    id: 'a2',
    schoolId: '22222222-2222-2222-2222-222222222222',
    schoolName: 'Roosevelt Middle School',
    teacherId: 't3',
    teacherName: 'Emily White',
    subject: '8th Grade English',
    roomNumber: 'Room 305',
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00 AM',
    endTime: '03:15 PM',
    reason: 'Professional Development',
    notes: 'Attending district literacy conference. Essay review session.',
    status: 'Filled',
    assignedSubId: 's2',
    assignedSubName: 'Jordan Lee',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    filledAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    version: '20000000-0000-0000-0000-000000000002'
  },
  {
    id: 'a3',
    schoolId: '33333333-3333-3333-3333-333333333333',
    schoolName: 'Washington Elementary',
    teacherId: 't4',
    teacherName: 'Michael Chen',
    subject: 'Grade 4 Classroom',
    roomNumber: 'Room 12',
    date: new Date().toISOString().split('T')[0],
    startTime: '08:15 AM',
    endTime: '03:00 PM',
    reason: 'Illness',
    notes: 'Math worksheets on my desk. Recess duty at 11:30 AM.',
    status: 'Filled',
    assignedSubId: 's3',
    assignedSubName: 'Morgan Taylor',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    filledAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    version: '30000000-0000-0000-0000-000000000003'
  },
  {
    id: 'a4-demo-chem',
    schoolId: '11111111-1111-1111-1111-111111111111',
    schoolName: 'Lincoln High School',
    teacherId: 't1',
    teacherName: 'Sarah Johnson',
    subject: '10th Grade Chemistry',
    roomNumber: 'Room 204',
    date: new Date().toISOString().split('T')[0],
    startTime: '07:30 AM',
    endTime: '02:45 PM',
    reason: 'Illness (Flu)',
    notes: 'Lab safety goggles in Cabinet B. Students working on chemical bonding worksheet.',
    status: 'Open',
    assignedSubId: null,
    assignedSubName: null,
    createdAt: new Date(Date.now() - 1500000).toISOString(),
    version: '40000000-0000-0000-0000-000000000004'
  }
];

let mockTimeEntries: TimeEntry[] = [
  { id: 'te1', employeeName: 'David Miller', role: 'Bus Driver', entryType: 'ClockIn', timestamp: new Date(Date.now() - 18000000).toISOString(), hours: 4.5, isApproved: true },
  { id: 'te2', employeeName: 'Maria Gonzales', role: 'Cafeteria Staff', entryType: 'ClockIn', timestamp: new Date(Date.now() - 16000000).toISOString(), hours: 5.0, isApproved: true },
  { id: 'te3', employeeName: 'Sarah Johnson', role: 'Teacher', entryType: 'ExtraDuty', timestamp: new Date(Date.now() - 86400000).toISOString(), hours: 1.5, stipendReason: 'Period 3 Prep Coverage for Room 104', amount: 67.50, isApproved: true },
  { id: 'te4', employeeName: 'Robert Davis', role: 'Teacher', entryType: 'ExtraDuty', timestamp: new Date(Date.now() - 172800000).toISOString(), hours: 2.0, stipendReason: 'Varsity Basketball Chaperone', amount: 90.00, isApproved: true },
];

let mockRecords: EmployeeRecord[] = [
  { id: 'rec1', fullName: 'Sarah Johnson', role: 'Chemistry Teacher', department: 'Science', stateCertificateNumber: 'OH-ED-984124', certificateStatus: 'Active', clearanceValidUntil: '2028-06-30', hireDate: '2020-08-15', documentCount: 9 },
  { id: 'rec2', fullName: 'Robert Davis', role: 'History Teacher', department: 'Social Studies', stateCertificateNumber: 'OH-ED-772159', certificateStatus: 'Active', clearanceValidUntil: '2027-04-15', hireDate: '2018-08-15', documentCount: 12 },
  { id: 'rec3', fullName: 'Alex Martinez', role: 'Certified Substitute', department: 'Guest Educator Pool', stateCertificateNumber: 'OH-SUB-331902', certificateStatus: 'Active', clearanceValidUntil: '2026-11-30', hireDate: '2023-09-01', documentCount: 6 },
  { id: 'rec4', fullName: 'Jordan Lee', role: 'Certified Substitute', department: 'Guest Educator Pool', stateCertificateNumber: 'OH-SUB-882910', certificateStatus: 'Active', clearanceValidUntil: '2027-01-20', hireDate: '2022-10-15', documentCount: 5 },
  { id: 'rec5', fullName: 'Morgan Taylor', role: 'Certified Substitute', department: 'Guest Educator Pool', stateCertificateNumber: 'OH-SUB-441029', certificateStatus: 'ExpiringSoon', clearanceValidUntil: '2026-09-30', hireDate: '2021-02-10', documentCount: 8 },
];

export const api = {
  async getAbsences(): Promise<Absence[]> {
    try {
      const res = await fetch(`${API_BASE}/absences`);
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return [...mockAbsences];
  },

  async getMetrics(): Promise<DistrictMetrics> {
    try {
      const res = await fetch(`${API_BASE}/absences/metrics`);
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    const total = mockAbsences.length;
    const filled = mockAbsences.filter(a => a.status === 'Filled').length;
    const open = total - filled;
    const rate = total > 0 ? Math.round((filled / total) * 1000) / 10 : 100;
    return {
      totalAbsencesToday: total,
      filledCount: filled,
      openCount: open,
      fillRatePercentage: rate,
      substitutesAvailable: 6
    };
  },

  async createAbsence(dto: CreateAbsenceDto): Promise<Absence> {
    try {
      const res = await fetch(`${API_BASE}/absences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    const newAbsence: Absence = {
      id: 'abs-' + Math.random().toString(36).substring(2, 9),
      ...dto,
      date: new Date().toISOString().split('T')[0],
      status: 'Open',
      createdAt: new Date().toISOString(),
      version: 'ver-' + Math.random().toString(36).substring(2, 9)
    };
    mockAbsences.unshift(newAbsence);
    return newAbsence;
  },

  async claimShift(absenceId: string, subId: string, subName: string, expectedVersion: string): Promise<{ success: boolean; data?: Absence; error?: string }> {
    try {
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
      } else if (res.status === 409) {
        const err = await res.json();
        return { success: false, error: err.message || 'Shift was already claimed by another substitute.' };
      }
    } catch {
      // Fallback local concurrency simulation
    }

    const absence = mockAbsences.find(a => a.id === absenceId);
    if (!absence) return { success: false, error: 'Absence not found.' };
    if (absence.status === 'Filled') {
      return { success: false, error: `Sorry! This shift was claimed already by ${absence.assignedSubName || 'another substitute'}.` };
    }
    if (expectedVersion && absence.version !== expectedVersion) {
      return { success: false, error: 'Optimistic Concurrency Conflict: Another substitute accepted this shift moments ago!' };
    }

    absence.status = 'Filled';
    absence.assignedSubId = subId;
    absence.assignedSubName = subName;
    absence.filledAt = new Date().toISOString();
    absence.version = 'ver-' + Math.random().toString(36).substring(2, 9);
    return { success: true, data: { ...absence } };
  },

  async overrideAssignment(absenceId: string, subId: string, subName: string, status: string = 'Offered'): Promise<Absence | null> {
    try {
      const res = await fetch(`${API_BASE}/absences/${absenceId}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ substituteId: subId, substituteName: subName, status }),
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    const absence = mockAbsences.find(a => a.id === absenceId);
    if (absence) {
      if (!subName) {
        absence.status = 'Open';
        absence.assignedSubId = null;
        absence.assignedSubName = null;
        absence.filledAt = null;
      } else {
        absence.status = (status as any) || 'Offered';
        absence.assignedSubId = subId;
        absence.assignedSubName = subName;
        absence.filledAt = status === 'Filled' ? new Date().toISOString() : null;
      }
      return { ...absence };
    }
    return null;
  },

  async respondToOffer(absenceId: string, accepted: boolean): Promise<Absence | null> {
    try {
      const res = await fetch(`${API_BASE}/absences/${absenceId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accepted }),
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    const absence = mockAbsences.find(a => a.id === absenceId);
    if (absence) {
      if (accepted) {
        absence.status = 'Filled';
        absence.filledAt = new Date().toISOString();
      } else {
        absence.status = 'Open';
        absence.assignedSubId = null;
        absence.assignedSubName = null;
        absence.filledAt = null;
      }
      return { ...absence };
    }
    return null;
  },

  async getTimeEntries(): Promise<TimeEntry[]> {
    try {
      const res = await fetch(`${API_BASE}/timetracking/entries`);
      if (res.ok) return await res.json();
    } catch {}
    return [...mockTimeEntries];
  },

  async punchClock(employeeName: string, role: string, entryType: 'ClockIn' | 'ClockOut'): Promise<TimeEntry> {
    try {
      const res = await fetch(`${API_BASE}/timetracking/punch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeName, role, entryType }),
      });
      if (res.ok) return await res.json();
    } catch {}
    const entry: TimeEntry = {
      id: 'te-' + Math.random().toString(36).substring(2, 9),
      employeeName,
      role,
      entryType,
      timestamp: new Date().toISOString(),
      hours: entryType === 'ClockOut' ? 7.5 : 0,
      isApproved: true
    };
    mockTimeEntries.unshift(entry);
    return entry;
  },

  async submitExtraDuty(employeeName: string, hours: number, reason: string): Promise<TimeEntry> {
    const ratePerHour = 45.0;
    try {
      const res = await fetch(`${API_BASE}/timetracking/extra-duty`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeName, hours, reason, ratePerHour }),
      });
      if (res.ok) return await res.json();
    } catch {}
    const entry: TimeEntry = {
      id: 'te-' + Math.random().toString(36).substring(2, 9),
      employeeName,
      role: 'Teacher',
      entryType: 'ExtraDuty',
      timestamp: new Date().toISOString(),
      hours,
      stipendReason: reason,
      amount: hours * ratePerHour,
      isApproved: true
    };
    mockTimeEntries.unshift(entry);
    return entry;
  },

  async getEmployeeRecords(): Promise<EmployeeRecord[]> {
    try {
      const res = await fetch(`${API_BASE}/records`);
      if (res.ok) return await res.json();
    } catch {}
    return [...mockRecords];
  },

  async getSchools(): Promise<School[]> {
    try {
      const res = await fetch(`${API_BASE}/records/schools`);
      if (res.ok) return await res.json();
    } catch {}
    return [...mockSchools];
  },

  async getTeachers(): Promise<Teacher[]> {
    try {
      const res = await fetch(`${API_BASE}/records/teachers`);
      if (res.ok) return await res.json();
    } catch {}
    return [...mockTeachers];
  },

  async getSubstitutes(): Promise<Substitute[]> {
    try {
      const res = await fetch(`${API_BASE}/records/substitutes`);
      if (res.ok) return await res.json();
    } catch {}
    return [...mockSubstitutes];
  },

  // Azure Function Burst Dispatcher simulation call
  async triggerBurstSimulation(): Promise<{ status: string; notificationsDispatched: number; batchCount: number; averageThroughputMsgPerSec: number; simulatedDurationMs: number }> {
    // In production or when Worker is running, this hits http://localhost:7071/api/dispatch-burst
    try {
      const res = await fetch('http://localhost:7071/api/dispatch-burst');
      if (res.ok) return await res.json();
    } catch {
      // Offline fallback simulation
    }

    await new Promise(r => setTimeout(r, 600));
    return {
      status: 'Completed (Simulated Azure Function Worker)',
      notificationsDispatched: 15000,
      batchCount: 30,
      averageThroughputMsgPerSec: 25000,
      simulatedDurationMs: 600.0
    };
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
