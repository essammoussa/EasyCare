import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';
import AdminHeader from '../../components/AdminHeader';
import { getAnalytics, getAdminAppointments, getAdminUsers } from '../../services/api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import './Admin.css';
import './AdminDashboard.css';
import PageLoader from '../../components/PageLoader';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, usersRes] = await Promise.all([
          getAnalytics(),
          getAdminUsers()
        ]);
        
        setAnalytics(analyticsRes.data);
        
        const sortedUsers = usersRes.data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        ).slice(0, 8);
        setRecentUsers(sortedUsers);
      } catch (err) {
        console.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="admin-page-wrapper">
        {mobileMenuOpen && (
          <div 
            className="mobile-sidebar-backdrop" 
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
        <AdminSidebar activePage="dashboard" isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        <div className="admin-content">
          <AdminHeader onMenuClick={() => setMobileMenuOpen(true)} />
          <div className="admin-main admin-dashboard-main">
            <PageLoader message="Loading dashboard..." />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-wrapper bg-background font-body-md text-on-surface">
      {mobileMenuOpen && (
        <div 
          className="mobile-sidebar-backdrop" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <AdminSidebar activePage="dashboard" isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      
      <div className="admin-content">
        <AdminHeader onMenuClick={() => setMobileMenuOpen(true)} />
        
        <main className="admin-main admin-dashboard-main">
          <div className="dashboard-container">
            {/* Page Header */}
            <div className="dashboard-header">
              <div>
                <h2>Dashboard Overview</h2>
                <p>Welcome back. Here's what's happening today.</p>
              </div>
            </div>

            <div className="dashboard-grid">
              {/* KPI Column Left */}
              <div className="dashboard-left-col">
                {/* KPI Row */}
                <div className="kpi-grid">
                  <div className="kpi-card">
                    <div className="kpi-card-header">
                      <div className="kpi-icon-wrap bg-blue">
                        <span className="material-symbols-outlined text-blue">group</span>
                      </div>
                    </div>
                    <h3 className="kpi-title">Total Users</h3>
                    <p className="kpi-value">{analytics?.totalUsers || 0}</p>
                  </div>

                  <div className="kpi-card">
                    <div className="kpi-card-header">
                      <div className="kpi-icon-wrap bg-teal">
                        <span className="material-symbols-outlined text-teal">medical_services</span>
                      </div>
                    </div>
                    <h3 className="kpi-title">Total Doctors</h3>
                    <p className="kpi-value">{analytics?.totalDoctors || 0}</p>
                  </div>

                  <div className="kpi-card">
                    <div className="kpi-card-header">
                      <div className="kpi-icon-wrap bg-indigo">
                        <span className="material-symbols-outlined text-indigo">event_available</span>
                      </div>
                    </div>
                    <h3 className="kpi-title">Total Appointments</h3>
                    <p className="kpi-value">{analytics?.totalAppointments || 0}</p>
                  </div>

                  <div className="kpi-card">
                    <div className="kpi-card-header">
                      <div className="kpi-icon-wrap bg-amber">
                        <span className="material-symbols-outlined text-amber">rate_review</span>
                      </div>
                    </div>
                    <h3 className="kpi-title">Total Reviews</h3>
                    <p className="kpi-value">{analytics?.totalReviews || 0}</p>
                  </div>
                </div>

                {/* Platform Activity Area Chart */}
                <div className="activity-chart-card">
                  <div className="chart-header">
                    <div>
                      <h3>Platform Activity</h3>
                      <p>Growth of users and appointments (Last 30 Days)</p>
                    </div>
                    <div className="chart-legend">
                      <span className="legend-item">
                        <span className="dot dot-primary"></span> Users
                      </span>
                      <span className="legend-item">
                        <span className="dot dot-secondary"></span> Appointments
                      </span>
                    </div>
                  </div>
                  
                  <div className="chart-area">
                    {analytics?.userTrendSeries?.length > 0 ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={analytics.userTrendSeries} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="gradPatients" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#005596" stopOpacity={0.25} />
                              <stop offset="100%" stopColor="#005596" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="gradDoctors" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#38debb" stopOpacity={0.25} />
                              <stop offset="100%" stopColor="#38debb" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                          <Tooltip
                            contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                            labelStyle={{ fontWeight: 700, color: '#1A1F36' }}
                          />
                          <Area type="monotone" dataKey="patients" stroke="#005596" strokeWidth={3} fill="url(#gradPatients)" name="Patients" dot={{ r: 4, fill: '#005596' }} activeDot={{ r: 6 }} />
                          <Area type="monotone" dataKey="doctors" stroke="#38debb" strokeWidth={3} strokeDasharray="8 4" fill="url(#gradDoctors)" name="Doctors" dot={{ r: 4, fill: '#38debb' }} activeDot={{ r: 6 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                        No user trend data available yet
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Bento Stats */}
                <div className="bento-stats-grid">
                  <div className="bento-stat-card">
                    <div className="bento-icon-wrap bg-primary-light">
                      <span className="material-symbols-outlined color-primary-text scale-125">person_check</span>
                    </div>
                    <div>
                      <h4>{analytics?.activeUsers || 0}</h4>
                      <p>Active Users Now</p>
                    </div>
                  </div>
                  <div className="bento-stat-card">
                    <div className="bento-icon-wrap bg-secondary-light">
                      <span className="material-symbols-outlined color-secondary-text scale-125">pending_actions</span>
                    </div>
                    <div>
                      <h4>{analytics?.pendingDoctors || 0}</h4>
                      <p>Pending Doctors</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Activity Panel */}
              <div className="dashboard-right-col">
                <div className="activity-panel">
                  <div className="activity-panel-header">
                    <h3>Recent Users</h3>
                    <button onClick={() => navigate('/admin/users')}>View All</button>
                  </div>
                  <div className="activity-list">
                    {recentUsers.length > 0 ? (
                      recentUsers.map(user => (
                        <div className="activity-item" key={user._id}>
                          <div className="activity-avatar-wrap">
                            <div className="activity-avatar bg-light-teal text-teal-600">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="activity-badge bg-teal-strong">
                              <span className="material-symbols-outlined">person</span>
                            </div>
                          </div>
                          <div className="activity-info">
                            <p><strong>{user.name}</strong> registered as a new {user.role}.</p>
                            <span className="activity-time">{new Date(user.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="no-activity">No recent users.</p>
                    )}
                    
                    {/* Activity items are now solely derived from recentUsers above */}
                  </div>
                </div>
              </div>
            </div>



          </div>
        </main>
      </div>
    </div>
  );
}
