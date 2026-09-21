import React, { useState } from 'react';
import { Absence, Substitute, CreateAbsenceDto } from '../types';
import { api } from '../services/api';
import { 
  Home, 
  GitBranch, 
  Search, 
  PlusSquare, 
  Bell, 
  HelpCircle, 
  ChevronDown, 
  ChevronRight, 
  ChevronUp,
  Clock, 
  MoreVertical, 
  Star, 
  Check, 
  Eye, 
  BarChart2, 
  ChevronLeft,
  Paperclip,
  CheckCircle2,
  Calendar as CalendarIcon
} from 'lucide-react';

interface AdminPortalProps {
  absences: Absence[];
  substitutes: Substitute[];
  onRefresh: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  absences,
  substitutes,
  onRefresh,
}) => {
  const [activeMenu, setActiveMenu] = useState<'home' | 'createAbsence'>('home');
  const [isAbsenceMenuOpen, setIsAbsenceMenuOpen] = useState(true);
  const [unfilledOpen, setUnfilledOpen] = useState(true);
  const [filledOpen, setFilledOpen] = useState(true);
  const [noSubOpen, setNoSubOpen] = useState(false);

  // Pre-assign substitute modal state
  const [assigningAbsence, setAssigningAbsence] = useState<Absence | null>(null);
  const [actionMenuAbsenceId, setActionMenuAbsenceId] = useState<string | null>(null);

  // Form State for "Create Absence" with interactive calendar
  const [calYear, setCalYear] = useState<number>(2026);
  const [calMonth, setCalMonth] = useState<number>(8); // 8 = September (0-indexed)
  const [createDate, setCreateDate] = useState('2026-09-22');
  const [selectedTeacherName, setSelectedTeacherName] = useState('Sarah Johnson');
  const [selectedSchool, setSelectedSchool] = useState('Lincoln High School');
  const [selectedReason, setSelectedReason] = useState('School Business');
  const [selectedTimes, setSelectedTimes] = useState('Full Day (8:30 AM - 4:30 PM)');
  const [accountingCode, setAccountingCode] = useState('ES Sub');
  const [payCode, setPayCode] = useState('Teacher - Standard');
  const [subNotes, setSubNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdSuccess, setCreatedSuccess] = useState<string | null>(null);

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

  const unfilledAbsences = absences.filter(a => a.status === 'Open' || a.status === 'Offered');
  const filledAbsences = absences.filter(a => a.status === 'Filled');

  // Handle Assigning Sub: sets status to 'Offered' so substitute can Accept or Reject!
  const handleAssignSub = async (sub: Substitute) => {
    if (!assigningAbsence) return;
    await api.overrideAssignment(assigningAbsence.id, sub.id, sub.fullName, 'Offered');
    setAssigningAbsence(null);
    onRefresh();
  };

  // Handle Remove/Unassign Sub
  const handleRemoveSub = async (absence: Absence) => {
    await api.overrideAssignment(absence.id, '', '');
    setActionMenuAbsenceId(null);
    onRefresh();
  };

  // Handle Create Absence submission
  const handleCreateAbsence = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const dto: CreateAbsenceDto = {
      schoolId: '1',
      schoolName: selectedSchool,
      teacherId: 't1',
      teacherName: selectedTeacherName,
      subject: '10th Grade Chemistry',
      roomNumber: 'Room 204',
      reason: selectedReason,
      startTime: selectedTimes.includes('Half Day PM') ? '12:30 PM' : '08:30 AM',
      endTime: selectedTimes.includes('Half Day AM') ? '12:30 PM' : '04:30 PM',
      notes: subNotes || 'No Notes Specified',
      date: createDate,
    };

    await api.createAbsence(dto);
    setIsSubmitting(false);
    setCreatedSuccess(`Absence created successfully for ${selectedTeacherName} on ${createDate}!`);
    onRefresh();
    setTimeout(() => {
      setCreatedSuccess(null);
      setActiveMenu('home');
    }, 1500);
  };

  return (
    <div className="rr-portal-container">
      {/* 1. Global Announcement Banner */}
      <div className="rr-top-banner">
        <span className="banner-label">MESSAGE from Mishoreline Area Schools:</span>
        <span className="banner-text">New Daily Health Check-In Process</span>
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
            <button 
              className={`rr-nav-item ${activeMenu === 'home' ? 'active' : ''}`}
              onClick={() => setActiveMenu('home')}
            >
              <Home size={18} className="rr-nav-icon" />
              <span>Home</span>
            </button>

            {/* Absence & Vacancy -> Create Absence */}
            <div className="rr-nav-group">
              <button 
                className="rr-nav-item rr-nav-parent"
                onClick={() => setIsAbsenceMenuOpen(!isAbsenceMenuOpen)}
              >
                <GitBranch size={18} className="rr-nav-icon" />
                <span>Absence & Vacancy</span>
                {isAbsenceMenuOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>

              {isAbsenceMenuOpen && (
                <div className="rr-nav-subitems">
                  <button 
                    className={`rr-sub-item ${activeMenu === 'createAbsence' ? 'sub-active' : ''}`}
                    onClick={() => setActiveMenu('createAbsence')}
                  >
                    Create Absence
                  </button>
                </div>
              )}
            </div>
          </nav>
        </aside>

        {/* 3. Main Content Container */}
        <div className="rr-main-wrapper">
          {/* Top Header Bar */}
          <header className="rr-header">
            <div className="rr-search-box">
              <Search size={16} className="rr-search-icon" />
              <input type="text" placeholder="Search" />
            </div>

            <div className="rr-header-actions">
              <button 
                className="rr-header-btn" 
                title="Create Absence"
                onClick={() => setActiveMenu('createAbsence')}
              >
                <PlusSquare size={18} />
              </button>
              <button className="rr-header-btn" title="Notifications">
                <Bell size={18} />
                <span className="rr-dot-indicator"></span>
              </button>
              <button className="rr-header-btn" title="Help Center">
                <HelpCircle size={18} />
              </button>
              <div className="rr-avatar-circle" title="Admin User">
                KL
              </div>
            </div>
          </header>

          {/* VIEW A: HOME / DAILY REPORT (ACCORDION LIVE BOARD) */}
          {activeMenu === 'home' && (
            <main className="rr-content-area">
              {/* Accordion 1: Unfilled (Open Absences) */}
              <div className="rr-accordion-card">
                <button 
                  className={`rr-accordion-header ${unfilledAbsences.length > 0 ? 'header-alert' : ''}`}
                  onClick={() => setUnfilledOpen(!unfilledOpen)}
                >
                  <span className="rr-accordion-title">
                    Unfilled ({unfilledAbsences.length})
                  </span>
                  {unfilledOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {unfilledOpen && (
                  <div className="rr-accordion-body">
                    {unfilledAbsences.length === 0 ? (
                      <div className="rr-empty-row">No unfilled absences at this time. All absences are covered!</div>
                    ) : (
                      <table className="rr-board-table">
                        <thead>
                          <tr>
                            <th>Employee</th>
                            <th>Reason</th>
                            <th>School</th>
                            <th>Date / Created</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {unfilledAbsences.map(absence => (
                            <tr key={absence.id} className="rr-row-unfilled">
                              <td>
                                <div className="rr-emp-cell">
                                  <div className="rr-avatar-sm">
                                    {absence.teacherName.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="rr-emp-name">{absence.teacherName}</div>
                                    <div className="rr-emp-sub">{absence.subject}</div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="rr-reason-tag text-danger">{absence.reason}</div>
                                <div className="rr-text-muted text-xs">{absence.date ? absence.date.split('T')[0] : 'Today'}</div>
                              </td>
                              <td>
                                <div className="rr-school-cell">
                                  <span className="rr-dot-blue"></span>
                                  <div>
                                    <div className="rr-school-name">{absence.schoolName}</div>
                                    <div className="rr-text-muted text-xs">{absence.startTime} - {absence.endTime}</div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="flex-items-center gap-1 text-muted text-xs">
                                  <Clock size={13} />
                                  <span>{absence.date ? absence.date.split('T')[0] : 'Just now'}</span>
                                </div>
                              </td>
                              <td>
                                {absence.status === 'Offered' ? (
                                  <div className="flex-items-center gap-2">
                                    <div className="text-left">
                                      <span className="rr-status-pill pill-blue">Offered: {absence.assignedSubName}</span>
                                      <div className="text-xs text-muted mt-1">Awaiting sub confirmation</div>
                                    </div>
                                    <button 
                                      className="rr-btn-outline text-xs"
                                      onClick={() => setAssigningAbsence(absence)}
                                      title="Reassign to another substitute"
                                    >
                                      REASSIGN
                                    </button>
                                  </div>
                                ) : (
                                  <button 
                                    className="rr-btn-assign"
                                    onClick={() => setAssigningAbsence(absence)}
                                  >
                                    ASSIGN
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>

              {/* Accordion 2: Filled Absences */}
              <div className="rr-accordion-card mt-4">
                <button 
                  className="rr-accordion-header header-filled"
                  onClick={() => setFilledOpen(!filledOpen)}
                >
                  <span className="rr-accordion-title text-coral">
                    Filled ({filledAbsences.length})
                  </span>
                  {filledOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {filledOpen && (
                  <div className="rr-accordion-body">
                    <div className="rr-subgroup-header">
                      <span>Teacher ({filledAbsences.length})</span>
                      <ChevronUp size={14} />
                    </div>

                    <table className="rr-board-table">
                      <thead>
                        <tr>
                          <th>Employee</th>
                          <th>Reason</th>
                          <th>School</th>
                          <th>Date</th>
                          <th>Substitute</th>
                          <th>Conf#</th>
                          <th style={{ width: '40px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filledAbsences.map(absence => (
                          <tr key={absence.id}>
                            <td>
                              <div className="rr-emp-cell">
                                <div className="rr-avatar-sm">
                                  {absence.teacherName.charAt(0)}
                                </div>
                                <div>
                                  <div className="rr-emp-name">{absence.teacherName}</div>
                                  <div className="rr-emp-sub">{absence.subject}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="rr-reason-tag">{absence.reason}</div>
                              <div className="rr-text-muted text-xs">{absence.date ? absence.date.split('T')[0] : 'Today'}</div>
                            </td>
                            <td>
                              <div className="rr-school-cell">
                                <span className="rr-dot-blue"></span>
                                <div>
                                  <div className="rr-school-name">{absence.schoolName}</div>
                                  <div className="rr-text-muted text-xs">{absence.startTime} - {absence.endTime}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="flex-items-center gap-1 text-muted text-xs">
                                <Clock size={13} />
                                <span>{absence.date ? absence.date.split('T')[0] : 'Today'}</span>
                              </div>
                            </td>
                            <td>
                              <div className="rr-sub-assigned-cell">
                                <div className="rr-avatar-sub">
                                  {absence.assignedSubName ? absence.assignedSubName.charAt(0) : 'S'}
                                </div>
                                <div>
                                  <div className="flex-items-center gap-1">
                                    <span className="rr-sub-name">{absence.assignedSubName || 'Assigned Guest Teacher'}</span>
                                    <span className="rr-info-badge">i</span>
                                  </div>
                                  <div className="rr-text-muted text-xs">{absence.startTime} - {absence.endTime}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="rr-conf-links">
                                <span className="rr-conf-link">#{absence.id.substring(0, 6)}</span>
                                <span className="rr-conf-link text-xs text-muted">#C267285</span>
                              </div>
                            </td>
                            <td>
                              <div className="relative">
                                <button 
                                  className="rr-btn-dots"
                                  onClick={() => setActionMenuAbsenceId(actionMenuAbsenceId === absence.id ? null : absence.id)}
                                >
                                  <MoreVertical size={16} />
                                </button>
                                {actionMenuAbsenceId === absence.id && (
                                  <div className="rr-popover-menu">
                                    <button onClick={() => setAssigningAbsence(absence)}>Reassign</button>
                                    <button onClick={() => handleRemoveSub(absence)} className="text-danger">Remove Sub</button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Accordion 3: No Sub Required */}
              <div className="rr-accordion-card mt-4">
                <button 
                  className="rr-accordion-header header-nosub"
                  onClick={() => setNoSubOpen(!noSubOpen)}
                >
                  <span className="rr-accordion-title text-muted">
                    No sub required (0)
                  </span>
                  {noSubOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {noSubOpen && (
                  <div className="rr-accordion-body">
                    <div className="rr-empty-row">No absences marked without substitute coverage.</div>
                  </div>
                )}
              </div>
            </main>
          )}

          {/* VIEW B: ABSENCE & VACANCY -> CREATE ABSENCE */}
          {activeMenu === 'createAbsence' && (
            <main className="rr-content-area">
              {createdSuccess && (
                <div className="rr-alert-success mb-4">
                  <CheckCircle2 size={18} />
                  <span>{createdSuccess}</span>
                </div>
              )}

              <form onSubmit={handleCreateAbsence} className="rr-create-absence-grid">
                {/* Left Column: Interactive Calendar & Date Blocks */}
                <div className="rr-create-left">
                  {/* Calendar Widget */}
                  <div className="rr-cal-picker-card">
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
                        const isSelected = createDate === dateStr;

                        return (
                          <button
                            key={dayNum}
                            type="button"
                            onClick={() => setCreateDate(dateStr)}
                            className={`rr-cal-day-btn ${isSelected ? 'selected-navy' : ''}`}
                          >
                            {dayNum}
                          </button>
                        );
                      })}
                    </div>

                    <div className="selected-date-picker-row mt-3">
                      <label className="text-xs font-semibold text-slate-600 block mb-1">
                        Absence Date:
                      </label>
                      <input 
                        type="date"
                        value={createDate}
                        onChange={e => setCreateDate(e.target.value)}
                        className="rr-date-input"
                      />
                    </div>

                    {/* Color Legend */}
                    <div className="rr-cal-legend">
                      <span className="legend-item"><span className="dot dot-navy"></span> Selected Date</span>
                      <span className="legend-item"><span className="dot dot-coral"></span> Day off</span>
                    </div>
                  </div>

                  {/* Day Entry Block */}
                  <div className="rr-day-block-card mt-4">
                    <div className="font-semibold text-sm mb-3">Absence Details: {createDate}</div>
                    
                    <div className="form-group mb-3">
                      <label className="rr-field-label">Teacher</label>
                      <select 
                        className="rr-select-input"
                        value={selectedTeacherName}
                        onChange={e => setSelectedTeacherName(e.target.value)}
                      >
                        <option value="Sarah Johnson">Sarah Johnson (Science - Lincoln High)</option>
                        <option value="Robert Davis">Robert Davis (Social Studies - Lincoln High)</option>
                        <option value="Emily White">Emily White (English - Roosevelt Middle)</option>
                        <option value="Michael Chen">Michael Chen (Elementary - Washington Elementary)</option>
                      </select>
                    </div>

                    <div className="form-group mb-3">
                      <label className="rr-field-label">Reason</label>
                      <select 
                        className="rr-select-input"
                        value={selectedReason}
                        onChange={e => setSelectedReason(e.target.value)}
                      >
                        <option value="School Business">School Business</option>
                        <option value="Illness / Medical">Illness / Medical</option>
                        <option value="Personal Day">Personal Day</option>
                        <option value="Professional Development">Professional Development</option>
                      </select>
                    </div>

                    <div className="form-group mb-3">
                      <label className="rr-field-label">Times</label>
                      <select 
                        className="rr-select-input"
                        value={selectedTimes}
                        onChange={e => setSelectedTimes(e.target.value)}
                      >
                        <option value="Full Day (8:30 AM - 4:30 PM)">Full Day (8:30 AM - 4:30 PM)</option>
                        <option value="Half Day AM (8:30 AM - 12:30 PM)">Half Day AM (8:30 AM - 12:30 PM)</option>
                        <option value="Half Day PM (12:30 PM - 4:30 PM)">Half Day PM (12:30 PM - 4:30 PM)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Right Column: Substitute Details & Notes */}
                <div className="rr-create-right">
                  <div className="rr-options-card">
                    <div className="flex-items-center gap-4 mb-4">
                      <label className="flex-items-center gap-2 cursor-pointer text-sm">
                        <input type="checkbox" /> Hide from subs
                      </label>
                      <label className="flex-items-center gap-2 cursor-pointer text-sm">
                        <input type="checkbox" defaultChecked /> Allow sub to accept part
                      </label>
                    </div>

                    <div className="form-grid-2 mb-4">
                      <div>
                        <label className="rr-field-label">Accounting code</label>
                        <select 
                          className="rr-select-input"
                          value={accountingCode}
                          onChange={e => setAccountingCode(e.target.value)}
                        >
                          <option value="ES Sub">ES Sub</option>
                          <option value="MS Sub">MS Sub</option>
                          <option value="HS Sub">HS Sub</option>
                          <option value="Title I">Title I Grant</option>
                        </select>
                      </div>

                      <div>
                        <label className="rr-field-label">Pay code</label>
                        <select 
                          className="rr-select-input"
                          value={payCode}
                          onChange={e => setPayCode(e.target.value)}
                        >
                          <option value="Teacher - Standard">Teacher - Standard</option>
                          <option value="Teacher - Long Term">Teacher - Long Term</option>
                        </select>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="rr-field-label">Notes to substitute</label>
                      <div className="text-xs text-muted mb-1">
                        Can be seen by the administrator, employee, and substitute
                      </div>
                      <textarea 
                        className="rr-textarea-input"
                        rows={3}
                        placeholder="Enter notes for substitute"
                        value={subNotes}
                        onChange={e => setSubNotes(e.target.value)}
                      />
                    </div>

                    <div className="rr-drag-drop-zone">
                      <Paperclip size={16} className="text-muted inline-block mr-1" />
                      <span className="text-primary font-medium cursor-pointer">Add file(s) or drag here</span>
                      <div className="text-xs text-muted mt-1">max 5MB; .pdf, .txt, .docx, .xlsx, .pptx, .jpg, .gif, .tiff, .png</div>
                    </div>
                  </div>
                </div>

                {/* Sticky Bottom Bar */}
                <div className="rr-bottom-bar">
                  <span className="text-sm text-muted">Ready to broadcast absence to substitute roster</span>
                  <button type="submit" disabled={isSubmitting} className="rr-btn-primary-blue">
                    {isSubmitting ? 'CREATING...' : 'CREATE ABSENCE'}
                  </button>
                </div>
              </form>
            </main>
          )}
        </div>
      </div>

      {/* 4. REAL PRE-ASSIGN SUBSTITUTE MODAL (from admin_frame_2m.jpg) */}
      {assigningAbsence && (
        <div className="rr-modal-overlay" onClick={() => setAssigningAbsence(null)}>
          <div className="rr-modal-window" onClick={e => e.stopPropagation()}>
            <div className="rr-modal-header">
              <h3>{substitutes.length} substitutes available for assignment</h3>
              <button className="rr-btn-close" onClick={() => setAssigningAbsence(null)}>✕</button>
            </div>

            <div className="rr-modal-table-scroll">
              <table className="rr-sub-candidate-table">
                <thead>
                  <tr>
                    <th>Favorite</th>
                    <th></th>
                    <th>First name</th>
                    <th>Last name</th>
                    <th>Primary phone</th>
                    <th>Qualified</th>
                    <th>Available</th>
                    <th className="th-visible">Visible</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {substitutes.map((sub, idx) => (
                    <tr key={sub.id}>
                      <td className="text-center">
                        <Star size={16} className={idx === 0 ? "text-amber fill-amber" : "text-muted opacity-40"} />
                      </td>
                      <td>
                        <div className="rr-avatar-candidate">
                          {sub.fullName.charAt(0)}
                        </div>
                      </td>
                      <td className="font-semibold">{sub.fullName.split(' ')[0]}</td>
                      <td>{sub.fullName.split(' ')[1] || 'Sub'}</td>
                      <td className="text-muted">{sub.phoneNumber}</td>
                      <td className="text-center">
                        <BarChart2 size={16} className="text-primary inline-block" />
                      </td>
                      <td className="text-center">
                        <Check size={16} className="text-success inline-block font-bold" />
                      </td>
                      <td className="td-visible text-center">
                        <Eye size={16} className="text-secondary inline-block" />
                      </td>
                      <td>
                        <button 
                          className="rr-btn-assign-action"
                          onClick={() => handleAssignSub(sub)}
                        >
                          ASSIGN
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
