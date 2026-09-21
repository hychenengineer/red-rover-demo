import React, { useState, useEffect } from 'react';
import { TimeEntry } from '../types';
import { api } from '../services/api';
import { 
  Clock, 
  DollarSign, 
  CheckCircle, 
  Delete, 
  ExternalLink,
  ShieldAlert,
  UserCheck
} from 'lucide-react';

interface TimeTrackingKioskProps {
  onOpenVideo: (key: string) => void;
}

export const TimeTrackingKiosk: React.FC<TimeTrackingKioskProps> = ({ onOpenVideo }) => {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [activeMode, setActiveMode] = useState<'kiosk' | 'extraduty'>('kiosk');

  // Kiosk PIN state
  const [pin, setPin] = useState('');
  const [kioskStatus, setKioskStatus] = useState<string | null>(null);

  // Extra Duty state
  const [teacherName, setTeacherName] = useState('Sarah Johnson');
  const [hours, setHours] = useState(1.5);
  const [reason, setReason] = useState('Period 3 Prep Period Coverage for Room 104');
  const [extraDutyStatus, setExtraDutyStatus] = useState<string | null>(null);

  const loadEntries = async () => {
    const data = await api.getTimeEntries();
    setEntries(data);
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const handlePinDigit = (digit: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + digit);
    }
  };

  const handlePinClear = () => {
    setPin('');
    setKioskStatus(null);
  };

  const handleKioskPunch = async (entryType: 'ClockIn' | 'ClockOut') => {
    if (pin.length !== 4) {
      setKioskStatus('Please enter a valid 4-digit employee PIN.');
      return;
    }

    // Demo PIN mapping
    let empName = 'David Miller';
    let empRole = 'Bus Driver';
    if (pin === '1234') {
      empName = 'Maria Gonzales';
      empRole = 'Food Services';
    } else if (pin === '9999') {
      empName = 'John Reynolds';
      empRole = 'Custodial Supervisor';
    }

    await api.punchClock(empName, empRole, entryType);
    setKioskStatus(`✅ ${entryType === 'ClockIn' ? 'Clock In' : 'Clock Out'} Recorded for ${empName} (${empRole}) at ${new Date().toLocaleTimeString()}!`);
    setPin('');
    loadEntries();
  };

  const handleExtraDutySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.submitExtraDuty(teacherName, hours, reason);
    setExtraDutyStatus(`✅ Stipend Claim Submitted for ${teacherName}: ${hours} hrs ($${hours * 45}.00)`);
    loadEntries();
  };

  return (
    <div className="tab-content time-tracking">
      <div className="section-header-banner">
        <div>
          <h2>K-12 Time & Attendance / Extra Duty Stipends</h2>
          <p className="subtitle">
            Modeled directly after Red Rover's <strong>timeTracking.mp4</strong> training video.
            Hardware PIN clock-ins for non-exempt hourly employees, plus automated prep-period coverage stipends for certified teachers.
          </p>
        </div>
        <button className="btn-secondary flex-items-center gap-2" onClick={() => onOpenVideo('timetracking')}>
          <ExternalLink size={15} />
          <span>Watch Time Tracking Walkthrough</span>
        </button>
      </div>

      {/* Mode Switcher */}
      <div className="mode-toggle-bar">
        <button
          className={`mode-toggle-btn ${activeMode === 'kiosk' ? 'active' : ''}`}
          onClick={() => setActiveMode('kiosk')}
        >
          <Clock size={16} />
          <span>Campus Wall Kiosk (Hourly PIN Pad)</span>
        </button>
        <button
          className={`mode-toggle-btn ${activeMode === 'extraduty' ? 'active' : ''}`}
          onClick={() => setActiveMode('extraduty')}
        >
          <DollarSign size={16} />
          <span>Teacher Extra Duty / Prep Coverage Stipend</span>
        </button>
      </div>

      <div className="kiosk-layout-grid">
        {/* Left Column: Interactive Simulation */}
        <div className="kiosk-interactive-panel">
          {activeMode === 'kiosk' ? (
            <div className="kiosk-hardware-mockup">
              <div className="kiosk-screen">
                <div className="kiosk-time-display">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="kiosk-prompt">Lincoln High School — Staff Time Kiosk</div>

                <div className="pin-indicator-box">
                  <div className="pin-dots">
                    {[0, 1, 2, 3].map(i => (
                      <span key={i} className={`pin-dot ${i < pin.length ? 'filled' : ''}`}></span>
                    ))}
                  </div>
                </div>

                {kioskStatus && (
                  <div className="kiosk-feedback">{kioskStatus}</div>
                )}
              </div>

              {/* Hardware Numeric Keypad */}
              <div className="numeric-keypad">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
                  <button key={d} className="key-btn" onClick={() => handlePinDigit(d)}>
                    {d}
                  </button>
                ))}
                <button className="key-btn key-clear" onClick={handlePinClear}>
                  <Delete size={18} />
                </button>
                <button className="key-btn" onClick={() => handlePinDigit('0')}>
                  0
                </button>
                <button className="key-btn key-empty" disabled></button>
              </div>

              <div className="kiosk-action-row">
                <button 
                  className="btn-punch btn-clock-in"
                  onClick={() => handleKioskPunch('ClockIn')}
                >
                  Clock In
                </button>
                <button 
                  className="btn-punch btn-clock-out"
                  onClick={() => handleKioskPunch('ClockOut')}
                >
                  Clock Out
                </button>
              </div>

              <div className="kiosk-pin-tips text-xs text-muted mt-3">
                💡 Demo PINs: <code>1024</code> (David Miller, Bus Driver) | <code>1234</code> (Maria Gonzales, Food Services)
              </div>
            </div>
          ) : (
            <div className="extra-duty-card">
              <h3>Submit Extra Duty Prep Coverage</h3>
              <p className="text-sm text-muted">
                Per district bargaining agreement, teachers covering colleague classes during planning periods earn $45.00/hour.
              </p>

              {extraDutyStatus && (
                <div className="alert-box alert-box-success mt-3 mb-3">
                  <CheckCircle size={18} />
                  <span>{extraDutyStatus}</span>
                </div>
              )}

              <form onSubmit={handleExtraDutySubmit} className="mt-4">
                <div className="form-group">
                  <label className="form-label">Educator Name</label>
                  <select
                    className="form-select"
                    value={teacherName}
                    onChange={e => setTeacherName(e.target.value)}
                  >
                    <option value="Sarah Johnson">Sarah Johnson (Science)</option>
                    <option value="Robert Davis">Robert Davis (Social Studies)</option>
                    <option value="Emily White">Emily White (Language Arts)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Hours Covered</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="6"
                    className="form-input"
                    value={hours}
                    onChange={e => setHours(parseFloat(e.target.value) || 1)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Coverage Reason / Period</label>
                  <input
                    type="text"
                    className="form-input"
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    required
                  />
                </div>

                <div className="p-3 bg-slate rounded-md mb-4 flex-between">
                  <span className="text-sm">Calculated Stipend ($45/hr):</span>
                  <strong className="text-primary text-lg">${(hours * 45).toFixed(2)}</strong>
                </div>

                <button type="submit" className="btn-primary w-full">
                  Submit Extra Duty Claim
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Column: Live Punch Log */}
        <div className="kiosk-log-panel">
          <div className="panel-header">
            <h3>Recent Time & Attendance Activity</h3>
            <span className="badge badge-neutral">{entries.length} Entries</span>
          </div>

          <div className="log-entries-list">
            {entries.map(entry => (
              <div key={entry.id} className="log-item">
                <div className="log-item-header">
                  <div>
                    <strong>{entry.employeeName}</strong>
                    <span className="log-role-badge">{entry.role}</span>
                  </div>
                  <span className={`entry-type-pill pill-${entry.entryType.toLowerCase()}`}>
                    {entry.entryType}
                  </span>
                </div>

                <div className="log-item-details">
                  <span className="text-xs text-muted">
                    {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(entry.timestamp).toLocaleDateString()}
                  </span>
                  {entry.entryType === 'ExtraDuty' && (
                    <div className="text-xs text-primary font-medium mt-1">
                      {entry.stipendReason} (${entry.amount?.toFixed(2)})
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
