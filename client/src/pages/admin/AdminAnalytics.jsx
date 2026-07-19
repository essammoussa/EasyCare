import { useState, useEffect, useRef } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import AdminHeader from '../../components/AdminHeader';
import Toast from '../../components/Toast';
import { getAnalytics, getAdminDoctors } from '../../services/api';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './AdminAnalytics.css';
import PageLoader from '../../components/PageLoader';

// Fix Leaflet default marker icons (they break in bundlers)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Color palette for bar chart
const BAR_COLORS = ['#005596', '#0072c6', '#3498db', '#38a1db', '#6bc3eb', '#a4d8f0'];

// Custom Tooltip for charts
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="analytics-tooltip">
      <p className="analytics-tooltip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: '2px 0', fontSize: 13, fontWeight: 600 }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

const RANGE_OPTIONS = [
  { label: 'Last 7 Days', value: 7 },
  { label: 'Last 14 Days', value: 14 },
  { label: 'Last 30 Days', value: 30 },
  { label: 'Last 90 Days', value: 90 },
];

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [dateRange, setDateRange] = useState(30);
  const [rangeDropdownOpen, setRangeDropdownOpen] = useState(false);
  const rangeRef = useRef(null);

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
  };

  const handleExportReport = () => {
    if (!doctors || doctors.length === 0) {
      showToast('No data to export', 'error');
      return;
    }
    
    const headers = ['ID', 'Doctor Name', 'Specialty', 'Clinic', 'Rating', 'Experience (Years)'];
    const csvRows = [
      headers.join(','),
      ...doctors.map(doc => [
        doc._id,
        `"${doc.userId?.name || 'Unknown'}"`,
        `"${doc.specialty || ''}"`,
        `"${doc.clinic || ''}"`,
        doc.rating || '0.0',
        doc.experience || '0'
      ].join(','))
    ];
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `analytics_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Report exported successfully', 'success');
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (rangeRef.current && !rangeRef.current.contains(e.target)) {
        setRangeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [analyticsRes, doctorsRes] = await Promise.all([
          getAnalytics(dateRange),
          getAdminDoctors(),
        ]);
        setAnalytics(analyticsRes.data);
        setDoctors(doctorsRes.data);
      } catch (error) {
        console.error('Failed to fetch analytics data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [dateRange]);

  const topDoctors = analytics?.topDoctors || [];
  const geoPoints = analytics?.geoPoints || [];
  const specialtyData = analytics?.appointmentsBySpecialty || [];
  const userTrend = analytics?.userTrendSeries || [];
  const maxSpecialtyCount = specialtyData.length > 0 ? specialtyData[0].count : 1;

  // Calculate map center from available geo points, fallback to Cairo
  const mapCenter = geoPoints.length > 0
    ? [
        geoPoints.reduce((s, p) => s + p.lat, 0) / geoPoints.length,
        geoPoints.reduce((s, p) => s + p.lng, 0) / geoPoints.length,
      ]
    : [30.0444, 31.2357];

  return (
    <div className="admin-page-wrapper">
      {mobileMenuOpen && (
        <div 
          className="mobile-sidebar-backdrop" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <AdminSidebar activePage="analytics" isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <div className="admin-content">
        <AdminHeader onMenuClick={() => setMobileMenuOpen(true)} />
        
        <main className="admin-main admin-analytics-main">
          {/* Dashboard Header */}
          <div className="analytics-header">
            <div>
              <h2>Analytics Dashboard</h2>
              <p>Comprehensive insights into EasyCare ecosystem performance.</p>
            </div>
            <div className="analytics-actions">
              <div className="range-dropdown-wrapper" ref={rangeRef}>
                <button
                  className="btn-outline-pill"
                  onClick={() => setRangeDropdownOpen(!rangeDropdownOpen)}
                >
                  <span className="material-symbols-outlined">calendar_today</span>
                  {RANGE_OPTIONS.find(o => o.value === dateRange)?.label}
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>expand_more</span>
                </button>
                {rangeDropdownOpen && (
                  <div className="range-dropdown">
                    {RANGE_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        className={`range-option ${dateRange === opt.value ? 'active' : ''}`}
                        onClick={() => {
                          setDateRange(opt.value);
                          setRangeDropdownOpen(false);
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button className="btn-primary-pill shadow-lg" onClick={handleExportReport}>
                <span className="material-symbols-outlined">download</span>
                Export Report
              </button>
            </div>
          </div>

          {/* Metric Stat Cards — data driven */}
          <div className="analytics-stats-grid">
            <div className="analytics-stat-card">
              <div className="stat-card-header">
                <div className="icon-wrap bg-primary-light">
                  <span className="material-symbols-outlined color-primary-text" style={{fontVariationSettings: "'FILL' 1"}}>workspace_premium</span>
                </div>
                <span className="badge-pill bg-secondary-light color-secondary-text">
                  <span className="material-symbols-outlined text-sm">trending_up</span>
                  Top Performers
                </span>
              </div>
              <p className="stat-subtitle">Most Booked Doctor</p>
              <h3>{analytics?.mostBooked ? `Dr. ${analytics.mostBooked.name}` : 'N/A'}</h3>
              <p className="stat-footer">
                {analytics?.mostBooked ? `${analytics.mostBooked.appointmentCount} Appointments` : 'No data yet'}
              </p>
            </div>
            <div className="analytics-stat-card">
              <div className="stat-card-header">
                <div className="icon-wrap bg-tertiary-light">
                  <span className="material-symbols-outlined color-tertiary-text" style={{fontVariationSettings: "'FILL' 1"}}>star_rate</span>
                </div>
                <span className="badge-pill bg-primary-light color-primary-text">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  High Satisfaction
                </span>
              </div>
              <p className="stat-subtitle">Top-Rated Specialty</p>
              <h3>{analytics?.topRatedSpecialty?.specialty || 'N/A'}</h3>
              <p className="stat-footer">
                {analytics?.topRatedSpecialty ? `${analytics.topRatedSpecialty.avgRating}/5.0 Average Satisfaction` : 'No data yet'}
              </p>
            </div>
            <div className="analytics-stat-card">
              <div className="stat-card-header">
                <div className="icon-wrap bg-secondary-light">
                  <span className="material-symbols-outlined color-secondary-text" style={{fontVariationSettings: "'FILL' 1"}}>schedule</span>
                </div>
                <span className="badge-pill bg-warning-light color-warning-text">
                  <span className="material-symbols-outlined text-sm">bolt</span>
                  Peak Activity
                </span>
              </div>
              <p className="stat-subtitle">Busiest Day of Week</p>
              <h3>{analytics?.busiestDay?.day || 'N/A'}</h3>
              <p className="stat-footer">
                {analytics?.busiestDay?.percentAboveAvg
                  ? `${analytics.busiestDay.percentAboveAvg}% higher volume than avg`
                  : 'No data yet'}
              </p>
            </div>
          </div>

          {/* Main Charts Area */}
          <div className="analytics-charts-grid">
            {/* Line/Area Chart: New Users Over Time */}
            <div className="chart-card line-chart-card">
              <div className="chart-header">
                <h4>New Users Acquisition</h4>
                <div className="chart-legend">
                  <div className="legend-item">
                    <span className="legend-dot bg-primary"></span>
                    <span>Patients</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot bg-secondary"></span>
                    <span>Doctors</span>
                  </div>
                </div>
              </div>
              <div className="chart-area">
                {userTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={256}>
                    <AreaChart data={userTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradAnalyticsPatients" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#005596" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#005596" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradAnalyticsDoctors" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#006b58" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#006b58" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="week"
                        tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 600 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#6B7280' }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="patients"
                        stroke="#005596"
                        strokeWidth={3}
                        fill="url(#gradAnalyticsPatients)"
                        name="Patients"
                        dot={{ r: 4, fill: '#005596', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 7, fill: '#005596', stroke: '#fff', strokeWidth: 2 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="doctors"
                        stroke="#006b58"
                        strokeWidth={3}
                        strokeDasharray="6 3"
                        fill="url(#gradAnalyticsDoctors)"
                        name="Doctors"
                        dot={{ r: 4, fill: '#006b58', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 7, fill: '#006b58', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="chart-empty-state">
                    <span className="material-symbols-outlined">show_chart</span>
                    <p>No user registration data available yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Bar Chart: Appointments by Specialty */}
            <div className="chart-card bar-chart-card">
              <h4>By Specialty</h4>
              <div className="bar-chart-content">
                {specialtyData.length > 0 ? (
                  <>
                    {specialtyData.map((item, idx) => (
                      <div className="progress-row" key={item.specialty}>
                        <div className="progress-labels">
                          <span>{item.specialty}</span>
                          <span>{item.count}</span>
                        </div>
                        <div className="progress-track">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${(item.count / maxSpecialtyCount) * 100}%`,
                              backgroundColor: BAR_COLORS[idx % BAR_COLORS.length],
                              transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="chart-empty-state small">
                    <span className="material-symbols-outlined">bar_chart</span>
                    <p>No specialty data yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Second Row: Map and Data Table */}
          <div className="analytics-bottom-grid">
            {/* Geo-Distribution — Interactive Leaflet Map */}
            <div className="geo-card">
              <div className="geo-header">
                <h4>Geo-Distribution</h4>
                <p>Doctor and Patient density by region</p>
              </div>
              <div className="geo-map-area">
                <MapContainer
                  center={mapCenter}
                  zoom={geoPoints.length > 0 ? 6 : 5}
                  style={{ width: '100%', height: '100%', minHeight: 300, borderRadius: '0 0 0 0' }}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {geoPoints.map((point) => (
                    <Marker key={point.id} position={[point.lat, point.lng]}>
                      <Popup>
                        <div className="geo-map-popup">
                          <strong className="geo-map-popup-name">Dr. {point.name}</strong>
                          <br />
                          <span className="geo-map-popup-specialty">{point.specialty}</span>
                          {point.clinic && (
                            <>
                              <br />
                              <span className="geo-map-popup-clinic">{point.clinic}</span>
                            </>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
              <div className="geo-legend">
                <div className="geo-legend-item">
                  <span className="legend-dot bg-primary"></span>
                  <div>
                    <h5>{geoPoints.length} Doctors</h5>
                    <p>With locations</p>
                  </div>
                </div>
                <div className="geo-legend-item">
                  <span className="legend-dot bg-teal-medium"></span>
                  <div>
                    <h5>{analytics?.totalDoctors || 0} Total</h5>
                    <p>All registered</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Doctors Table */}
            <div className="top-doctors-card">
              <div className="top-docs-header">
                <h4>Top 5 Performing Doctors</h4>
              </div>
              <div className="top-docs-table-wrap">
                <table className="top-docs-table">
                  <thead>
                    <tr>
                      <th>Doctor</th>
                      <th>Specialty</th>
                      <th>Appointments</th>
                      <th>Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="4"><PageLoader message="Loading top doctors..." /></td>
                      </tr>
                    ) : topDoctors.length > 0 ? (
                      topDoctors.map((doc) => (
                        <tr key={doc._id}>
                          <td>
                            <div className="top-doc-info">
                              <div className="top-doc-avatar">
                                {doc.name?.charAt(0).toUpperCase()}
                              </div>
                              <span className="top-doc-name">Dr. {doc.name}</span>
                            </div>
                          </td>
                          <td className="color-secondary-text-light-color">{doc.specialty}</td>
                          <td className="font-semibold">{doc.appointmentCount}</td>
                          <td>
                            <div className="flex-rating">
                              <span className="material-symbols-outlined color-warning-text" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                              <span className="font-bold">{doc.rating ? Number(doc.rating).toFixed(1) : '0.0'}</span>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="align-text-center color-secondary-text-light-color py-4">No doctors data available.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
}
