export interface School {
  id: string;
  name: string;
  level: string;
  address: string;
}

export interface Teacher {
  id: string;
  schoolId: string;
  schoolName?: string;
  fullName: string;
  department: string;
  email: string;
  roomNumber: string;
}

export interface Substitute {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  certifications: string;
  isAvailableToday: boolean;
  hoursWorkedThisWeek: number;
}

export interface Absence {
  id: string;
  schoolId: string;
  schoolName: string;
  teacherId: string;
  teacherName: string;
  subject: string;
  roomNumber: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
  notes: string;
  status: 'Open' | 'Offered' | 'Filled' | 'Cancelled';
  assignedSubId?: string | null;
  assignedSubName?: string | null;
  createdAt: string;
  filledAt?: string | null;
  version: string;
}

export interface CreateAbsenceDto {
  schoolId: string;
  schoolName: string;
  teacherId: string;
  teacherName: string;
  subject: string;
  roomNumber: string;
  reason: string;
  startTime: string;
  endTime: string;
  notes: string;
  date?: string;
}

export interface DistrictMetrics {
  totalAbsencesToday: number;
  filledCount: number;
  openCount: number;
  fillRatePercentage: number;
  substitutesAvailable: number;
}

export interface TimeEntry {
  id: string;
  employeeName: string;
  role: string;
  entryType: 'ClockIn' | 'ClockOut' | 'ExtraDuty';
  timestamp: string;
  hours: number;
  stipendReason?: string | null;
  amount?: number | null;
  isApproved: boolean;
}

export interface EmployeeRecord {
  id: string;
  fullName: string;
  role: string;
  department: string;
  stateCertificateNumber: string;
  certificateStatus: 'Active' | 'ExpiringSoon' | 'Expired';
  clearanceValidUntil: string;
  hireDate: string;
  documentCount: number;
}
