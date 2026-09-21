import React, { useState } from 'react';
import { Absence, Substitute } from '../types';
import { api } from '../services/api';
import { 
  Home, 
  Search, 
  Bell, 
  HelpCircle, 
  ChevronLeft, 
  Check, 
  X, 
  BookOpen, 
  Paperclip, 
  Navigation, 
  Phone, 
  FileText, 
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Send,
  UserCheck,
  Clock,
  AlertCircle
} from 'lucide-react';

interface SubstitutePortalProps {
  absences: Absence[];
  substitutes: Substitute[];
  onShiftClaimed: () => void;
}

export const SubstitutePortal: React.FC<SubstitutePortalProps> = ({
  absences,
  substitutes,
  onShiftClaimed,
}) => {
  // 1. Substitute Selector Dropdown
  const [selectedSubId, setSelectedSubId] = useState<string>(substitutes[0]?.id || 's1');
  
  const currentSub = substitutes.find(s => s.id === selectedSubId) || substitutes[0] || {
    id: 's1',
    fullName: 'Alex Martinez',
    phoneNumber: '(614) 555-0192',
    certifications: 'Science, Chemistry, General K-12',
    email: 'alex.sub@gmail.com',
    isAvailableToday: true,
    hoursWorkedThisWeek: 14
  };

  const [declinedIds, setDeclinedIds] = useState<string[]>([]);
  const [claimFeedback, setClaimFeedback] = useState<{ id: string; success: boolean; message: string } | null>(null);
  const [showSmsPreview, setShowSmsPreview] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  // 1. Shifts specifically assigned/offered to THIS substitute by the School Admin
  const assignedOffers = absences.filter(a => 
    a.status === 'Offered' && (
      a.assignedSubId === currentSub.id || 
      (a.assignedSubName && a.assignedSubName.toLowerCase() === currentSub.fullName.toLowerCase())
    ) && !declinedIds.includes(a.id)
  );

  // 2. Open absences waiting for Administrator assignment (cannot be claimed directly by subs)
  const unassignedAbsences = absences.filter(a => a.status === 'Open');

  // 3. Upcoming shifts confirmed & accepted by THIS selected substitute
  const myAssignments = absences.filter(a => a.status === 'Filled' && (
    a.assignedSubId === currentSub.id || 
    (a.assignedSubName && a.assignedSubName.toLowerCase() === currentSub.fullName.toLowerCase())
  ));

  // Handle Substitute accepting the assigned job
  const handleAcceptShift = async (absence: Absence) => {
    setIsClaiming(true);
    setClaimFeedback(null);

    const updated = await api.respondToOffer(absence.id, true);
    setIsClaiming(false);

    if (updated) {
      setClaimFeedback({
        id: absence.id,
        success: true,
        message: `Shift confirmed! You accepted the assignment for ${absence.subject} at ${absence.schoolName}. Added to your schedule.`,
      });
      onShiftClaimed();
    } else {
      setClaimFeedback({
        id: absence.id,
        success: false,
        message: 'Could not confirm shift. Please check connection.',
      });
    }
  };

  // Handle Substitute rejecting/declining the assigned job
  const handleDeclineShift = async (absence: Absence) => {
    setIsClaiming(true);
    setDeclinedIds(prev => [...prev, absence.id]);

    await api.respondToOffer(absence.id, false);
    setIsClaiming(false);

    setClaimFeedback({
      id: absence.id,
      success: true,
      message: `Shift rejected. Returned to School Administrator for reassignment.`,
    });
    onShiftClaimed();
  };

  // Get initials for current avatar
  const initials = currentSub.fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2);

  return (
    <div className="rr-portal-container">
      {/* 1. Global Announcement Banner */}
      <div className="rr-top-banner">
        <span className="banner-label">MESSAGE from Mishoreline Area Schools:</span>
        <span className="banner-text">New Daily Health Check-In Process</span>
      </div>

      <div className="rr-portal-body">
        {/* 2. Left Navy Sidebar - Only necessary tab (Home) */}
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
              <span>Home & Assignments</span>
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

              {/* SUBSTITUTE PICKER DROPDOWN */}
              <div className="rr-sub-dropdown-badge">
                <label className="text-xs font-bold text-slate-500 mr-2 flex-items-center gap-1">
                  <UserCheck size={14} className="text-primary" />
                  <span>Substitute Persona:</span>
                </label>
                <select 
                  value={selectedSubId} 
                  onChange={e => setSelectedSubId(e.target.value)}
                  className="rr-sub-select-dropdown"
                >
                  {substitutes.map(sub => (
                    <option key={sub.id} value={sub.id}>
                      {sub.fullName} ({sub.certifications})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rr-header-actions">
              <button 
                className="rr-btn-sms-toggle"
                onClick={() => setShowSmsPreview(!showSmsPreview)}
                title="Toggle 6:00 AM SMS simulation"
              >
                <Smartphone size={15} />
                <span>6:00 AM SMS Dispatch View</span>
              </button>

              <button className="rr-header-btn" title="Notifications">
                <Bell size={18} />
                {assignedOffers.length > 0 && <span className="rr-dot-indicator"></span>}
              </button>
              <button className="rr-header-btn" title="Help">
                <HelpCircle size={18} />
              </button>
              <div className="rr-avatar-circle sub-avatar" title={`${currentSub.fullName} (${currentSub.certifications})`}>
                {initials}
              </div>
            </div>
          </header>

          <main className="rr-content-area">
            {/* Active Sub Profile Bar */}
            <div className="rr-sub-profile-banner mb-4">
              <div className="flex-between">
                <div className="flex-items-center gap-3">
                  <div className="rr-avatar-circle sub-avatar">
                    {initials}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{currentSub.fullName}</h3>
                    <div className="text-xs text-muted">
                      📞 {currentSub.phoneNumber} • Certified: <strong>{currentSub.certifications}</strong>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="rr-status-pill pill-green">Available for Assignment</span>
                  <div className="text-xs text-muted mt-1">{myAssignments.length} confirmed assignment(s)</div>
                </div>
              </div>
            </div>

            {claimFeedback && (
              <div className={`rr-alert-banner ${claimFeedback.success ? 'rr-alert-success' : 'rr-alert-conflict'} mb-4`}>
                {claimFeedback.success ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                <span>{claimFeedback.message}</span>
              </div>
            )}

            {/* 6:00 AM SMS Dispatch Simulation (from sub_frame_8m.jpg) */}
            {showSmsPreview && (
              <div className="rr-sms-simulation-card mb-6">
                <div className="sms-header">
                  <span className="text-xs text-muted">
                    Incoming SMS Blast • To {currentSub.phoneNumber} ({currentSub.fullName})
                  </span>
                  <button className="rr-btn-close" onClick={() => setShowSmsPreview(false)}>✕</button>
                </div>
                <div className="sms-bubble">
                  <p><strong>Want to sub?</strong></p>
                  {assignedOffers.length > 0 ? (
                    <>
                      <p>For {assignedOffers[0].teacherName}, {assignedOffers[0].subject}</p>
                      <p>@ {assignedOffers[0].schoolName} ({assignedOffers[0].roomNumber})</p>
                      <p>{assignedOffers[0].date ? assignedOffers[0].date.split('T')[0] : 'Tomorrow'} • {assignedOffers[0].startTime} - {assignedOffers[0].endTime}</p>
                      <p className="mt-1 text-slate-600 text-xs">Admin assigned this job to you. Reply to accept or reject.</p>
                      <p className="mt-2 text-primary font-mono font-bold">Reply Yes1350 to accept or No1350 to decline</p>
                    </>
                  ) : (
                    <p>No new shifts assigned to you by the School Administrator right now.</p>
                  )}
                </div>
                {assignedOffers.length > 0 && (
                  <div className="sms-actions mt-3 flex gap-2">
                    <button 
                      className="rr-btn-sms-reply"
                      onClick={() => handleAcceptShift(assignedOffers[0])}
                    >
                      <Send size={13} /> Quick Reply: "Yes1350" (Accept as {currentSub.fullName})
                    </button>
                    <button 
                      className="rr-btn-decline-shift"
                      onClick={() => handleDeclineShift(assignedOffers[0])}
                    >
                      <X size={13} /> Quick Reply: "No1350" (Decline)
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* SECTION 1: SHIFTS ASSIGNED BY ADMIN TO THIS SUBSTITUTE */}
            <div id="assigned-offers-section" className="rr-sub-section mb-6">
              <div className="rr-section-title-row">
                <h3 className="rr-section-heading flex-items-center gap-2">
                  <span>Shift Assignments from School Administrator ({assignedOffers.length})</span>
                </h3>
                <span className="text-xs text-muted">Requires your confirmation</span>
              </div>

              {assignedOffers.length === 0 ? (
                <div className="rr-empty-state-p">
                  <Clock size={24} className="text-blue-500 inline mr-2" />
                  <strong>No shifts currently waiting for your confirmation.</strong>
                  <div className="text-xs text-muted mt-1">
                    Under Red Rover dispatch rules, substitutes wait for a School Administrator to assign a shift from the Live Board before accepting or rejecting.
                  </div>
                </div>
              ) : (
                <div className="rr-opportunities-grid">
                  {assignedOffers.map(shift => (
                    <div key={shift.id} className="rr-opportunity-card border-top-blue">
                      <div className="flex-between">
                        <div>
                          <h4 className="opp-title">{shift.subject}</h4>
                          <div className="opp-school">{shift.schoolName} — {shift.roomNumber}</div>
                        </div>
                        <span className="rr-status-pill pill-blue">Assigned to You</span>
                      </div>

                      <div className="opp-details mt-2">
                        <div><strong>Teacher:</strong> {shift.teacherName}</div>
                        <div><strong>Hours:</strong> {shift.startTime} – {shift.endTime}</div>
                        <div><strong>Date:</strong> {shift.date ? shift.date.split('T')[0] : 'Today'}</div>
                        <div><strong>Reason:</strong> {shift.reason}</div>
                      </div>

                      {shift.notes && (
                        <div className="opp-notes mt-2">
                          <strong>Lesson Plan:</strong> {shift.notes}
                        </div>
                      )}

                      <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800 mt-3 flex-items-center gap-2">
                        <AlertCircle size={15} className="flex-shrink-0" />
                        <span>The school administrator assigned this shift to you. Please accept or reject:</span>
                      </div>

                      <div className="opp-actions mt-4">
                        <button
                          className="rr-btn-accept-shift"
                          disabled={isClaiming}
                          onClick={() => handleAcceptShift(shift)}
                        >
                          <Check size={16} /> ACCEPT ASSIGNMENT
                        </button>
                        <button
                          className="rr-btn-decline-shift"
                          disabled={isClaiming}
                          onClick={() => handleDeclineShift(shift)}
                        >
                          <X size={16} /> REJECT
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* UNASSIGNED ABSENCES NOTICE */}
            {unassignedAbsences.length > 0 && (
              <div className="mb-6 p-3 bg-slate-100 border border-slate-200 rounded-lg flex-between items-center text-xs text-slate-600">
                <div className="flex-items-center gap-2">
                  <AlertTriangle size={15} className="text-amber-500" />
                  <span>
                    <strong>{unassignedAbsences.length} unassigned absence(s)</strong> logged in district. Waiting for School Administrator dispatch.
                  </span>
                </div>
                <span className="text-muted">Substitutes cannot self-claim unassigned jobs</span>
              </div>
            )}

            {/* SECTION 2: UPCOMING CONFIRMED ASSIGNMENTS TRACKER (from sub_frame_1m.jpg) */}
            <div id="my-schedule-section" className="rr-sub-section">
              <h3 className="rr-section-heading">
                Upcoming assignments for {currentSub.fullName} ({myAssignments.length})
              </h3>

              <div className="rr-upcoming-layout-grid">
                {/* Left Column: Assignment Cards with 5 Official Icons */}
                <div className="rr-assignment-cards-col">
                  {myAssignments.length === 0 ? (
                    <div className="rr-empty-state-p">
                      No accepted assignments yet for {currentSub.fullName}. Once you accept an assigned shift above, it will appear here.
                    </div>
                  ) : (
                    myAssignments.map((job) => (
                      <div key={job.id} className="rr-assignment-card">
                        <div className="flex-between items-start">
                          <div>
                            <div className="assignment-date-title">
                              {job.date ? job.date.split('T')[0] : 'Upcoming Date'}
                              <span className="conf-num font-mono"> (#{job.id.substring(0, 6)})</span>
                            </div>
                            <div className="assignment-school">{job.schoolName} (Room: {job.roomNumber})</div>
                            <div className="assignment-teacher-grade">{job.subject} for {job.teacherName}</div>
                            <div className="assignment-hours">{job.startTime} - {job.endTime}</div>
                          </div>

                          {/* The 5 Official Quick Action Icons from sub_frame_1m.jpg */}
                          <div className="rr-quick-icons-cluster">
                            <button className="icon-btn" title="View Lesson Plan">
                              <BookOpen size={16} />
                            </button>
                            <button className="icon-btn" title="View Worksheet Attachments">
                              <Paperclip size={16} />
                            </button>
                            <button className="icon-btn" title="Driving Directions & Map">
                              <Navigation size={16} />
                            </button>
                            <button className="icon-btn" title="Call School Office">
                              <Phone size={16} />
                            </button>
                            <button className="icon-btn" title="Admin Notes">
                              <FileText size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Right Column: Mini Calendar from sub_frame_1m.jpg */}
                <div className="rr-assignment-cal-col">
                  <div className="rr-cal-picker-card">
                    <div className="text-center font-bold text-sm mb-3">
                      September - October 2026
                    </div>

                    <div className="rr-mini-cal-grid">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                        <div key={i} className="rr-cal-day-head">{d}</div>
                      ))}
                      {Array.from({ length: 35 }).map((_, i) => {
                        const num = (i % 30) + 1;
                        const isAssigned = myAssignments.some(a => {
                          const d = new Date(a.date);
                          return d.getDate() === num;
                        }) || (num === 21 && myAssignments.length > 0);

                        return (
                          <div key={i} className={`rr-cal-day-num ${isAssigned ? 'assigned-navy' : ''}`}>
                            {num}
                          </div>
                        );
                      })}
                    </div>

                    <div className="rr-cal-legend mt-4">
                      <span className="legend-item"><span className="dot dot-navy"></span> Assigned shift</span>
                      <span className="legend-item"><span className="dot dot-grey"></span> Available</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
