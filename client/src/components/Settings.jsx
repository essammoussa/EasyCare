import { useState, useEffect, useRef } from 'react';
import useAuth from '../hooks/useAuth';
import * as api from '../services/api';

// Shared
import './Settings.css';

// Patient wrappers
import Navbar from './Navbar';
import Footer from './Footer';

// Doctor wrappers
import DoctorSidebar from './DoctorSidebar';
import DoctorHeader from './DoctorHeader';

// Admin wrappers
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import '../pages/admin/AdminDashboard.css';

const API_BASE = 'http://localhost:5000';

export default function Settings() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Profile Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ text: '', type: '' });

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' });

  // Doctor Professional Profile Form State
  const [doctorId, setDoctorId] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [clinic, setClinic] = useState('');
  const [experience, setExperience] = useState(0);
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [professionalLoading, setProfessionalLoading] = useState(false);
  const [professionalMessage, setProfessionalMessage] = useState({ text: '', type: '' });

  // Doctor Availability Slots State
  const [slots, setSlots] = useState([]);
  const [newSlotDate, setNewSlotDate] = useState(new Date().toISOString().slice(0, 10));
  const [newSlotStart, setNewSlotStart] = useState('');
  const [newSlotEnd, setNewSlotEnd] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsMessage, setSlotsMessage] = useState({ text: '', type: '' });

  // Fetch initial profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.getProfile();
        setName(data.name || '');
        setPhone(data.phone || '');
        setProfilePicture(data.profilePicture || '');
      } catch (error) {
        console.error('Failed to load profile');
      }
    };

    const fetchDoctorProfile = async () => {
      try {
        const { data: doctors } = await api.getDoctors();
        const myDoc = doctors.find((d) => d.userId?._id === user?._id || d.userId === user?._id);
        if (myDoc) {
          setDoctorId(myDoc._id);
          setSpecialty(myDoc.specialty || '');
          setClinic(myDoc.clinic || '');
          setExperience(myDoc.experience || 0);
          if (myDoc.location?.coordinates) {
            setLng(myDoc.location.coordinates[0] || '');
            setLat(myDoc.location.coordinates[1] || '');
          }
          // Fetch slots
          const { data: slotsData } = await api.getSlots(myDoc._id);
          setSlots(slotsData.slots || slotsData || []);
        }
      } catch (error) {
        console.error('Failed to load doctor profile details:', error);
      }
    };

    fetchProfile();
    if (user?.role === 'doctor') {
      fetchDoctorProfile();
    }
  }, [user]);

  const getAvatarSrc = () => {
    if (!profilePicture) return '';
    if (profilePicture.startsWith('http')) return profilePicture;
    return `${API_BASE}${profilePicture}`;
  };

  const formatSlotDate = (value) => {
    if (!value) return 'No date';
    const date = new Date(`${value}T00:00:00`);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarUploading(true);
    setProfileMessage({ text: '', type: '' });
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const { data } = await api.uploadAvatar(formData);
      setProfilePicture(data.profilePicture);
      updateUser({ profilePicture: data.profilePicture });
      setProfileMessage({ text: 'Profile picture updated!', type: 'success' });
      setTimeout(() => setProfileMessage({ text: '', type: '' }), 3000);
    } catch (err) {
      setProfileMessage({
        text: err.response?.data?.message || 'Failed to upload image.',
        type: 'error',
      });
    } finally {
      setAvatarUploading(false);
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarUploading(true);
    setProfileMessage({ text: '', type: '' });
    try {
      const { data } = await api.updateProfile({ name, phone, profilePicture: '' });
      setProfilePicture('');
      updateUser({ profilePicture: '' });
      setProfileMessage({ text: 'Profile picture removed.', type: 'success' });
      setTimeout(() => setProfileMessage({ text: '', type: '' }), 3000);
    } catch (err) {
      setProfileMessage({
        text: err.response?.data?.message || 'Failed to remove image.',
        type: 'error',
      });
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage({ text: '', type: '' });
    try {
      const { data } = await api.updateProfile({ name, phone, profilePicture });
      updateUser({ name: data.name, phone: data.phone, profilePicture: data.profilePicture });
      setProfileMessage({ text: 'Profile updated successfully!', type: 'success' });
      setTimeout(() => setProfileMessage({ text: '', type: '' }), 3000);
    } catch (err) {
      setProfileMessage({
        text: err.response?.data?.message || 'Failed to update profile.',
        type: 'error',
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: 'New passwords do not match.', type: 'error' });
      return;
    }
    setPasswordLoading(true);
    setPasswordMessage({ text: '', type: '' });
    try {
      await api.changePassword({ currentPassword, newPassword });
      setPasswordMessage({ text: 'Password changed successfully!', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMessage({ text: '', type: '' }), 3000);
    } catch (err) {
      setPasswordMessage({
        text: err.response?.data?.message || 'Failed to change password.',
        type: 'error',
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleProfessionalSubmit = async (e) => {
    e.preventDefault();
    setProfessionalLoading(true);
    setProfessionalMessage({ text: '', type: '' });

    const coords = [parseFloat(lng) || 31.2357, parseFloat(lat) || 30.0444];

    const payload = {
      specialty,
      clinic,
      experience: parseInt(experience) || 0,
      location: {
        type: 'Point',
        coordinates: coords,
      },
    };

    try {
      if (doctorId) {
        await api.updateDoctorProfile(doctorId, payload);
        setProfessionalMessage({ text: 'Professional profile updated successfully!', type: 'success' });
      } else {
        const { data } = await api.createDoctor(payload);
        setDoctorId(data._id);
        setProfessionalMessage({ text: 'Professional profile created successfully!', type: 'success' });
      }
      setTimeout(() => setProfessionalMessage({ text: '', type: '' }), 3000);
    } catch (err) {
      setProfessionalMessage({
        text: err.response?.data?.message || 'Failed to update professional settings.',
        type: 'error',
      });
    } finally {
      setProfessionalLoading(false);
    }
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    if (!newSlotDate || !newSlotStart || !newSlotEnd) {
      setSlotsMessage({ text: 'Please choose a day and enter both start and end times.', type: 'error' });
      return;
    }
    setSlotsLoading(true);
    setSlotsMessage({ text: '', type: '' });
    try {
      const { data } = await api.createSlot({
        date: newSlotDate,
        startTime: newSlotStart,
        endTime: newSlotEnd,
      });
      setSlots((prev) => [...prev, data]);
      setNewSlotDate(new Date().toISOString().slice(0, 10));
      setNewSlotStart('');
      setNewSlotEnd('');
      setSlotsMessage({ text: 'Availability slot added successfully!', type: 'success' });
      setTimeout(() => setSlotsMessage({ text: '', type: '' }), 3000);
    } catch (err) {
      setSlotsMessage({
        text: err.response?.data?.message || 'Failed to add slot.',
        type: 'error',
      });
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Are you sure you want to delete this availability slot?')) return;
    setSlotsLoading(true);
    setSlotsMessage({ text: '', type: '' });
    try {
      await api.deleteSlot(slotId);
      setSlots((prev) => prev.filter((s) => s._id !== slotId));
      setSlotsMessage({ text: 'Slot deleted successfully.', type: 'success' });
      setTimeout(() => setSlotsMessage({ text: '', type: '' }), 3000);
    } catch (err) {
      setSlotsMessage({
        text: err.response?.data?.message || 'Failed to delete slot.',
        type: 'error',
      });
    } finally {
      setSlotsLoading(false);
    }
  };

  const renderContent = () => (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Account Settings</h1>
        <p>Manage your profile preferences and account security.</p>
      </div>

      <div className="settings-tabs">
        <button
          className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <span className="material-symbols-outlined">person</span>
          Profile
        </button>
        {user?.role === 'doctor' && (
          <>
            <button
              className={`settings-tab ${activeTab === 'professional' ? 'active' : ''}`}
              onClick={() => setActiveTab('professional')}
            >
              <span className="material-symbols-outlined">medical_services</span>
              Professional Profile
            </button>
            <button
              className={`settings-tab ${activeTab === 'slots' ? 'active' : ''}`}
              onClick={() => setActiveTab('slots')}
            >
              <span className="material-symbols-outlined">schedule</span>
              Availability Slots
            </button>
          </>
        )}
        <button
          className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <span className="material-symbols-outlined">security</span>
          Security
        </button>
      </div>

      <div className="settings-content">
        {activeTab === 'profile' && (
          <form className="settings-form" onSubmit={handleProfileSubmit}>
            {profileMessage.text && (
              <div className={`settings-alert ${profileMessage.type}`}>
                {profileMessage.text}
              </div>
            )}
            
            <div className="settings-form-group">
              <label>Profile Picture</label>
              <div className="settings-avatar-upload">
                <div className="avatar-upload-preview">
                  {profilePicture ? (
                    <img src={getAvatarSrc()} alt="Profile preview" className="avatar-preview-img" />
                  ) : (
                    <div className="avatar-preview-placeholder">
                      {name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <div className="avatar-upload-actions">
                  <div className="avatar-upload-btns">
                    <button
                      type="button"
                      className="avatar-upload-btn"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={avatarUploading}
                    >
                      <span className="material-symbols-outlined">upload</span>
                      {avatarUploading ? 'Uploading...' : 'Choose Image'}
                    </button>
                    {profilePicture && (
                      <button
                        type="button"
                        className="avatar-remove-btn"
                        onClick={handleRemoveAvatar}
                        disabled={avatarUploading}
                      >
                        <span className="material-symbols-outlined">delete</span>
                        Remove
                      </button>
                    )}
                  </div>
                  <span className="settings-help-text">JPG, PNG, GIF or WebP. Max 5MB.</span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            <div className="settings-form-row">
              <div className="settings-form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="settings-form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="settings-form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="disabled-input"
              />
              <span className="settings-help-text">Email cannot be changed here.</span>
            </div>

            <div className="settings-form-actions">
              <button type="submit" className="settings-btn-primary" disabled={profileLoading}>
                {profileLoading ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'security' && (
          <form className="settings-form" onSubmit={handlePasswordSubmit}>
            {passwordMessage.text && (
              <div className={`settings-alert ${passwordMessage.type}`}>
                {passwordMessage.text}
              </div>
            )}

            <div className="settings-form-group">
              <label>Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>

            <div className="settings-form-group">
              <label>New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
              />
            </div>

            <div className="settings-form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
              />
            </div>

            <div className="settings-form-actions">
              <button type="submit" className="settings-btn-primary" disabled={passwordLoading}>
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        )}

        {user?.role === 'doctor' && activeTab === 'professional' && (
          <form className="settings-form" onSubmit={handleProfessionalSubmit}>
            {professionalMessage.text && (
              <div className={`settings-alert ${professionalMessage.type}`}>
                {professionalMessage.text}
              </div>
            )}

            <div className="settings-form-row">
              <div className="settings-form-group">
                <label>Medical Specialty</label>
                <select
                  required
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid var(--outline, #cbd5e1)',
                    borderRadius: 'var(--radius-md, 8px)',
                    fontSize: '14px',
                    color: 'var(--color-primary-text, #0f172a)',
                    background: 'var(--surface, #ffffff)',
                  }}
                >
                  <option value="">Select Specialty</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Dermatology">Dermatology</option>
                  <option value="General Practice">General Practice</option>
                  <option value="Dentistry">Dentistry</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Orthopedics">Orthopedics</option>
                </select>
              </div>
              <div className="settings-form-group">
                <label>Years of Experience</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                />
              </div>
            </div>

            <div className="settings-form-group">
              <label>Clinic Address</label>
              <input
                type="text"
                required
                value={clinic}
                onChange={(e) => setClinic(e.target.value)}
                placeholder="e.g. 12 El-Galaa St., Heliopolis, Cairo"
              />
            </div>

            <div className="settings-form-row">
              <div className="settings-form-group">
                <label>Location Longitude (for Map Search)</label>
                <input
                  type="number"
                  step="0.000001"
                  required
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="e.g. 31.2357"
                />
              </div>
              <div className="settings-form-group">
                <label>Location Latitude (for Map Search)</label>
                <input
                  type="number"
                  step="0.000001"
                  required
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="e.g. 30.0444"
                />
              </div>
            </div>
            <span className="settings-help-text" style={{ marginBottom: '24px' }}>
              These coordinates position your clinic on the Map Search page. (Cairo center: 31.2357, 30.0444)
            </span>

            <div className="settings-form-actions">
              <button type="submit" className="settings-btn-primary" disabled={professionalLoading}>
                {professionalLoading ? 'Saving...' : 'Save Professional Profile'}
              </button>
            </div>
          </form>
        )}

        {user?.role === 'doctor' && activeTab === 'slots' && (
          <div className="slots-manager-box">
            {slotsMessage.text && (
              <div className={`settings-alert ${slotsMessage.type}`}>
                {slotsMessage.text}
              </div>
            )}

            {!doctorId ? (
              <div className="slots-empty-state" style={{ borderStyle: 'solid' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--warning)' }}>warning</span>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Professional Profile Required</h3>
                <p style={{ color: 'var(--color-secondary-text)', fontSize: '14px', marginTop: '8px' }}>
                  Please complete and save your Professional Profile first before managing availability slots.
                </p>
              </div>
            ) : (
              <>
                <form className="slots-add-form" onSubmit={handleAddSlot}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>Add Availability Slot</h3>
                  <div className="settings-form-row" style={{ marginBottom: '16px' }}>
                    <div className="settings-form-group" style={{ margin: 0 }}>
                      <label>Day</label>
                      <input
                        type="date"
                        required
                        value={newSlotDate}
                        onChange={(e) => setNewSlotDate(e.target.value)}
                      />
                    </div>
                    <div className="settings-form-group" style={{ margin: 0 }}>
                      <label>Start Time</label>
                      <input
                        type="text"
                        placeholder="e.g. 9:00 AM or 14:00"
                        required
                        value={newSlotStart}
                        onChange={(e) => setNewSlotStart(e.target.value)}
                      />
                    </div>
                    <div className="settings-form-group" style={{ margin: 0 }}>
                      <label>End Time</label>
                      <input
                        type="text"
                        placeholder="e.g. 10:00 AM or 15:00"
                        required
                        value={newSlotEnd}
                        onChange={(e) => setNewSlotEnd(e.target.value)}
                      />
                    </div>
                  </div>
                  <button type="submit" className="settings-btn-primary" disabled={slotsLoading}>
                    Add Time Slot
                  </button>
                </form>

                <div className="slots-list-section">
                  <h3>Active Availability Slots</h3>
                  {slots.length > 0 ? (
                    <div className="slots-grid">
                      {slots.map((s) => (
                        <div key={s._id} className="slot-item-card">
                          <div className="slot-item-info">
                            <span className="material-symbols-outlined">schedule</span>
                            <span>{formatSlotDate(s.date)} • {s.startTime} - {s.endTime}</span>
                          </div>
                          <button
                            type="button"
                            className="slot-item-delete-btn"
                            onClick={() => handleDeleteSlot(s._id)}
                            disabled={slotsLoading}
                            title="Delete Slot"
                          >
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="slots-empty-state">
                      <span className="material-symbols-outlined" style={{ fontSize: '36px' }}>calendar_today</span>
                      <p>No availability slots defined. Patients won't be able to book appointments with you until you add some slots.</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // Wrapper Selection based on Role
  if (user?.role === 'admin') {
    return (
      <div className="admin-page-wrapper bg-background font-body-md text-on-surface">
        {mobileMenuOpen && (
          <div className="mobile-sidebar-backdrop" onClick={() => setMobileMenuOpen(false)} />
        )}
        <AdminSidebar activePage="settings" isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        <div className="admin-content">
          <AdminHeader onMenuClick={() => setMobileMenuOpen(true)} />
          <main className="admin-main admin-dashboard-main">
            <div className="dashboard-container">{renderContent()}</div>
          </main>
        </div>
      </div>
    );
  }

  if (user?.role === 'doctor') {
    return (
      <div className="doctor-page-wrapper">
        {mobileMenuOpen && (
          <div className="mobile-sidebar-backdrop" onClick={() => setMobileMenuOpen(false)} />
        )}
        <DoctorSidebar activePage="settings" isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        <div className="doctor-content">
          <DoctorHeader onMenuClick={() => setMobileMenuOpen(true)} />
          <main className="doctor-main" style={{ padding: '2rem' }}>
            {renderContent()}
          </main>
        </div>
      </div>
    );
  }

  // Fallback / Patient view
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--background)' }}>
      <Navbar />
      <main style={{ flex: 1, padding: '3rem 1rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {renderContent()}
        </div>
      </main>
      <Footer />
    </div>
  );
}
