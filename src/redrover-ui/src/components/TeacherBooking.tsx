import React, { useState } from 'react';
import { CreateAbsenceDto, School, Teacher } from '../types';
import { api } from '../services/api';
import { Calendar, Clock, BookOpen, MapPin, CheckCircle, ExternalLink, Send } from 'lucide-react';

interface TeacherBookingProps {
  schools: School[];
  teachers: Teacher[];
  onAbsenceCreated: () => void;
  onOpenVideo: (key: string) => void;
}

export const TeacherBooking: React.FC<TeacherBookingProps> = ({
  schools,
  teachers,
  onAbsenceCreated,
  onOpenVideo,
}) => {
  const [selectedSchoolId, setSelectedSchoolId] = useState(schools[0]?.id || '');
  const [selectedTeacherId, setSelectedTeacherId] = useState(teachers[0]?.id || '');
  const [subject, setSubject] = useState('AP Chemistry');
  const [roomNumber, setRoomNumber] = useState('Room 204');
  const [reason, setReason] = useState('Illness / Medical');
  const [durationPreset, setDurationPreset] = useState<'FullDay' | 'HalfAM' | 'HalfPM'>('FullDay');
  const [startTime, setStartTime] = useState('07:30 AM');
  const [endTime, setEndTime] = useState('02:45 PM');
  const [notes, setNotes] = useState('Lab experiment safety sheet is printed on my front desk. Period 4 has quiz.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handlePresetChange = (preset: 'FullDay' | 'HalfAM' | 'HalfPM') => {
    setDurationPreset(preset);
    if (preset === 'FullDay') {
      setStartTime('07:30 AM');
      setEndTime('02:45 PM');
    } else if (preset === 'HalfAM') {
      setStartTime('07:30 AM');
      setEndTime('11:15 AM');
    } else {
      setStartTime('11:15 AM');
      setEndTime('02:45 PM');
    }
  };

  const handleTeacherChange = (teacherId: string) => {
    setSelectedTeacherId(teacherId);
    const t = teachers.find(x => x.id === teacherId);
    if (t) {
      setSelectedSchoolId(t.schoolId);
      setRoomNumber(t.roomNumber);
      if (t.department.includes('Science')) setSubject('Chemistry / Biology');
      else if (t.department.includes('Social')) setSubject('World History');
      else if (t.department.includes('English')) setSubject('9th Grade English');
      else setSubject('Elementary Classroom');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage(null);

    const school = schools.find(s => s.id === selectedSchoolId) || schools[0];
    const teacher = teachers.find(t => t.id === selectedTeacherId) || teachers[0];

    const dto: CreateAbsenceDto = {
      schoolId: school?.id || '1',
      schoolName: school?.name || 'Lincoln High School',
      teacherId: teacher?.id || '1',
      teacherName: teacher?.fullName || 'Sarah Johnson',
      subject,
      roomNumber,
      reason,
      startTime,
      endTime,
      notes,
    };

    try {
      await api.createAbsence(dto);
      setSuccessMessage(`Absence recorded for ${dto.teacherName}! Notification dispatched to Azure Service Bus & SignalR fan-out initiated.`);
      onAbsenceCreated();
    } catch (err) {
      alert('Error creating absence. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="tab-content teacher-booking">
      <div className="section-header-banner">
        <div>
          <h2>Teacher Absence Registration Portal</h2>
          <p className="subtitle">
            Modeled directly after Red Rover's <strong>2024 Employee Basic Training</strong>.
            Educators log planned or emergency absences, attach lesson plan instructions, and trigger automated substitute dispatch.
          </p>
        </div>
        <button className="btn-secondary flex-items-center gap-2" onClick={() => onOpenVideo('teacher')}>
          <ExternalLink size={15} />
          <span>Watch Employee Training Video</span>
        </button>
      </div>

      {successMessage && (
        <div className="alert-box alert-box-success">
          <CheckCircle size={20} className="text-emerald" />
          <div>
            <strong>Success!</strong>
            <p style={{ margin: 0 }}>{successMessage}</p>
          </div>
        </div>
      )}

      <div className="form-layout-container">
        <form onSubmit={handleSubmit} className="booking-form-card">
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">
                <MapPin size={14} className="inline-icon" /> School Campus
              </label>
              <select
                className="form-select"
                value={selectedSchoolId}
                onChange={e => setSelectedSchoolId(e.target.value)}
              >
                {schools.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.level})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                <BookOpen size={14} className="inline-icon" /> Educator Name
              </label>
              <select
                className="form-select"
                value={selectedTeacherId}
                onChange={e => handleTeacherChange(e.target.value)}
              >
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.fullName} — {t.department}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Subject / Grade Level</label>
              <input
                type="text"
                className="form-input"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Classroom / Room #</label>
              <input
                type="text"
                className="form-input"
                value={roomNumber}
                onChange={e => setRoomNumber(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Absence Reason</label>
            <select
              className="form-select"
              value={reason}
              onChange={e => setReason(e.target.value)}
            >
              <option value="Illness / Medical">Illness / Medical (Flu, Doctor Visit)</option>
              <option value="Personal Day">Personal Day (Scheduled Off)</option>
              <option value="Professional Development">Professional Development / Conference</option>
              <option value="Bereavement">Bereavement Leave</option>
              <option value="Jury Duty">Jury Duty / Civic Obligation</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              <Clock size={14} className="inline-icon" /> Shift Duration Preset
            </label>
            <div className="preset-toggle-group">
              <button
                type="button"
                className={`toggle-btn ${durationPreset === 'FullDay' ? 'active' : ''}`}
                onClick={() => handlePresetChange('FullDay')}
              >
                Full Day (7:30 AM - 2:45 PM)
              </button>
              <button
                type="button"
                className={`toggle-btn ${durationPreset === 'HalfAM' ? 'active' : ''}`}
                onClick={() => handlePresetChange('HalfAM')}
              >
                Half Day AM (7:30 AM - 11:15 AM)
              </button>
              <button
                type="button"
                className={`toggle-btn ${durationPreset === 'HalfPM' ? 'active' : ''}`}
                onClick={() => handlePresetChange('HalfPM')}
              >
                Half Day PM (11:15 AM - 2:45 PM)
              </button>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Start Time</label>
              <input
                type="text"
                className="form-input"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Time</label>
              <input
                type="text"
                className="form-input"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes for Guest Teacher / Lesson Plan Link</label>
            <textarea
              className="form-textarea"
              rows={4}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Worksheets in blue folder on desk. Emergency sub plans in binder. Hall pass policy..."
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary btn-lg flex-items-center gap-2"
            >
              <Send size={16} />
              <span>{isSubmitting ? 'Dispatching...' : 'Submit & Dispatch Absence'}</span>
            </button>
          </div>
        </form>

        <div className="booking-info-sidebar">
          <div className="info-card">
            <h4>How Red Rover Dispatch Works</h4>
            <ol className="info-list">
              <li>
                <strong>Absence Ingestion:</strong> Teacher submits request into Core ASP.NET Core API.
              </li>
              <li>
                <strong>Matching Algorithm:</strong> Background rules check substitute certifications (e.g. Science vs. History), availability, and 40-hr weekly caps.
              </li>
              <li>
                <strong>Serverless Burst:</strong> Azure Service Bus queues SMS alerts; `SubNotificationDispatcher` Azure Function blasts 100s of texts.
              </li>
              <li>
                <strong>SignalR WebSocket:</strong> Instantly broadcasts to Admin Absence Board without page refreshes.
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
