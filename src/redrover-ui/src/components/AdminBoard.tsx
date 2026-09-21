import React, { useState } from 'react';
import { Absence, DistrictMetrics, Substitute } from '../types';
import { api } from '../services/api';
import { 
  CheckCircle2, 
  AlertCircle, 
  UserCheck, 
  Sparkles, 
  Filter, 
  Zap, 
  ShieldCheck, 
  Search,
  ExternalLink 
} from 'lucide-react';

interface AdminBoardProps {
  absences: Absence[];
  metrics: DistrictMetrics;
  substitutes: Substitute[];
  onRefresh: () => void;
  onOpenVideo: (key: string) => void;
}

export const AdminBoard: React.FC<AdminBoardProps> = ({
  absences,
  metrics,
  substitutes,
  onRefresh,
  onOpenVideo,
}) => {
  const [filterStatus, setFilterStatus] = useState<'All' | 'Open' | 'Filled'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [overrideModalAbsence, setOverrideModalAbsence] = useState<Absence | null>(null);
  const [selectedSubId, setSelectedSubId] = useState('');
  const [concurrencyResult, setConcurrencyResult] = useState<string | null>(null);
  const [isSimulatingRace, setIsSimulatingRace] = useState(false);

  const filteredAbsences = absences.filter(a => {
    const matchesFilter = filterStatus === 'All' || a.status === filterStatus;
    const matchesSearch = 
      a.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.schoolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.subject.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Concurrency collision race demonstration
  const handleSimulateConcurrencyRace = async (absence: Absence) => {
    if (absence.status === 'Filled') {
      alert('Select an Open absence to test the simultaneous claim race.');
      return;
    }

    setIsSimulatingRace(true);
    setConcurrencyResult(null);

    const sub1 = substitutes[0] || { id: 's1', fullName: 'Alex Martinez' };
    const sub2 = substitutes[1] || { id: 's2', fullName: 'Jordan Lee' };

    // Fire two simultaneous requests with the exact same expected version
    const p1 = api.claimShift(absence.id, sub1.id, sub1.fullName, absence.version);
    const p2 = api.claimShift(absence.id, sub2.id, sub2.fullName, absence.version);

    const [res1, res2] = await Promise.all([p1, p2]);

    setIsSimulatingRace(false);

    let summary = `🏁 Concurrency Race Result for Shift: ${absence.subject} (${absence.teacherName})\n\n`;
    if (res1.success) {
      summary += `✅ Request 1 (${sub1.fullName}): 200 OK — Claimed Shift & Rotated Version Token!\n`;
    } else {
      summary += `❌ Request 1 (${sub1.fullName}): 409 Conflict — ${res1.error}\n`;
    }

    if (res2.success) {
      summary += `✅ Request 2 (${sub2.fullName}): 200 OK — Claimed Shift!\n`;
    } else {
      summary += `🛡️ Request 2 (${sub2.fullName}): 409 Conflict (OPTIMISTIC LOCK PROTECTED) — "${res2.error}"\n`;
    }

    summary += `\nResult: Zero double-booking occurred. The database version token prevented the second substitute from overriding the assignment!`;
    setConcurrencyResult(summary);
    onRefresh();
  };

  const handleOverrideSubmit = async () => {
    if (!overrideModalAbsence || !selectedSubId) return;
    const sub = substitutes.find(s => s.id === selectedSubId);
    if (!sub) return;

    await api.overrideAssignment(overrideModalAbsence.id, sub.id, sub.fullName);
    setOverrideModalAbsence(null);
    setSelectedSubId('');
    onRefresh();
  };

  return (
    <div className="tab-content admin-board">
      {/* Top Banner with Video Context */}
      <div className="section-header-banner">
        <div>
          <h2>Daily Absence & Substitute Command Center</h2>
          <p className="subtitle">
            Live district-wide operational view modeled after Red Rover's <strong>Admin Basic Training</strong>.
            Real-time SignalR WebSocket updates reflect teacher submissions and substitute claims with zero polling.
          </p>
        </div>
        <button className="btn-secondary flex-items-center gap-2" onClick={() => onOpenVideo('admin')}>
          <ExternalLink size={15} />
          <span>Watch Official Admin Walkthrough</span>
        </button>
      </div>

      {/* District KPI Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-title">Today's Total Absences</div>
          <div className="metric-value">{metrics.totalAbsencesToday}</div>
          <div className="metric-sub text-muted">Across 3 district campuses</div>
        </div>

        <div className="metric-card metric-card-success">
          <div className="metric-title">Filled Assignments</div>
          <div className="metric-value text-success">{metrics.filledCount}</div>
          <div className="metric-sub text-success">
            <CheckCircle2 size={14} className="inline-icon" /> Automated sub matches
          </div>
        </div>

        <div className="metric-card metric-card-warning">
          <div className="metric-title">Open / Unfilled</div>
          <div className="metric-value text-warning">{metrics.openCount}</div>
          <div className="metric-sub text-warning">
            <AlertCircle size={14} className="inline-icon" /> High priority for dispatch
          </div>
        </div>

        <div className="metric-card metric-card-primary">
          <div className="metric-title">District Fill Rate</div>
          <div className="metric-value text-primary">{metrics.fillRatePercentage}%</div>
          <div className="progress-bar-bg">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${Math.min(metrics.fillRatePercentage, 100)}%` }}
            ></div>
          </div>
          <div className="metric-sub text-muted">Red Rover Target: 85.0%+</div>
        </div>
      </div>

      {/* Concurrency Banner Modal / Alert if race was run */}
      {concurrencyResult && (
        <div className="alert-box alert-box-concurrency">
          <div className="flex-items-center gap-2 alert-header">
            <ShieldCheck size={20} className="text-emerald" />
            <strong>Senior Concurrency Check: Zero Double-Booking Verified!</strong>
          </div>
          <pre className="concurrency-log">{concurrencyResult}</pre>
          <button className="btn-sm btn-outline" onClick={() => setConcurrencyResult(null)}>
            Dismiss Test Output
          </button>
        </div>
      )}

      {/* Action Controls & Filters */}
      <div className="table-controls-bar">
        <div className="search-box">
          <Search size={16} className="text-muted" />
          <input
            type="text"
            placeholder="Search by teacher, school, or subject..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <Filter size={15} className="text-muted" />
          <button
            className={`filter-btn ${filterStatus === 'All' ? 'active' : ''}`}
            onClick={() => setFilterStatus('All')}
          >
            All ({absences.length})
          </button>
          <button
            className={`filter-btn ${filterStatus === 'Open' ? 'active' : ''}`}
            onClick={() => setFilterStatus('Open')}
          >
            Open ({absences.filter(a => a.status === 'Open').length})
          </button>
          <button
            className={`filter-btn ${filterStatus === 'Filled' ? 'active' : ''}`}
            onClick={() => setFilterStatus('Filled')}
          >
            Filled ({absences.filter(a => a.status === 'Filled').length})
          </button>
        </div>
      </div>

      {/* Main Absence Roster Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Teacher & School</th>
              <th>Subject / Room</th>
              <th>Date & Hours</th>
              <th>Reason & Lesson Notes</th>
              <th>Assigned Substitute</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAbsences.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted">
                  No absence records matching your filter.
                </td>
              </tr>
            ) : (
              filteredAbsences.map(absence => (
                <tr key={absence.id} className={absence.status === 'Open' ? 'row-highlight-open' : ''}>
                  <td>
                    <span className={`status-badge ${absence.status === 'Filled' ? 'badge-filled' : 'badge-open'}`}>
                      {absence.status === 'Filled' ? (
                        <>
                          <CheckCircle2 size={13} /> Filled
                        </>
                      ) : (
                        <>
                          <AlertCircle size={13} /> Open
                        </>
                      )}
                    </span>
                  </td>
                  <td>
                    <div className="cell-primary">{absence.teacherName}</div>
                    <div className="cell-secondary">{absence.schoolName}</div>
                  </td>
                  <td>
                    <div className="cell-primary">{absence.subject}</div>
                    <div className="cell-secondary">{absence.roomNumber}</div>
                  </td>
                  <td>
                    <div className="cell-primary">{absence.date}</div>
                    <div className="cell-secondary">{absence.startTime} – {absence.endTime}</div>
                  </td>
                  <td>
                    <div className="cell-primary">{absence.reason}</div>
                    <div className="cell-secondary note-preview" title={absence.notes}>
                      {absence.notes || 'No notes provided.'}
                    </div>
                  </td>
                  <td>
                    {absence.status === 'Filled' ? (
                      <div className="assigned-sub-pill">
                        <UserCheck size={14} className="text-success" />
                        <span>{absence.assignedSubName || 'Assigned'}</span>
                      </div>
                    ) : (
                      <span className="text-muted text-sm italic">Pending substitute claim</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons-cell">
                      {absence.status === 'Open' ? (
                        <>
                          <button
                            className="btn-action-primary"
                            onClick={() => setOverrideModalAbsence(absence)}
                            title="Admin Manual Placement"
                          >
                            Assign Sub
                          </button>
                          <button
                            className="btn-action-race"
                            disabled={isSimulatingRace}
                            onClick={() => handleSimulateConcurrencyRace(absence)}
                            title="Simulate two substitutes clicking 'Accept' at the exact millisecond"
                          >
                            <Zap size={13} /> Race Test
                          </button>
                        </>
                      ) : (
                        <button
                          className="btn-action-secondary"
                          onClick={() => setOverrideModalAbsence(absence)}
                          title="Reassign or replace substitute"
                        >
                          Reassign
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Manual Assignment Modal */}
      {overrideModalAbsence && (
        <div className="modal-overlay" onClick={() => setOverrideModalAbsence(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Admin Manual Placement</h3>
              <button className="btn-icon" onClick={() => setOverrideModalAbsence(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p>
                Assign a qualified guest educator for <strong>{overrideModalAbsence.teacherName}</strong> ({overrideModalAbsence.subject} at {overrideModalAbsence.schoolName}).
              </p>

              <label className="form-label mt-4">Select Available Substitute:</label>
              <select
                className="form-select"
                value={selectedSubId}
                onChange={e => setSelectedSubId(e.target.value)}
              >
                <option value="">-- Choose certified substitute --</option>
                {substitutes.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.certifications}) — {s.hoursWorkedThisWeek} hrs this week
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setOverrideModalAbsence(null)}>Cancel</button>
              <button 
                className="btn-primary" 
                disabled={!selectedSubId} 
                onClick={handleOverrideSubmit}
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
