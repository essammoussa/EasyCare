import { useState, useEffect, useRef } from 'react';

import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { getDoctorAnalytics } from '../../services/api';
import DoctorSidebar from '../../components/DoctorSidebar';
import DoctorHeader from '../../components/DoctorHeader';
import './Doctor.css';
import './DoctorStats.css';

const API_BASE = 'http://localhost:5000';

const VISIT_COLORS = ['#005596', '#006b58', '#EF4444'];
const RANGE_OPTIONS = [
  { label: 'Last 7 Days', value: 7 },
  { label: 'Last 30 Days', value: 30 },
  { label: 'Last 90 Days', value: 90 },
];

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="doc-stats-tooltip">
      <p className="doc-stats-tooltip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function DoctorStats() {

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dateRange, setDateRange] = useState(30);
  const [rangeOpen, setRangeOpen] = useState(false);
  const rangeRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (rangeRef.current && !rangeRef.current.contains(e.target)) {
        setRangeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data } = await getDoctorAnalytics(dateRange);
        setAnalytics(data);
      } catch (err) {
        setAnalytics(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateRange]);

  const handleExport = () => {
    if (!analytics) return;
    const { summary } = analytics;
    const rows = [
      ['Metric', 'Value'],
      ['Total Appointments', summary.totalAppointments],
      ['Completion Rate', `${summary.completionRate}%`],
      ['Completed', summary.completed],
      ['Cancelled', summary.cancelled],
      ['Total Patients', summary.totalPatients],
      ['Average Rating', summary.avgRating],
      ['Reviews Count', summary.reviewsCount],
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `doctor_analytics_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const summary = analytics?.summary || {};
  const visitStatus = analytics?.visitStatus || { completed: 0, rescheduled: 0, cancelled: 0, total: 1 };
  const visitPie = [
    { name: 'Completed', value: visitStatus.completed },
    { name: 'Rescheduled', value: visitStatus.rescheduled },
    { name: 'Cancelled', value: visitStatus.cancelled },
  ].filter((d) => d.value > 0);

  const maxRatingCount = Math.max(...(analytics?.ratingDistribution?.map((r) => r.count) || [1]), 1);
  const rangeLabel = RANGE_OPTIONS.find((o) => o.value === dateRange)?.label || 'Last 30 Days';

  return (
    <div className="doctor-page-wrapper">
      {mobileMenuOpen && (
        <div className="mobile-sidebar-backdrop" onClick={() => setMobileMenuOpen(false)} />
      )}

      <DoctorSidebar
        activePage="stats"
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <div className="doctor-content">
        <DoctorHeader onMenuClick={() => setMobileMenuOpen(true)} />

        <main className="doctor-main doc-stats-main">
          <div className="doc-stats-header-row">
            <div>
              <h1 className="doc-stats-title">Medical Analytics Dashboard</h1>
              <p className="doc-stats-subtitle">
                Comprehensive performance and patient engagement overview.
              </p>
            </div>
            <div className="doc-stats-header-actions">
              <div className="doc-stats-range-dropdown" ref={rangeRef}>
                <button
                  className="doc-stats-range-btn"
                  onClick={() => setRangeOpen(!rangeOpen)}
                >
                  {rangeLabel}
                  <span className="material-symbols-outlined">expand_more</span>
                </button>
                {rangeOpen && (
                  <div className="doc-stats-range-menu">
                    {RANGE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        className={dateRange === opt.value ? 'active' : ''}
                        onClick={() => { setDateRange(opt.value); setRangeOpen(false); }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button className="doc-stats-export-btn" onClick={handleExport}>
                <span className="material-symbols-outlined">download</span>
                Export Report
              </button>
            </div>
          </div>

          {loading ? (
            <div className="doctor-spinner-container"><div className="doctor-spinner" /></div>
          ) : !analytics ? (
            <div className="error-message">Failed to load analytics data.</div>
          ) : (
            <>
              <div className="doc-stats-kpi-grid">
                <div className="doc-stats-kpi-card">
                  <div className="doc-stats-kpi-icon blue">
                    <span className="material-symbols-outlined">calendar_month</span>
                  </div>
                  <div>
                    <p className="doc-stats-kpi-label">Total Appointments</p>
                    <p className="doc-stats-kpi-value">{summary.totalAppointments}</p>
                    <p className="doc-stats-kpi-meta">{summary.recentAppointments} in selected period</p>
                  </div>
                </div>

                <div className="doc-stats-kpi-card">
                  <div className="doc-stats-kpi-icon green">
                    <span className="material-symbols-outlined">trending_up</span>
                  </div>
                  <div>
                    <p className="doc-stats-kpi-label">Completion Rate</p>
                    <p className="doc-stats-kpi-value">{summary.completionRate}%</p>
                    <p className="doc-stats-kpi-meta">{summary.completed} completed visits</p>
                  </div>
                </div>

                <div className="doc-stats-kpi-card">
                  <div className="doc-stats-kpi-icon amber">
                    <span className="material-symbols-outlined">star</span>
                  </div>
                  <div>
                    <p className="doc-stats-kpi-label">Patient Satisfaction</p>
                    <p className="doc-stats-kpi-value">{summary.avgRating || '—'}</p>
                    <p className="doc-stats-kpi-meta">Based on {summary.reviewsCount} reviews</p>
                  </div>
                </div>

                <div className="doc-stats-kpi-card doc-stats-kpi-card-dark">
                  <div className="doc-stats-kpi-icon light">
                    <span className="material-symbols-outlined">group</span>
                  </div>
                  <div>
                    <p className="doc-stats-kpi-label">Total Patients</p>
                    <p className="doc-stats-kpi-value">{summary.totalPatients}</p>
                    <p className="doc-stats-kpi-meta">{summary.pendingLabResults} pending lab reviews</p>
                  </div>
                </div>
              </div>

              <div className="doc-stats-charts-row">
                <div className="doc-stats-chart-card doc-stats-chart-wide">
                  <h3 className="doc-stats-chart-title">Appointments Trend</h3>
                  <div className="doc-stats-chart-body">
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={analytics.appointmentTrend || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="current"
                          name="Current Year"
                          stroke="#006b58"
                          fill="rgba(0, 107, 88, 0.15)"
                          strokeWidth={2}
                        />
                        <Area
                          type="monotone"
                          dataKey="previous"
                          name="Previous Year"
                          stroke="#9ca3af"
                          fill="rgba(156, 163, 175, 0.1)"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="doc-stats-chart-card">
                  <h3 className="doc-stats-chart-title">Visit Status</h3>
                  <div className="doc-stats-chart-body doc-stats-pie-wrapper">
                    {visitPie.length > 0 ? (
                      <>
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie
                              data={visitPie}
                              cx="50%"
                              cy="50%"
                              innerRadius={55}
                              outerRadius={80}
                              dataKey="value"
                              paddingAngle={3}
                            >
                              {visitPie.map((_, i) => (
                                <Cell key={i} fill={VISIT_COLORS[i % VISIT_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="doc-stats-pie-legend">
                          {visitPie.map((item, i) => (
                            <div key={item.name} className="doc-stats-pie-legend-item">
                              <span
                                className="doc-stats-pie-dot"
                                style={{ background: VISIT_COLORS[i % VISIT_COLORS.length] }}
                              />
                              <span>{item.name}</span>
                              <strong>{item.value}</strong>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="doc-stats-empty-chart">No visit data available.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="doc-stats-bottom-row doc-stats-bottom-single">
                <div className="doc-stats-chart-card">
                  <h3 className="doc-stats-chart-title">Rating Distribution</h3>
                  <div className="doc-stats-rating-bars">
                    {(analytics.ratingDistribution || []).map((row) => (
                      <div key={row.stars} className="doc-stats-rating-row">
                        <span className="doc-stats-rating-stars">{row.stars} ★</span>
                        <div className="doc-stats-rating-bar-bg">
                          <div
                            className="doc-stats-rating-bar-fg"
                            style={{ width: `${(row.count / maxRatingCount) * 100}%` }}
                          />
                        </div>
                        <span className="doc-stats-rating-count">{row.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="doc-stats-reviews-section">
                <div className="doc-stats-reviews-header">
                  <h3>Recent Patient Feedback</h3>
                </div>
                <div className="doc-stats-reviews-grid">
                  {(analytics.recentReviews || []).length > 0 ? (
                    analytics.recentReviews.map((review) => {
                      const initials = review.patientName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2);
                      const avatarSrc = review.patientPicture
                        ? (review.patientPicture.startsWith('http')
                          ? review.patientPicture
                          : `${API_BASE}${review.patientPicture}`)
                        : null;

                      return (
                        <div key={review._id} className="doc-stats-review-card">
                          <div className="doc-stats-review-header">
                            {avatarSrc ? (
                              <img src={avatarSrc} alt={review.patientName} className="doc-stats-review-avatar" />
                            ) : (
                              <div className="doc-stats-review-avatar-fallback">{initials}</div>
                            )}
                            <div>
                              <p className="doc-stats-review-name">{review.patientName}</p>
                              <p className="doc-stats-review-date">
                                {new Date(review.createdAt).toLocaleDateString('en-US', {
                                  month: 'short', day: 'numeric', year: 'numeric',
                                })}
                              </p>
                            </div>
                            <div className="doc-stats-review-stars">
                              {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                            </div>
                          </div>
                          <p className="doc-stats-review-comment">
                            {review.comment || 'No comment provided.'}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <div className="doc-stats-empty-reviews">
                      <span className="material-symbols-outlined">rate_review</span>
                      <p>No patient reviews yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
