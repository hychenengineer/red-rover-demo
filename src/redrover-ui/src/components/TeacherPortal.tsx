import React, { useState } from 'react';
import { Absence, Teacher, CreateAbsenceDto } from '../types';
import { api } from '../services/api';
import { 
  Home, 
  Calendar as CalendarIcon, 
  Search, 
  PlusSquare, 
  Bell, 
  HelpCircle, 
  ChevronLeft, 
  ChevronRight, 
  UserCheck, 
  AlertCircle, 
  Phone, 
  FileText, 
  CheckCircle2, 
  Clock,
  GraduationCap
} from 'lucide-react';

interface TeacherPortalProps {
  absences: Absence[];
  teachers: Teacher[];
  onAbsenceCreated: () => void;
}

export const TeacherPortal: React.FC<TeacherPortalProps> = ({
  absences,
  teachers,
  onAbsenceCreated,
}) => {
  // Default fallback teacher list if API hasn't returned yet
  const defaultTeachers: Teacher[] = [
    { id: 't1', schoolId: '1', fullName: 'Sarah Johnson', department: 'Science', email: 's.johnson@district.org', roomNumber: 'Room 204' },
    { id: 't2', schoolId: '1', fullName: 'Robert Davis', department: 'Social Studies', email: 'r.davis@district.org', roomNumber: 'Room 112' },
    { id: 't3', schoolId: '2', fullName: 'Emily White', department: 'English / Language Arts', email: 'e.white@district.org', roomNumber: 'Room 305' },
    { id: 't4', schoolId: '3', fullName: 'Michael Chen', department: 'Grade 4 Classroom', email: 'm.chen@district.org', roomNumber: 'Room 12' },
  ];

  const teacherList = teachers && teachers.length > 0 ? teachers : defaultTeachers;
  
  // 1. Teacher Persona Dropdown State
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teacherList[0]?.id || 't1');
  const currentTeacher = teacherList.find(t => t.id === selectedTeacherId) || teacherList[0];

  // Interactive calendar state
  const [calYear, setCalYear] = useState<number>(2026);
  const [calMonth, setCalMonth] = useState<number>(8); // 8 = September (0-indexed)
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-22');
  
  const [reason, setReason] = useState('Illness / Medical');
  const [times, setTimes] = useState('Full Day (8:00 AM - 3:30 PM)');
  const [needSub, setNeedSub] = useState<'yes' | 'no'>('yes');
  const [notes, setNotes] = useState('Worksheets on front desk. Period 3 has Lab 4.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Month navigation
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(prev => prev - 1);
    } else {
      setCalMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(prev => prev + 1);
    } else {
      setCalMonth(prev => prev + 1);
    }
  };

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();

  const handleSelectDay = (day: number) => {
    const formatted = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(formatted);
  };

  // Filter absences belonging specifically to the SELECTED teacher persona
  const teacherAbsences = absences.filter(a => 
    a.teacherId === currentTeacher.id ||
    a.teacherName.toLowerCase() === currentTeacher.fullName.toLowerCase() ||
    (currentTeacher.fullName.includes(' ') && a.teacherName.toLowerCase().includes(currentTeacher.fullName.toLowerCase().split(' ')[1]))
  );

  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedbackMessage(null);

    const dto: CreateAbsenceDto = {
      schoolId: currentTeacher.schoolId || '1',
      schoolName: 'Lincoln High School',
      teacherId: currentTeacher.id,
      teacherName: currentTeacher.fullName,
      subject: currentTeacher.department || '10th Grade Chemistry',
      roomNumber: currentTeacher.roomNumber || 'Room 204',
      reason,
      startTime: times.includes('Half Day PM') ? '11:45 AM' : '08:00 AM',
      endTime: times.includes('Half Day AM') ? '11:45 AM' : '03:30 PM',
      notes,
      date: selectedDate,
    };

    try {
      await api.createAbsence(dto);
      setFeedbackMessage(`Absence recorded for ${currentTeacher.fullName} on ${selectedDate}! Sent to School Admin board.`);
      onAbsenceCreated();
      const trackerEl = document.getElementById('my-absences-tracker');
      if (trackerEl) {
        trackerEl.scrollIntoView({ behavior: 'smooth' });
      }
    } catch {
      alert('Error creating absence.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const teacherInitials = currentTeacher.fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2);

  return (
    <div className="rr-portal-container">
      {/* 1. Global Announcement Banner */}
      <div className="rr-top-banner rr-banner-red">
        <span className="banner-label">MESSAGE from Mishoreline Area Schools:</span>
        <span className="banner-text">Please Add Classroom Info in Red Rover</span>
      </div>

      <div className="rr-portal-body">
        {/* 2. Left Navy Sidebar - Only implemented items */}
        <aside className="rr-sidebar">
          <div className="rr-sidebar-header">
            <div className="rr-logo-wrapper">
              <svg className="rr-logo-icon" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="11" r="5" fill="#FF5A43" />
                <path d="M12 24C12 20 16 18 20 18C24 18 28 20 28 24C28 27 26 29 23 29C20 29 20 27 20 25C20 27 18 29 15 29C13 29 12 27 12 24Z" stroke="#FF5A43" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="rr-logo-text">Red Rover</span>
            </div>
            <button className="rr-sidebar-collapse">
              <ChevronLeft size={16} />
            </button>
          </div>

          <nav className="rr-nav-menu">
            <button className="rr-nav-item active">
              <Home size={18} className="rr-nav-icon text-coral" />
              <span>Home & Attendance</span>
            </button>
          </nav>
        </aside>

        {/* 3. Main Content Container */}
        <div className="rr-main-wrapper">
          <header className="rr-header">
            <div className="flex-items-center gap-3">
              <div className="rr-search-box">
                <Search size={16} className="rr-search-icon" />
                <input type="text" placeholder="Search" />
              </div>

              {/* TEACHER PERSONA DROPDOWN SELECTOR */}
              <div className="rr-sub-dropdown-badge">
                <label className="text-xs font-bold text-slate-500 mr-2 flex-items-center gap-1">
                  <GraduationCap size={14} className="text-primary" />
                  <span>Teacher Persona:</span>
                </label>
                <select 
                  value={selectedTeacherId} 
                  onChange={e => setSelectedTeacherId(e.target.value)}
                  className="rr-sub-select-dropdown"
                >
                  {teacherList.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} — {t.department} ({t.roomNumber})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rr-header-actions">
              <button className="rr-header-btn" title="Recent History">
                <Clock size={18} />
              </button>
              <button className="rr-header-btn" title="Quick Create">
                <PlusSquare size={18} />
              </button>
              <button className="rr-header-btn" title="Notifications">
                <Bell size={18} />
                <span className="rr-dot-indicator"></span>
              </button>
              <button className="rr-header-btn" title="Help">
                <HelpCircle size={18} />
              </button>
              <div className="rr-avatar-circle teacher-avatar" title={`${currentTeacher.fullName} (${currentTeacher.department})`}>
                {teacherInitials}
              </div>
            </div>
          </header>

          <main className="rr-content-area">
            {/* Active Teacher Profile Banner */}
            <div className="rr-sub-profile-banner mb-4">
              <div className="flex-between">
                <div className="flex-items-center gap-3">
                  <div className="rr-avatar-circle teacher-avatar">
                    {teacherInitials}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{currentTeacher.fullName}</h3>
                    <div className="text-xs text-muted">
                      Lincoln High School • Department: <strong>{currentTeacher.department}</strong> • Room: <strong>{currentTeacher.roomNumber}</strong>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="rr-status-pill pill-green">Active Educator</span>
                  <div className="text-xs text-muted mt-1">{teacherAbsences.length} absences recorded</div>
                </div>
              </div>
            </div>

            {feedbackMessage && (
              <div className="rr-alert-success mb-4">
                <CheckCircle2 size={18} />
                <span>{feedbackMessage}</span>
              </div>
            )}

            {/* Top 2-Column Home Layout from emp_frame_2m.jpg */}
            <div className="rr-teacher-home-grid">
              {/* Left Column: Quick Absence Form with FULLY INTERACTIVE CALENDAR */}
              <div className="rr-quick-create-card">
                <h3 className="text-base font-bold text-slate-800 mb-3 flex-items-center gap-2">
                  <CalendarIcon size={18} className="text-coral" />
                  <span>Select Absence Date</span>
                </h3>

                {/* Interactive Mini Calendar */}
                <div className="rr-cal-picker-card border-0 p-0 mb-4">
                  <div className="rr-cal-header">
                    <button 
                      type="button" 
                      onClick={handlePrevMonth}
                      className="rr-cal-nav-btn"
                      title="Previous month"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <strong>{monthNames[calMonth]} {calYear}</strong>
                    <button 
                      type="button" 
                      onClick={handleNextMonth}
                      className="rr-cal-nav-btn"
                      title="Next month"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <div className="rr-mini-cal-grid">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                      <div key={i} className="rr-cal-day-head">{d}</div>
                    ))}

                    {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                      <div key={`empty-${i}`} className="rr-cal-day-empty"></div>
                    ))}

                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const dayNum = i + 1;
                      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                      const isSelected = selectedDate === dateStr;

                      return (
                        <button
                          key={dayNum}
                          type="button"
                          onClick={() => handleSelectDay(dayNum)}
                          className={`rr-cal-day-btn ${isSelected ? 'selected-navy' : ''}`}
                        >
                          {dayNum}
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Date Confirmation Display & Direct Input */}
                  <div className="selected-date-picker-row mt-3">
                    <label className="text-xs font-semibold text-slate-600 block mb-1">
                      Chosen Date:
                    </label>
                    <input 
                      type="date"
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                      className="rr-date-input"
                    />
                  </div>

                  <div className="rr-cal-legend mt-2">
                    <span className="legend-item"><span className="dot dot-navy"></span> Selected</span>
                    <span className="legend-item"><span className="dot dot-coral"></span> Day off</span>
                    <span className="legend-item"><span className="dot dot-yellow"></span> Modified</span>
                  </div>
                </div>

                <form onSubmit={handleQuickCreate} className="rr-quick-form">
                  <div className="form-group mb-3">
                    <label className="rr-field-label">Teacher Recording Absence</label>
                    <input 
                      type="text" 
                      readOnly 
                      value={`${currentTeacher.fullName} (${currentTeacher.department})`} 
                      className="rr-select-input bg-slate-100 text-slate-700 cursor-not-allowed"
                    />
                  </div>

                  <div className="form-group mb-3">
                    <label className="rr-field-label">Reason</label>
                    <select 
                      className="rr-select-input"
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                    >
                      <option value="Illness / Medical">Illness / Medical</option>
                      <option value="Personal Day">Personal Day</option>
                      <option value="School Business">School Business</option>
                      <option value="Professional Development">Professional Development</option>
                    </select>
                  </div>

                  <div className="form-group mb-3">
                    <label className="rr-field-label">Times</label>
                    <select 
                      className="rr-select-input"
                      value={times}
                      onChange={e => setTimes(e.target.value)}
                    >
                      <option value="Full Day (8:00 AM - 3:30 PM)">Full Day (8:00 AM - 3:30 PM)</option>
                      <option value="Half Day AM (8:00 AM - 11:45 AM)">Half Day AM (8:00 AM - 11:45 AM)</option>
                      <option value="Half Day PM (11:45 AM - 3:30 PM)">Half Day PM (11:45 AM - 3:30 PM)</option>
                    </select>
                  </div>

                  <div className="form-group mb-3">
                    <label className="rr-field-label">Do you need a substitute?</label>
                    <div className="flex gap-4 mt-1">
                      <label className="flex-items-center gap-2 cursor-pointer text-sm font-medium">
                        <input 
                          type="radio" 
                          name="needSub" 
                          checked={needSub === 'yes'} 
                          onChange={() => setNeedSub('yes')} 
                        />
                        Yes
                      </label>
                      <label className="flex-items-center gap-2 cursor-pointer text-sm font-medium">
                        <input 
                          type="radio" 
                          name="needSub" 
                          checked={needSub === 'no'} 
                          onChange={() => setNeedSub('no')} 
                        />
                        No
                      </label>
                    </div>
                  </div>

                  {needSub === 'yes' && (
                    <div className="form-group mb-3">
                      <select className="rr-select-input" defaultValue="Entire absence">
                        <option value="Entire absence">Entire absence</option>
                      </select>
                    </div>
                  )}

                  <div className="form-group mb-3">
                    <label className="rr-field-label">Notes for substitute</label>
                    <textarea 
                      className="rr-textarea-input"
                      rows={2}
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="e.g. Worksheets on front desk..."
                    />
                  </div>

                  <div className="flex-between mt-4">
                    <span className="text-xs text-muted">Awaiting Admin assignment</span>
                    <button 
                      type="submit" 
                      disabled={isSubmitting} 
                      className="rr-btn-quick-create"
                    >
                      {isSubmitting ? 'CREATING...' : 'QUICK CREATE'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Column: Month Calendar Overview */}
              <div className="rr-month-overview-card">
                <div className="rr-overview-header">
                  <h3>Monthly Attendance Overview</h3>
                  <div className="text-sm text-muted">{currentTeacher.fullName} • Lincoln High School ({currentTeacher.roomNumber})</div>
                </div>

                <div className="rr-big-cal-grid">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                    <div key={i} className="rr-big-cal-head">{day}</div>
                  ))}
                  {Array.from({ length: 35 }).map((_, i) => {
                    const dayNumber = (i % 30) + 1;
                    const dateMatch = teacherAbsences.some(a => {
                      const d = new Date(a.date);
                      return d.getDate() === dayNumber;
                    });
                    const isAbsenceDay = dateMatch || (dayNumber === 22 && teacherAbsences.length > 0);

                    return (
                      <div key={i} className={`rr-big-cal-cell ${isAbsenceDay ? 'cell-has-absence' : ''}`}>
                        <span className="cal-num">{dayNumber}</span>
                        {isAbsenceDay && (
                          <div className="cal-event-pill">
                            {currentTeacher.department.substring(0, 8)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Section: My Absences & Assigned Substitute Tracker */}
            <div id="my-absences-tracker" className="rr-my-absences-panel mt-6">
              <div className="rr-panel-header">
                <h3>My Absences & Substitute Coverage Status ({teacherAbsences.length})</h3>
                <span className="text-xs text-muted">Viewing as {currentTeacher.fullName}</span>
              </div>

              <div className="rr-absence-list-cards">
                {teacherAbsences.length === 0 ? (
                  <div className="rr-empty-state-p">No active absences logged for {currentTeacher.fullName}. Use the form above to record an absence.</div>
                ) : (
                  teacherAbsences.map(a => (
                    <div key={a.id} className={`rr-teacher-absence-item ${a.status === 'Filled' ? 'item-filled' : a.status === 'Offered' ? 'item-offered' : 'item-open'}`}>
                      <div className="flex-between">
                        <div>
                          <div className="flex-items-center gap-2">
                            <h4 className="absence-item-title">{a.subject} ({a.schoolName} — {a.roomNumber})</h4>
                            <span className={`rr-status-pill ${
                              a.status === 'Filled' 
                                ? 'pill-green' 
                                : a.status === 'Offered' 
                                ? 'pill-blue' 
                                : 'pill-amber'
                            }`}>
                              {a.status === 'Filled' 
                                ? 'Covered & Confirmed' 
                                : a.status === 'Offered' 
                                ? `Offered to ${a.assignedSubName} (Awaiting Acceptance)` 
                                : 'Unassigned (Waiting for Admin)'}
                            </span>
                          </div>
                          <div className="text-xs text-muted mt-1">
                            {a.date ? a.date.split('T')[0] : 'Today'} • {a.startTime} – {a.endTime} • Reason: <strong>{a.reason}</strong>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs text-muted font-mono">Conf: #{a.id.substring(0, 6)}</span>
                        </div>
                      </div>

                      {/* Coverage status detail box */}
                      <div className="rr-coverage-detail-box mt-3">
                        {a.status === 'Filled' ? (
                          <div className="flex-between items-center">
                            <div className="flex-items-center gap-2 text-sm text-success">
                              <UserCheck size={18} />
                              <span>
                                Substitute Assigned & Confirmed: <strong>{a.assignedSubName || 'Assigned Guest Educator'}</strong>
                              </span>
                            </div>
                            <div className="flex-items-center gap-3 text-xs text-muted">
                              <span className="flex-items-center gap-1"><Phone size={13} /> (614) 555-0192</span>
                              <span className="rr-conf-badge">Sub Conf #C267285</span>
                            </div>
                          </div>
                        ) : a.status === 'Offered' ? (
                          <div className="flex-items-center gap-2 text-sm text-blue-600">
                            <Clock size={18} />
                            <span>
                              School Admin assigned shift to <strong>{a.assignedSubName}</strong>. Waiting for substitute to accept or reject.
                            </span>
                          </div>
                        ) : (
                          <div className="flex-items-center gap-2 text-sm text-warning">
                            <AlertCircle size={18} />
                            <span>
                              Absence logged on live board. Waiting for School Administrator to assign a qualified substitute.
                            </span>
                          </div>
                        )}
                      </div>

                      {a.notes && (
                        <div className="text-xs text-muted mt-2 bg-slate-50 p-2 rounded">
                          <FileText size={12} className="inline mr-1" />
                          <strong>Lesson Plan Notes:</strong> {a.notes}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
