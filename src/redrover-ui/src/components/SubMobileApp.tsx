import React, { useState } from 'react';
import { Absence, Substitute } from '../types';
import { api } from '../services/api';
import { 
  Smartphone, 
  MapPin, 
  Clock, 
  BookOpen, 
  CheckCircle, 
  AlertTriangle, 
  ExternalLink,
  Calendar,
  Briefcase
} from 'lucide-react';

interface SubMobileAppProps {
  absences: Absence[];
  substitutes: Substitute[];
  onShiftClaimed: () => void;
  onOpenVideo: (key: string) => void;
}

export const SubMobileApp: React.FC<SubMobileAppProps> = ({
  absences,
  substitutes,
  onShiftClaimed,
  onOpenVideo,
}) => {
  const [activeSubId, setActiveSubId] = useState(substitutes[0]?.id || 's1');
  const [claimStatus, setClaimStatus] = useState<{ id: string; success: boolean; message: string } | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);

  const activeSub = substitutes.find(s => s.id === activeSubId) || substitutes[0] || {
    id: 's1',
    fullName: 'Alex Martinez',
    email: 'alex.sub@gmail.com',
    certifications: 'Science, Chemistry, General K-12',
    hoursWorkedThisWeek: 14,
  };

  const openAbsences = absences.filter(a => a.status === 'Open');
  const myAcceptedJobs = absences.filter(a => a.status === 'Filled' && a.assignedSubName === activeSub.fullName);

  const handleClaim = async (absence: Absence) => {
    setIsClaiming(true);
    setClaimStatus(null);

    const result = await api.claimShift(absence.id, activeSub.id, activeSub.fullName, absence.version);

    setIsClaiming(false);
    if (result.success) {
      setClaimStatus({
        id: absence.id,
        success: true,
        message: `🎉 Shift Accepted! You are assigned to ${absence.subject} at ${absence.schoolName}.`,
      });
      onShiftClaimed();
    } else {
      setClaimStatus({
        id: absence.id,
        success: false,
        message: result.error || 'Assignment was already claimed by another substitute teacher.',
      });
      onShiftClaimed();
    }
  };

  return (
    <div className="tab-content sub-mobile-app">
      <div className="section-header-banner">
        <div>
          <h2>Substitute Mobile Experience (PWA Simulation)</h2>
          <p className="subtitle">
            Modeled after Red Rover's <strong>Substitute Basic Training</strong>.
            Guest educators receive instant shift alerts on mobile, inspect lesson plans, and claim jobs in 1-tap.
          </p>
        </div>
        <button className="btn-secondary flex-items-center gap-2" onClick={() => onOpenVideo('substitute')}>
          <ExternalLink size={15} />
          <span>Watch Substitute Training Video</span>
        </button>
      </div>

      <div className="sub-app-layout">
        {/* Mobile Mockup Device */}
        <div className="mobile-frame-wrapper">
          <div className="mobile-frame">
            <div className="mobile-speaker"></div>
            
            {/* Mobile App Header */}
            <div className="mobile-app-header">
              <div className="flex-between">
                <div>
                  <div className="mobile-title">Red Rover Mobile</div>
                  <div className="mobile-sub-name">{activeSub.fullName}</div>
                </div>
                <span className="badge badge-success text-xs">Available Today</span>
              </div>
              <div className="sub-cert-tags">
                <small className="text-muted">{activeSub.certifications}</small>
              </div>
            </div>

            {/* Mobile App Scrollable Content */}
            <div className="mobile-app-body">
              {claimStatus && (
                <div className={`mobile-banner ${claimStatus.success ? 'banner-success' : 'banner-conflict'}`}>
                  {claimStatus.success ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                  <div>{claimStatus.message}</div>
                </div>
              )}

              {/* Section 1: Open Opportunities */}
              <div className="mobile-section">
                <div className="mobile-section-title">
                  <Briefcase size={14} /> Available Shifts Today ({openAbsences.length})
                </div>

                {openAbsences.length === 0 ? (
                  <div className="mobile-empty-state">
                    <CheckCircle size={32} className="text-muted" />
                    <p>No open shifts available right now.</p>
                    <small className="text-muted">You're all caught up! New alerts will appear automatically via SignalR push.</small>
                  </div>
                ) : (
                  openAbsences.map(absence => (
                    <div key={absence.id} className="mobile-job-card">
                      <div className="mobile-job-header">
                        <h4>{absence.subject}</h4>
                        <span className="badge badge-open">Open</span>
                      </div>

                      <div className="mobile-job-meta">
                        <div className="meta-row">
                          <MapPin size={13} />
                          <span>{absence.schoolName} ({absence.roomNumber})</span>
                        </div>
                        <div className="meta-row">
                          <BookOpen size={13} />
                          <span>Teacher: {absence.teacherName}</span>
                        </div>
                        <div className="meta-row">
                          <Clock size={13} />
                          <span>{absence.startTime} – {absence.endTime}</span>
                        </div>
                      </div>

                      <div className="mobile-lesson-note">
                        <strong>Lesson Notes:</strong> {absence.notes || 'Standard curriculum plans provided at classroom desk.'}
                      </div>

                      <button
                        className="btn-claim-shift"
                        disabled={isClaiming}
                        onClick={() => handleClaim(absence)}
                      >
                        {isClaiming ? 'Claiming...' : 'Accept Shift (1-Tap)'}
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Section 2: My Accepted Schedule */}
              <div className="mobile-section mt-4">
                <div className="mobile-section-title">
                  <Calendar size={14} /> My Confirmed Shifts ({myAcceptedJobs.length})
                </div>

                {myAcceptedJobs.length === 0 ? (
                  <div className="mobile-empty-state">
                    <small className="text-muted">No shifts booked today for {activeSub.fullName}.</small>
                  </div>
                ) : (
                  myAcceptedJobs.map(job => (
                    <div key={job.id} className="mobile-job-card confirmed-card">
                      <div className="mobile-job-header">
                        <h4>{job.subject}</h4>
                        <span className="badge badge-filled">Confirmed</span>
                      </div>
                      <div className="mobile-job-meta">
                        <div><MapPin size={13} className="inline-icon" /> {job.schoolName} — {job.roomNumber}</div>
                        <div><Clock size={13} className="inline-icon" /> {job.startTime} – {job.endTime}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mobile-home-bar"></div>
          </div>
        </div>

        {/* Sidebar Controls for Interview Demo */}
        <div className="sub-simulator-controls">
          <div className="info-card">
            <h4>Substitute Simulator Controls</h4>
            <p className="text-sm text-muted">
              Select which guest educator persona you want to simulate on the mobile device:
            </p>

            <label className="form-label mt-3">Active Substitute Persona:</label>
            <select
              className="form-select"
              value={activeSubId}
              onChange={e => setActiveSubId(e.target.value)}
            >
              {substitutes.map(s => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.certifications})
                </option>
              ))}
            </select>

            <hr className="divider mt-4 mb-4" />

            <h4>Concurrency & Double-Booking Protection</h4>
            <p className="text-sm text-muted">
              In high-demand districts, multiple substitutes receive the 6:00 AM push notification simultaneously.
              Red Rover uses <strong>Optimistic Concurrency Control</strong> with database row version tokens:
            </p>
            <ul className="info-list text-sm">
              <li>First sub to click triggers an atomic commit and version rotation.</li>
              <li>Runner-up receives an instantaneous <code>409 Conflict</code>, preventing embarrassing duplicate classroom arrivals.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
