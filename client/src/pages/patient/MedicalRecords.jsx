import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPatientRecords, getPrescriptions, getPatientResults } from '../../services/api';
import useAuth from '../../hooks/useAuth';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { formatDoctorName } from '../../utils/roleRoutes';
import './MedicalRecords.css';

export default function MedicalRecords() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [records, setRecords] = useState([]);
    const [filteredRecords, setFilteredRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Expandable panel state
    const [expandedRecordId, setExpandedRecordId] = useState(null);

    // Asynchronous prescriptions and lab results
    const [prescriptionsMap, setPrescriptionsMap] = useState({});
    const [prescriptionsLoading, setPrescriptionsLoading] = useState({});
    const [labResults, setLabResults] = useState([]);

    // Filters state
    const [selectedSpecialty, setSelectedSpecialty] = useState('All');
    const [selectedDateRange, setSelectedDateRange] = useState('All');
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [recordsRes, resultsRes] = await Promise.all([
                    getPatientRecords(user._id),
                    getPatientResults(user._id)
                ]);

                const recordsData = recordsRes.data.records || recordsRes.data || [];
                setRecords(recordsData);
                setFilteredRecords(recordsData);

                const resultsData = resultsRes.data.results || resultsRes.data || [];
                setLabResults(resultsData);
            } catch (err) {
                setError('Failed to load medical records data.');
            } finally {
                setLoading(false);
            }
        };
        if (user?._id) fetchData();
    }, [user]);

    // Apply filters
    useEffect(() => {
        let result = [...records];

        if (selectedSpecialty !== 'All') {
            result = result.filter(rec => rec.doctorId?.specialty === selectedSpecialty);
        }

        if (selectedDateRange !== 'All') {
            const now = new Date();
            result = result.filter(rec => {
                const recordDate = new Date(rec.visitDate || rec.createdAt);
                if (selectedDateRange === '12m') {
                    const twelveMonthsAgo = new Date();
                    twelveMonthsAgo.setMonth(now.getMonth() - 12);
                    return recordDate >= twelveMonthsAgo;
                }
                if (selectedDateRange === 'year') {
                    return recordDate.getFullYear() === now.getFullYear();
                }
                return true;
            });
        }

        if (selectedStatus !== 'All') {
            result = result.filter(rec => {
                const matchingResults = labResults.filter(
                    res => (res.recordId?._id || res.recordId) === rec._id
                );
                const hasPendingTests = rec.testsRequired && matchingResults.length === 0;
                if (selectedStatus === 'Pending') {
                    return hasPendingTests;
                }
                if (selectedStatus === 'Finalized') {
                    return !hasPendingTests;
                }
                return true;
            });
        }

        if (searchQuery.trim() !== '') {
            const q = searchQuery.toLowerCase();
            result = result.filter(rec =>
                (rec.diagnosis && rec.diagnosis.toLowerCase().includes(q)) ||
                (rec.testsRequired && rec.testsRequired.toLowerCase().includes(q)) ||
                (rec.doctorId?.userId?.name && rec.doctorId.userId.name.toLowerCase().includes(q))
            );
        }

        setFilteredRecords(result);
    }, [selectedSpecialty, selectedDateRange, selectedStatus, searchQuery, records, labResults]);

    const toggleExpandRecord = async (record) => {
        const isExpanding = expandedRecordId !== record._id;
        setExpandedRecordId(isExpanding ? record._id : null);

        if (isExpanding && record.appointmentId && !prescriptionsMap[record.appointmentId]) {
            const appointmentId = record.appointmentId._id || record.appointmentId;
            setPrescriptionsLoading(prev => ({ ...prev, [appointmentId]: true }));
            try {
                const { data } = await getPrescriptions(appointmentId);
                setPrescriptionsMap(prev => ({ ...prev, [appointmentId]: data }));
            } catch (err) {
                console.error('Failed to load prescriptions:', err);
            } finally {
                setPrescriptionsLoading(prev => ({ ...prev, [appointmentId]: false }));
            }
        }
    };

    const exportPDF = () => {
        window.print();
    };

    // Extract unique specialties for filter dropdown
    const specialties = ['All', ...new Set(records.map(rec => rec.doctorId?.specialty).filter(Boolean))];

    return (
        <div className="records-page">
            <Navbar />
            <main className="records-main">
                {/* Page Header */}
                <div className="records-header-row">
                    <div>
                        <h1 className="records-title">Medical Records</h1>
                        <p className="records-subtitle">Manage and view your clinical history, lab results, and prescriptions.</p>
                    </div>
                    <div className="records-header-actions">
                        <button
                            className="records-btn-outlined"
                            onClick={() => navigate('/patient/upload')}
                        >
                            <span className="material-symbols-outlined">file_upload</span>
                            Upload Results
                        </button>
                        <button
                            className="records-btn-filled shadow-lg shadow-primary/20"
                            onClick={exportPDF}
                        >
                            <span className="material-symbols-outlined">print</span>
                            Export / Print
                        </button>
                    </div>
                </div>

                {/* Bento Filter Grid */}
                <div className="records-filters-grid">
                    <div className="records-filter-card">
                        <div className="records-filter-icon bg-primary-fixed text-primary">
                            <span className="material-symbols-outlined">calendar_month</span>
                        </div>
                        <div className="records-filter-select-wrapper">
                            <span className="records-filter-label">Date Range</span>
                            <select
                                className="records-filter-select"
                                value={selectedDateRange}
                                onChange={(e) => setSelectedDateRange(e.target.value)}
                            >
                                <option value="All">All Time</option>
                                <option value="12m">Last 12 Months</option>
                                <option value="year">Current Year</option>
                            </select>
                        </div>
                    </div>

                    <div className="records-filter-card">
                        <div className="records-filter-icon bg-secondary-fixed text-secondary">
                            <span className="material-symbols-outlined">stethoscope</span>
                        </div>
                        <div className="records-filter-select-wrapper">
                            <span className="records-filter-label">Specialty</span>
                            <select
                                className="records-filter-select"
                                value={selectedSpecialty}
                                onChange={(e) => setSelectedSpecialty(e.target.value)}
                            >
                                {specialties.map(spec => (
                                    <option key={spec} value={spec}>{spec}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="records-filter-card">
                        <div className="records-filter-icon bg-tertiary-fixed text-tertiary">
                            <span className="material-symbols-outlined">folder_shared</span>
                        </div>
                        <div className="records-filter-select-wrapper">
                            <span className="records-filter-label">Status</span>
                            <select
                                className="records-filter-select"
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                            >
                                <option value="All">All Status</option>
                                <option value="Finalized">Finalized</option>
                                <option value="Pending">Pending</option>
                            </select>
                        </div>
                    </div>

                    <div className="records-filter-card search-card">
                        <div className="records-filter-icon bg-primary-fixed text-primary" style={{ backgroundColor: 'rgba(10, 110, 189, 0.08)' }}>
                            <span className="material-symbols-outlined">search</span>
                        </div>
                        <div className="records-filter-select-wrapper">
                            <span className="records-filter-label">Search diagnosis or doctors</span>
                            <input
                                type="text"
                                placeholder="Search..."
                                className="records-filter-input"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Medical Records List */}
                {loading ? (
                    <div className="spinner-container"><div className="spinner" /></div>
                ) : error ? (
                    <div className="error-message">{error}</div>
                ) : filteredRecords.length > 0 ? (
                    <div className="records-list">
                        {filteredRecords.map((rec) => {
                            const recordDate = new Date(rec.visitDate || rec.createdAt);
                            const appointmentId = rec.appointmentId?._id || rec.appointmentId;
                            const isExpanded = expandedRecordId === rec._id;

                            // Get lab results matching this record
                            const matchingResults = labResults.filter(
                                res => (res.recordId?._id || res.recordId) === rec._id
                            );

                            return (
                                <div key={rec._id} className="records-item-card">
                                    <div
                                        className="records-item-header"
                                        onClick={() => toggleExpandRecord(rec)}
                                    >
                                        <div className="records-item-primary-info">
                                            <div className="records-date-badge">
                                                <span className="records-date-day">{recordDate.getDate()}</span>
                                                <span className="records-date-month">
                                                    {recordDate.toLocaleString('default', { month: 'short' })} {recordDate.getFullYear()}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="records-item-title-row">
                                                    <h3 className="records-item-title-text">
                                                        {rec.diagnosis ? `${rec.diagnosis.slice(0, 45)}${rec.diagnosis.length > 45 ? '...' : ''}` : 'Consultation Record'}
                                                    </h3>
                                                    <span className="records-status-badge">Completed</span>
                                                </div>
                                                <div className="records-item-meta-row">
                                                    <span className="records-meta-item">
                                                        <span className="material-symbols-outlined">person</span>
                                                        Dr. {rec.doctorId?.userId?.name}
                                                    </span>
                                                    <span className="records-meta-item">
                                                        <span className="material-symbols-outlined">health_and_safety</span>
                                                        {rec.doctorId?.specialty || 'General'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <button className="records-view-details-btn">
                                            {isExpanded ? 'Hide Details' : 'View Details'}
                                            <span className={`material-symbols-outlined transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                                expand_more
                                            </span>
                                        </button>
                                    </div>

                                    {isExpanded && (
                                        <div className="records-expanded-detail">
                                            <div className="records-detail-grid">
                                                {/* Diagnosis */}
                                                <div className="records-detail-column">
                                                    <h4 className="records-detail-title text-primary">
                                                        <span className="material-symbols-outlined">description</span>
                                                        Diagnosis Summary
                                                    </h4>
                                                    <p className="records-detail-text">
                                                        {rec.diagnosis || 'No diagnosis details provided.'}
                                                    </p>
                                                </div>

                                                {/* Prescriptions */}
                                                <div className="records-detail-column">
                                                    <h4 className="records-detail-title text-secondary">
                                                        <span className="material-symbols-outlined">medication</span>
                                                        Prescribed Medications
                                                    </h4>
                                                    {prescriptionsLoading[appointmentId] ? (
                                                        <div className="detail-loading">
                                                            <span className="spinner-small"></span> Loading prescriptions...
                                                        </div>
                                                    ) : prescriptionsMap[appointmentId] && prescriptionsMap[appointmentId].length > 0 ? (
                                                        <ul className="records-prescriptions-list">
                                                            {prescriptionsMap[appointmentId].map((pres, idx) => (
                                                                <li key={pres._id || idx} className="records-prescription-card">
                                                                    <span className="prescription-name">{pres.medicineName}</span>
                                                                    <span className="prescription-notes">{pres.dosageNotes}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <p className="records-detail-empty">No medications prescribed for this visit.</p>
                                                    )}
                                                </div>

                                                {/* Required Tests / Results */}
                                                <div className="records-detail-column">
                                                    <h4 className="records-detail-title text-tertiary">
                                                        <span className="material-symbols-outlined">biotech</span>
                                                        Required Tests & Results
                                                    </h4>
                                                    <div className="records-tests-box">
                                                        {rec.testsRequired ? (
                                                            <div className="records-tests-required">
                                                                <p className="tests-label">Required by doctor:</p>
                                                                <p className="tests-content">{rec.testsRequired}</p>
                                                            </div>
                                                        ) : (
                                                            <p className="records-detail-empty">No tests requested for this visit.</p>
                                                        )}

                                                        {/* Matching results */}
                                                        {matchingResults.length > 0 ? (
                                                            <div className="records-matching-results-list">
                                                                <p className="results-label">Uploaded reports:</p>
                                                                {matchingResults.map(res => (
                                                                    <div key={res._id} className="matching-result-item">
                                                                        <span className="material-symbols-outlined text-primary">check_circle</span>
                                                                        <div className="result-info">
                                                                            <p className="result-name">{res.testName}</p>
                                                                            {res.fileUrl && (
                                                                                <a
                                                                                    href={`http://localhost:5000/${res.fileUrl.replace(/\\/g, '/')}`}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="result-download-link"
                                                                                >
                                                                                    View Report File
                                                                                </a>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="records-no-results-action">
                                                                {rec.testsRequired && (
                                                                    <>
                                                                        <p className="results-pending">Results pending upload.</p>
                                                                        <button
                                                                            className="records-btn-upload-direct"
                                                                            onClick={() => navigate(`/patient/upload?recordId=${rec._id}&doctorId=${rec.doctorId?._id}`)}
                                                                        >
                                                                            <span className="material-symbols-outlined">cloud_upload</span>
                                                                            Upload Results
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="records-empty">
                        <span className="material-symbols-outlined">folder_off</span>
                        <p>No medical records found matching your filters.</p>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}

