import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  getUserAppointments,
  createRecord,
  updateAppointmentStatus,
  getPatientRecords,
} from '../../services/api';
import DoctorSidebar from '../../components/DoctorSidebar';
import DoctorHeader from '../../components/DoctorHeader';
import './Doctor.css';
import './DoctorDiagnosis.css';

function getAppointmentDate(appt) {
  return new Date(appt.bookingId?.bookedAt || appt.createdAt);
}

function DiagnosisShell({ mobileMenuOpen, setMobileMenuOpen, children }) {
  return (
    <div className="doctor-page-wrapper">
      {mobileMenuOpen && (
        <div className="mobile-sidebar-backdrop" onClick={() => setMobileMenuOpen(false)} />
      )}
      <DoctorSidebar
        activePage="diagnosis"
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      <div className="doctor-content">
        <DoctorHeader onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="doctor-main">{children}</main>
      </div>
    </div>
  );
}

export default function DoctorDiagnosis() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const appointmentId = searchParams.get('appointmentId');
  const patientId = searchParams.get('patientId');
  const needsPicker = !appointmentId || !patientId;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [appointment, setAppointment] = useState(null);
  const [pastRecords, setPastRecords] = useState([]);
  const [eligibleAppointments, setEligibleAppointments] = useState([]);
  const [pickerSearch, setPickerSearch] = useState('');

  const [diagnosis, setDiagnosis] = useState('');
  const [testsRequired, setTestsRequired] = useState('');
  const [prescriptions, setPrescriptions] = useState([{ medicineName: '', dosageNotes: '' }]);
  const [isUrgent, setIsUrgent] = useState(false);
  const [notifyLab, setNotifyLab] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');

      try {
        const apptsRes = await getUserAppointments();
        const apptsList = apptsRes.data.appointments || apptsRes.data || [];

        if (needsPicker) {
          const eligible = apptsList.filter(
            (a) =>
              (a.status === 'confirmed' || a.status === 'pending') &&
              a.patientId?._id
          );
          setEligibleAppointments(eligible);
          setLoading(false);
          return;
        }

        const currentAppt = apptsList.find((a) => a._id === appointmentId);

        if (!currentAppt) {
          setError('Appointment not found. Please select another appointment.');
        } else if (currentAppt.status === 'completed' || currentAppt.status === 'cancelled') {
          setError(`This appointment is already ${currentAppt.status}. Select an active appointment below.`);
          const eligible = apptsList.filter(
            (a) =>
              (a.status === 'confirmed' || a.status === 'pending') &&
              a.patientId?._id
          );
          setEligibleAppointments(eligible);
        } else {
          setAppointment(currentAppt);
          const recordsRes = await getPatientRecords(patientId);
          setPastRecords(recordsRes.data.records || recordsRes.data || []);
        }
      } catch (err) {
        console.error('Error fetching diagnosis page data:', err);
        setError('Failed to load appointment and patient data.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [appointmentId, patientId, needsPicker]);

  const handleSelectAppointment = (appt) => {
    setSearchParams({
      appointmentId: appt._id,
      patientId: appt.patientId._id,
    });
  };

  const handleAddMedicine = () => {
    setPrescriptions([...prescriptions, { medicineName: '', dosageNotes: '' }]);
  };

  const handleRemoveMedicine = (index) => {
    if (prescriptions.length === 1) {
      setPrescriptions([{ medicineName: '', dosageNotes: '' }]);
    } else {
      setPrescriptions(prescriptions.filter((_, i) => i !== index));
    }
  };

  const handleMedicineChange = (index, field, value) => {
    const updated = [...prescriptions];
    updated[index][field] = value;
    setPrescriptions(updated);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!appointmentId || !patientId || !appointment) return;

    setError('');
    setSuccess('');

    if (!diagnosis.trim()) {
      setError('Please enter a Primary Diagnosis.');
      return;
    }

    setSaving(true);
    try {
      const validPrescriptions = prescriptions.filter(
        (p) => p.medicineName.trim() !== '' || p.dosageNotes.trim() !== ''
      );

      const diagnosisText = isUrgent ? `[URGENT] ${diagnosis.trim()}` : diagnosis.trim();
      const testsText = notifyLab
        ? `${testsRequired.trim()}${testsRequired.trim() ? '\n' : ''}[Lab notified directly]`
        : testsRequired.trim();

      await createRecord({
        appointmentId,
        patientId,
        doctorId: appointment?.doctorId?._id || appointment?.doctorId,
        diagnosis: diagnosisText,
        testsRequired: testsText,
        visitDate: new Date(),
        prescriptions: validPrescriptions,
      });

      await updateAppointmentStatus(appointmentId, 'completed');

      setSuccess('Diagnosis and prescription saved successfully!');

      setTimeout(() => {
        navigate('/doctor/dashboard');
      }, 1500);
    } catch (err) {
      console.error('Error saving record:', err);
      setError(err.response?.data?.message || 'Failed to submit medical record.');
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (window.confirm('Discard draft? Any unsaved work will be lost.')) {
      if (needsPicker) {
        navigate('/doctor/appointments');
      } else {
        setSearchParams({});
        setDiagnosis('');
        setTestsRequired('');
        setPrescriptions([{ medicineName: '', dosageNotes: '' }]);
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredPickerAppointments = eligibleAppointments.filter((appt) => {
    const name = appt.patientId?.name?.toLowerCase() || '';
    return name.includes(pickerSearch.toLowerCase());
  });

  if (loading) {
    return (
      <DiagnosisShell mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen}>
        <div className="doctor-spinner-container">
          <div className="doctor-spinner" />
        </div>
      </DiagnosisShell>
    );
  }

  if (needsPicker || !appointment) {
    return (
      <DiagnosisShell mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen}>
        <div className="diagnosis-page-header">
          <div>
            <h1 className="diagnosis-page-title">Diagnosis &amp; Prescription</h1>
            <p className="diagnosis-page-subtitle">
              Select a confirmed appointment to begin a diagnosis and prescription.
            </p>
          </div>
        </div>

        {error && <div className="error-message diagnosis-alert">{error}</div>}

        <div className="diagnosis-picker-panel">
          <div className="diagnosis-picker-header">
            <h2 className="diagnosis-picker-title">
              <span className="material-symbols-outlined">event_available</span>
              Select Appointment
            </h2>
            <div className="diagnosis-picker-search">
              <span className="material-symbols-outlined">search</span>
              <input
                type="text"
                placeholder="Search by patient name..."
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
              />
            </div>
          </div>

          {filteredPickerAppointments.length > 0 ? (
            <div className="diagnosis-picker-list">
              {filteredPickerAppointments.map((appt) => {
                const patientName = appt.patientId?.name || 'Patient';
                const initials = patientName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);
                const apptDate = getAppointmentDate(appt);
                const timeStr = appt.bookingId?.slotId?.startTime
                  || apptDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const dateStr = apptDate.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <button
                    key={appt._id}
                    type="button"
                    className="diagnosis-picker-card"
                    onClick={() => handleSelectAppointment(appt)}
                  >
                    <div className="diagnosis-picker-card-avatar">{initials}</div>
                    <div className="diagnosis-picker-card-body">
                      <p className="diagnosis-picker-patient-name">{patientName}</p>
                      <p className="diagnosis-picker-meta">
                        {dateStr} • {timeStr}
                      </p>
                      <p className="diagnosis-picker-notes">
                        {appt.notes || 'General Consultation'}
                      </p>
                    </div>
                    <div className="diagnosis-picker-card-right">
                      <span className={`diagnosis-picker-status status-${appt.status}`}>
                        {appt.status}
                      </span>
                      <span className="material-symbols-outlined diagnosis-picker-arrow">
                        arrow_forward
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="diagnosis-picker-empty">
              <span className="material-symbols-outlined">event_busy</span>
              <h3>No active appointments</h3>
              <p>
                {pickerSearch
                  ? 'No appointments match your search.'
                  : 'Confirm an appointment first, then return here to write a diagnosis.'}
              </p>
              <button
                type="button"
                className="btn-primary"
                onClick={() => navigate('/doctor/appointments')}
              >
                Go to Appointments
              </button>
            </div>
          )}
        </div>
      </DiagnosisShell>
    );
  }

  const patientName = appointment?.patientId?.name || 'Patient';
  const patientEmail = appointment?.patientId?.email || 'N/A';
  const initials = patientName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <DiagnosisShell mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen}>
      <div className="diagnosis-page-header">
        <div>
          <h1 className="diagnosis-page-title">Diagnosis &amp; Prescription</h1>
          <p className="diagnosis-page-subtitle">
            Create a new medical record for {patientName}.
          </p>
        </div>

        <div className="page-header-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setSearchParams({})}
            disabled={saving}
          >
            Change Patient
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleDiscard}
            disabled={saving}
          >
            Discard Draft
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSubmit}
            disabled={saving || !appointment}
          >
            {saving ? 'Saving...' : 'Save Record'}
          </button>
        </div>
      </div>

      {error && <div className="error-message diagnosis-alert">{error}</div>}
      {success && (
        <div className="diagnosis-success-alert">
          <span className="material-symbols-outlined">check_circle</span>
          {success}
        </div>
      )}

      <div className="diagnosis-container">
        <div className="diagnosis-left-column">
          <div className="patient-summary-card">
            <div className="patient-profile-header">
              <div className="patient-avatar-fallback">{initials}</div>
              <div>
                <h3 className="patient-profile-name">{patientName}</h3>
                <div className="patient-profile-meta">
                  <span className="patient-id-badge">ID: #{patientId?.slice(-4)}</span>
                  <span className="patient-meta-dot">•</span>
                  <span className="patient-meta-text">{patientEmail}</span>
                </div>
              </div>
            </div>

            <div className="patient-vitals-list">
              <div className="patient-vital-row">
                <span className="patient-vital-label">Email</span>
                <span className="patient-vital-value">{patientEmail}</span>
              </div>
              <div className="patient-vital-row">
                <span className="patient-vital-label">Phone</span>
                <span className="patient-vital-value">
                  {appointment?.patientId?.phone || 'Not provided'}
                </span>
              </div>
              <div className="patient-vital-row">
                <span className="patient-vital-label">Last Visit</span>
                <span className="patient-vital-value">
                  {pastRecords.length > 0
                    ? new Date(pastRecords[0].visitDate || pastRecords[0].createdAt).toLocaleDateString()
                    : 'No prior visits'}
                </span>
              </div>
            </div>
          </div>

          <div className="patient-history-card">
            <h4 className="patient-history-title">
              <span className="material-symbols-outlined">history</span>
              Medical History
            </h4>
            <div className="history-items-list">
              {pastRecords.length > 0 ? (
                pastRecords.slice(0, 3).map((rec, i) => (
                  <div key={rec._id || i} className="history-item-badge recent">
                    <p className="history-item-label">PREVIOUS DIAGNOSIS</p>
                    <p className="history-item-value">{rec.diagnosis}</p>
                    <p className="history-item-desc">
                      {new Date(rec.visitDate || rec.createdAt).toLocaleDateString()} • Dr.{' '}
                      {rec.doctorId?.userId?.name || 'Doctor'}
                    </p>
                  </div>
                ))
              ) : (
                <div className="history-empty-state">
                  <span className="material-symbols-outlined">history_toggle_off</span>
                  <p>No prior medical history on record.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="diagnosis-right-column">
          <form className="diagnosis-form-card" onSubmit={handleSubmit}>
            <div className="form-field-group">
              <div className="form-section-header">
                <div className="form-section-title-box">
                  <span className="material-symbols-outlined">analytics</span>
                  <h3 className="form-section-title">Clinical Assessment</h3>
                </div>
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="diagnosis-primary">Primary Diagnosis</label>
                <textarea
                  id="diagnosis-primary"
                  className="form-textarea"
                  rows="4"
                  placeholder="Enter clinical findings and final diagnosis..."
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="diagnosis-tests">Tests Required</label>
                <textarea
                  id="diagnosis-tests"
                  className="form-textarea"
                  rows="3"
                  placeholder="List required lab tests, imaging, or screenings..."
                  value={testsRequired}
                  onChange={(e) => setTestsRequired(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="form-section-header form-section-header-spaced">
                <div className="form-section-title-box">
                  <span className="material-symbols-outlined">prescriptions</span>
                  <h3 className="form-section-title">Prescription</h3>
                </div>
                <button type="button" className="add-medicine-btn" onClick={handleAddMedicine}>
                  <span className="material-symbols-outlined">add_circle</span>
                  Add Medicine
                </button>
              </div>

              <div className="medicines-list">
                {prescriptions.map((p, index) => (
                  <div key={index} className="medicine-row">
                    <div className="form-field form-field-compact">
                      <label className="form-label form-label-small">MEDICINE NAME</label>
                      <input
                        type="text"
                        className="medicine-input"
                        placeholder="Enter medicine..."
                        value={p.medicineName}
                        onChange={(e) => handleMedicineChange(index, 'medicineName', e.target.value)}
                      />
                    </div>
                    <div className="form-field form-field-compact">
                      <label className="form-label form-label-small">DOSAGE &amp; FREQUENCY</label>
                      <input
                        type="text"
                        className="medicine-input"
                        placeholder="e.g. 1 tablet twice daily..."
                        value={p.dosageNotes}
                        onChange={(e) => handleMedicineChange(index, 'dosageNotes', e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      className="remove-medicine-btn"
                      onClick={() => handleRemoveMedicine(index)}
                      title="Remove Medicine"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-footer-bar">
              <div className="form-footer-left">
                <div className="checkbox-row">
                  <input
                    type="checkbox"
                    id="isUrgent"
                    className="form-checkbox"
                    checked={isUrgent}
                    onChange={(e) => setIsUrgent(e.target.checked)}
                  />
                  <label htmlFor="isUrgent">Mark as Urgent</label>
                </div>
                <div className="checkbox-row">
                  <input
                    type="checkbox"
                    id="notifyLab"
                    className="form-checkbox"
                    checked={notifyLab}
                    onChange={(e) => setNotifyLab(e.target.checked)}
                  />
                  <label htmlFor="notifyLab">Notify Lab Directly</label>
                </div>
              </div>

              <div className="form-footer-right">
                <button type="button" className="btn-secondary" onClick={handlePrint}>
                  Print Prescription
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="quick-summary-grid">
        <div className="summary-stat-card">
          <span className="material-symbols-outlined summary-stat-icon blue">history_edu</span>
          <p className="summary-stat-label">Active Records</p>
          <p className="summary-stat-value">{pastRecords.length}</p>
        </div>
        <div className="summary-stat-card">
          <span className="material-symbols-outlined summary-stat-icon teal">verified_user</span>
          <p className="summary-stat-label">Vitals Status</p>
          <p className="summary-stat-value summary-stat-value-stable">Stable</p>
        </div>
        <div className="summary-stat-card">
          <span className="material-symbols-outlined summary-stat-icon purple">calendar_month</span>
          <p className="summary-stat-label">Appointment</p>
          <p className="summary-stat-value">{appointment?.status || '—'}</p>
        </div>
      </div>
    </DiagnosisShell>
  );
}
