import React, { useState, useEffect } from 'react';
import { EmployeeRecord } from '../types';
import { api } from '../services/api';
import { 
  FileCheck, 
  AlertCircle, 
  CheckCircle2, 
  Search, 
  ExternalLink,
  ShieldCheck,
  FolderOpen
} from 'lucide-react';

interface PersonnelVaultProps {
  onOpenVideo: (key: string) => void;
}

export const PersonnelVault: React.FC<PersonnelVaultProps> = ({ onOpenVideo }) => {
  const [records, setRecords] = useState<EmployeeRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<EmployeeRecord | null>(null);

  useEffect(() => {
    api.getEmployeeRecords().then(setRecords);
  }, []);

  const filtered = records.filter(r => 
    r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.stateCertificateNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="tab-content personnel-vault">
      <div className="section-header-banner">
        <div>
          <h2>Personnel Records & Credential Compliance Vault</h2>
          <p className="subtitle">
            Modeled after Red Rover's <strong>web_optimized.mp4</strong> Records video.
            Automated tracking for state educator licenses, FBI/BCI criminal background clearances, and digital HR onboarding vaults.
          </p>
        </div>
        <button className="btn-secondary flex-items-center gap-2" onClick={() => onOpenVideo('records')}>
          <ExternalLink size={15} />
          <span>Watch Records Walkthrough</span>
        </button>
      </div>

      <div className="vault-overview-cards">
        <div className="metric-card">
          <div className="metric-title">Total Monitored Personnel</div>
          <div className="metric-value">{records.length}</div>
          <div className="metric-sub text-muted">Active educators & substitutes</div>
        </div>

        <div className="metric-card metric-card-success">
          <div className="metric-title">100% Compliant Clearances</div>
          <div className="metric-value text-success">
            {records.filter(r => r.certificateStatus === 'Active').length}
          </div>
          <div className="metric-sub text-success">
            <CheckCircle2 size={13} className="inline-icon" /> Background clearances valid
          </div>
        </div>

        <div className="metric-card metric-card-warning">
          <div className="metric-title">Expiring Within 60 Days</div>
          <div className="metric-value text-warning">
            {records.filter(r => r.certificateStatus === 'ExpiringSoon').length}
          </div>
          <div className="metric-sub text-warning">
            <AlertCircle size={13} className="inline-icon" /> Renewal reminder triggered
          </div>
        </div>
      </div>

      <div className="table-controls-bar">
        <div className="search-box">
          <Search size={16} className="text-muted" />
          <input
            type="text"
            placeholder="Search by educator name, certification #, or department..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee Name & Role</th>
              <th>Department</th>
              <th>State Certificate #</th>
              <th>Compliance Status</th>
              <th>Clearance Expiration</th>
              <th>Vault Documents</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(rec => (
              <tr key={rec.id}>
                <td>
                  <div className="cell-primary">{rec.fullName}</div>
                  <div className="cell-secondary">{rec.role}</div>
                </td>
                <td>{rec.department}</td>
                <td>
                  <code className="code-badge">{rec.stateCertificateNumber}</code>
                </td>
                <td>
                  <span className={`status-badge ${rec.certificateStatus === 'Active' ? 'badge-filled' : 'badge-open'}`}>
                    {rec.certificateStatus === 'Active' ? (
                      <>
                        <ShieldCheck size={13} /> Active & Valid
                      </>
                    ) : (
                      <>
                        <AlertCircle size={13} /> Expiring Soon
                      </>
                    )}
                  </span>
                </td>
                <td>{new Date(rec.clearanceValidUntil).toLocaleDateString()}</td>
                <td>
                  <div className="doc-vault-pill">
                    <FolderOpen size={14} className="text-primary" />
                    <span>{rec.documentCount} Files</span>
                  </div>
                </td>
                <td>
                  <button 
                    className="btn-action-secondary"
                    onClick={() => setSelectedRecord(rec)}
                  >
                    View Dossier
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Dossier Modal */}
      {selectedRecord && (
        <div className="modal-overlay" onClick={() => setSelectedRecord(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Personnel Compliance Dossier: {selectedRecord.fullName}</h3>
              <button className="btn-icon" onClick={() => setSelectedRecord(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="dossier-grid">
                <div>
                  <label className="text-xs text-muted">Role & Department</label>
                  <p className="font-semibold">{selectedRecord.role} — {selectedRecord.department}</p>
                </div>
                <div>
                  <label className="text-xs text-muted">State License Number</label>
                  <p><code className="code-badge">{selectedRecord.stateCertificateNumber}</code></p>
                </div>
                <div>
                  <label className="text-xs text-muted">FBI / BCI Background Valid Until</label>
                  <p className="font-semibold text-success">{new Date(selectedRecord.clearanceValidUntil).toDateString()}</p>
                </div>
                <div>
                  <label className="text-xs text-muted">Hire Date</label>
                  <p>{new Date(selectedRecord.hireDate).toLocaleDateString()}</p>
                </div>
              </div>

              <h4 className="mt-4 mb-2">Encrypted Vault Documents ({selectedRecord.documentCount})</h4>
              <ul className="vault-file-list">
                <li>📄 State Teaching Credential Certificate (PDF - Verified)</li>
                <li>📄 FBI Background Check Fingerprint Clearance (PDF - Verified)</li>
                <li>📄 Form I-9 Employment Eligibility Verification (PDF - Encrypted)</li>
                <li>📄 Direct Deposit Authorization & W-4 (PDF - Encrypted)</li>
              </ul>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedRecord(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
