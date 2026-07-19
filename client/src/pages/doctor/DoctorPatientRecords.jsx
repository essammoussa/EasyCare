import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  getUserAppointments, 
  getPatientRecords, 
  getPatientResults 
} from '../../services/api';
import DoctorSidebar from '../../components/DoctorSidebar';
import DoctorHeader from '../../components/DoctorHeader';
import './Doctor.css';
import './DoctorPatientRecords.css';

export default function DoctorPatientRecords() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlPatientId = searchParams.get('patientId');
  const urlSearch = searchParams.get('search');

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  // Selected patient data
  const [records, setRecords] = useState([]);
  const [results, setResults] = useState([]);
  
  // Loading & states
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState(urlSearch || '');
  const [error, setError] = useState('');

  // 1. Fetch unique patients from appointments
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const { data } = await getUserAppointments();
        const apptsList = data.appointments || data || [];
        
        // Extract unique patients
        const patientMap = new Map();
        apptsList.forEach((appt) => {
          if (appt.patientId) {
            const p = appt.patientId;
            // Get date of appointment to display as last visit date
            const dateObj = appt.bookingId?.bookedAt || appt.createdAt;
            const apptDate = new Date(dateObj);
            
            // If already mapped, keep the most recent date
            if (patientMap.has(p._id)) {
              const existing = patientMap.get(p._id);
              if (apptDate > existing.lastVisitDate) {
                existing.lastVisitDate = apptDate;
              }
            } else {
              patientMap.set(p._id, {
                ...p,
                lastVisitDate: apptDate,
                status: appt.status === 'confirmed' ? 'ACTIVE' : 
                        appt.status === 'completed' ? 'STABLE' : 'FOLLOW-UP',
              });
            }
          }
        });

        const patientsArray = Array.from(patientMap.values());
        setPatients(patientsArray);

        // Select first patient or matching urlPatientId
        if (patientsArray.length > 0) {
          let initialPatient = patientsArray[0];
          if (urlPatientId) {
            const matched = patientsArray.find(p => p._id === urlPatientId);
            if (matched) initialPatient = matched;
          }
          setSelectedPatient(initialPatient);
        }
      } catch (err) {
        setError('Failed to fetch patients list.');
      } finally {
        setLoadingList(false);
      }
    };

    fetchPatients();
  }, [urlPatientId, urlSearch]);

  useEffect(() => {
    if (urlSearch) setSearchQuery(urlSearch);
  }, [urlSearch]);

  // 2. Fetch records and results for selected patient
  useEffect(() => {
    if (!selectedPatient) return;

    const fetchDetails = async () => {
      setLoadingDetails(true);
      try {
        const [recordsRes, resultsRes] = await Promise.all([
          getPatientRecords(selectedPatient._id),
          getPatientResults(selectedPatient._id)
        ]);

        setRecords(recordsRes.data.records || recordsRes.data || []);
        setResults(resultsRes.data.results || resultsRes.data || []);
      } catch (err) {
        console.error('Failed to load patient history details:', err);
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchDetails();
  }, [selectedPatient]);

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setSearchParams({ patientId: patient._id });
  };

  // Filter patients list
  const filteredPatients = patients.filter(p => 
    p.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="doctor-page-wrapper">
      {mobileMenuOpen && (
        <div 
          className="mobile-sidebar-backdrop" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      <DoctorSidebar 
        activePage="records" 
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
      />
      
      <div className="doctor-content">
        <DoctorHeader onMenuClick={() => setMobileMenuOpen(true)} />
        
        <main className="doctor-main doc-records-main">
          <div className="doc-records-split-layout">
            
            {/* Left Pane - Patients List */}
            <aside className="doc-records-sidebar">
              <div className="doc-records-sidebar-header">
                <h2>Patients</h2>
                <div className="doc-records-search-box">
                  <span className="material-symbols-outlined">search</span>
                  <input 
                    type="text" 
                    placeholder="Search patients by name..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="doc-records-sidebar-list custom-scrollbar">
                {loadingList ? (
                  <div className="doctor-spinner-container">
                    <div className="doctor-spinner" />
                  </div>
                ) : filteredPatients.length > 0 ? (
                  filteredPatients.map((p) => {
                    const initials = p.name
                      ?.split(' ')
                      ?.map(n => n[0])
                      ?.join('')
                      ?.toUpperCase()
                      ?.slice(0, 2) || 'P';
                    
                    const isSelected = selectedPatient?._id === p._id;
                    const formattedVisit = p.lastVisitDate
                      ? p.lastVisitDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'N/A';

                    return (
                      <div 
                        key={p._id} 
                        className={`doc-records-patient-card ${isSelected ? 'active' : ''}`}
                        onClick={() => handlePatientSelect(p)}
                      >
                        <div className="doc-records-patient-card-body">
                          {p.profilePicture ? (
                            <img 
                              src={p.profilePicture.startsWith('http') ? p.profilePicture : `http://localhost:5000${p.profilePicture}`} 
                              alt={p.name} 
                              className="doc-records-patient-avatar"
                            />
                          ) : (
                            <div className="doc-records-patient-avatar-fallback">{initials}</div>
                          )}
                          <div className="doc-records-patient-info">
                            <h3>{p.name}</h3>
                            <p>{p.email || p.phone || 'No contact info'}</p>
                          </div>
                          <div className="doc-records-patient-status">
                            <span className={`status-badge badge-${p.status?.toLowerCase() || 'stable'}`}>
                              {p.status || 'STABLE'}
                            </span>
                          </div>
                        </div>
                        <div className="doc-records-patient-card-footer">
                          <span>LAST VISIT: {formattedVisit}</span>
                          <span className="material-symbols-outlined">chevron_right</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="doc-records-sidebar-empty">
                    <span className="material-symbols-outlined">search_off</span>
                    <p>No patients found.</p>
                  </div>
                )}
              </div>
            </aside>

            {/* Right Pane - Patient Bento Dashboard */}
            <section className="doc-records-content-panel">
              {loadingDetails ? (
                <div className="doctor-spinner-container">
                  <div className="doctor-spinner" />
                </div>
              ) : selectedPatient ? (
                <div className="doc-records-bento-grid">
                  
                  {/* Row 1: Patient Header & Vitals (Col 1-2) + Primary Diagnosis (Col 3) */}
                  <div className="doc-records-bento-row">
                    
                    {/* Patient Card & Vitals */}
                    <div className="doc-records-quick-info-card">
                      <div className="doc-records-quick-info-body">
                        <div>
                          <h2 className="doc-records-selected-name">{selectedPatient.name}</h2>
                          <p className="doc-records-selected-id">
                            <span className="material-symbols-outlined">fingerprint</span> 
                            ID: {selectedPatient._id || 'N/A'}
                          </p>
                          <p className="doc-records-selected-email">
                            <span className="material-symbols-outlined">mail</span> 
                            {selectedPatient.email || 'No email registered'}
                          </p>
                        </div>
                        <div className="doc-records-vitals-box">
                          <div className="doc-records-vital-item">
                            <p className="doc-records-vital-label">Records</p>
                            <p className="doc-records-vital-value">{records.length}</p>
                          </div>
                          <div className="doc-records-vital-item">
                            <p className="doc-records-vital-label">Lab Results</p>
                            <p className="doc-records-vital-value">{results.length}</p>
                          </div>
                          <div className="doc-records-vital-item">
                            <p className="doc-records-vital-label">Last Visit</p>
                            <p className="doc-records-vital-value">
                              {selectedPatient.lastVisitDate
                                ? selectedPatient.lastVisitDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="doc-records-bg-glow"></div>
                    </div>

                    {/* Primary Diagnosis Card */}
                    <div className="doc-records-diagnosis-card">
                      <p className="doc-records-diagnosis-label">Primary Diagnosis</p>
                      <h3 className="doc-records-diagnosis-value">
                        {records.length > 0 ? records[0].diagnosis : 'No diagnosis on record'}
                      </h3>
                      <p className="doc-records-diagnosis-desc">
                        {records.length > 0 && records[0].testsRequired
                          ? `Requires monitoring. Tests: ${records[0].testsRequired}`
                          : records.length > 0
                            ? 'See medical history for full clinical details.'
                            : 'No primary diagnosis recorded yet for this patient.'}
                      </p>
                      {records.length > 0 && results.some((r) => !r.status || r.status === 'pending') && (
                        <div className="doc-records-attention-badge">
                          <span className="material-symbols-outlined">warning</span>
                          <span>PENDING LAB REVIEW</span>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Row 2: Medical History (Col 1-2) + Lab Results & Reminders (Col 3) */}
                  <div className="doc-records-bento-row flex-expand">
                    
                    {/* History Timeline Panel */}
                    <div className="doc-records-history-panel">
                      <h3 className="doc-records-panel-title">
                        <span className="material-symbols-outlined">history</span> 
                        Medical History
                      </h3>
                      <div className="doc-records-timeline custom-scrollbar">
                        {records.length > 0 ? (
                          records.map((rec) => {
                            const recDate = new Date(rec.visitDate || rec.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            });
                            
                            return (
                              <div key={rec._id} className="doc-records-timeline-item">
                                <div className="doc-records-timeline-marker"></div>
                                <span className="doc-records-timeline-date">{recDate}</span>
                                <h4 className="doc-records-timeline-diag">{rec.diagnosis}</h4>
                                {rec.testsRequired && (
                                  <p className="doc-records-timeline-notes">Tests: {rec.testsRequired}</p>
                                )}
                                {rec.prescriptions && rec.prescriptions.length > 0 && (
                                  <div className="doc-records-timeline-presc">
                                    {rec.prescriptions.map((p, idx) => (
                                      <span key={idx} className="doc-records-prescription-tag">
                                        {p.medicineName} {p.dosageNotes ? `(${p.dosageNotes})` : ''}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="doc-records-panel-empty">
                            <span className="material-symbols-outlined">history_toggle_off</span>
                            <p>No consultation records available.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Bento Box: Lab Results & Prescription Reminders */}
                    <div className="doc-records-details-sidebar">
                      
                      {/* Lab Results widget */}
                      <div className="doc-records-widget shadow-card">
                        <div className="doc-records-widget-header">
                          <h3 className="doc-records-panel-title">
                            <span className="material-symbols-outlined">biotech</span> 
                            Lab Results
                          </h3>
                        </div>
                        <div className="doc-records-widget-list custom-scrollbar">
                          {results.length > 0 ? (
                            results.map((res) => {
                              const resDate = new Date(res.uploadedAt || res.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              });
                              const isUrgent = res.status?.toLowerCase() === 'urgent' || res.status?.toLowerCase() === 'abnormal';
                              
                              return (
                                <div key={res._id} className="doc-records-widget-item">
                                  <div className="doc-records-widget-item-left">
                                    <div className={`doc-records-widget-icon-box ${isUrgent ? 'orange' : 'blue'}`}>
                                      <span className="material-symbols-outlined">
                                        {res.testName?.toLowerCase().includes('blood') ? 'bloodtype' : 'monitoring'}
                                      </span>
                                    </div>
                                    <div>
                                      <p className="doc-records-widget-item-title">{res.testName || 'Lab Test Report'}</p>
                                      <p className="doc-records-widget-item-subtitle">{resDate}</p>
                                    </div>
                                  </div>
                                  <span className={`doc-records-widget-item-status ${isUrgent ? 'abnormal' : 'normal'}`}>
                                    {isUrgent ? 'Abnormal' : 'Normal'}
                                  </span>
                                </div>
                              );
                            })
                          ) : (
                            <div className="doc-records-panel-empty mini">
                              <span className="material-symbols-outlined">lab_profile</span>
                              <p>No uploaded lab reports found.</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Reminders widget */}
                      <div className="doc-records-widget reminder-widget shadow-card">
                        <h3 className="doc-records-panel-title">
                          <span className="material-symbols-outlined">notification_important</span>
                          Clinical Reminders
                        </h3>
                        <div className="doc-records-reminder-list">
                          {records.flatMap((rec) => rec.prescriptions || []).slice(0, 3).map((rx, idx) => (
                            <div key={idx} className="doc-records-reminder-item">
                              <div className="doc-records-reminder-circle info" />
                              <div>
                                <p className="doc-records-reminder-text">{rx.medicineName}</p>
                                <p className="doc-records-reminder-time">{rx.dosageNotes || 'No dosage notes'}</p>
                              </div>
                            </div>
                          ))}
                          {records.flatMap((rec) => rec.prescriptions || []).length === 0 && (
                            <div className="doc-records-panel-empty mini">
                              <span className="material-symbols-outlined">medication</span>
                              <p>No active prescriptions on record.</p>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>

                  </div>

                </div>
              ) : (
                <div className="doc-records-empty-details">
                  <span className="material-symbols-outlined">clinical_notes</span>
                  <h2>No Patient Selected</h2>
                  <p>Select a patient from the list on the left to view their complete clinical records, vitals, history, and results.</p>
                </div>
              )}
            </section>

          </div>
        </main>
      </div>
    </div>
  );
}
