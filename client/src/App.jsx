import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRedirect from './components/RoleRedirect';
import ScrollToTop from './components/ScrollToTop';
import PageLoader from './components/PageLoader';
import useAuth from './hooks/useAuth';

// Public pages
import Home from './pages/patient/Home';
import Login from './pages/patient/Login';
import Register from './pages/patient/Register';
import ForgotPassword from './pages/patient/ForgotPassword';
import ResetPassword from './pages/patient/ResetPassword';
import Doctors from './pages/patient/Doctors';
import DoctorProfile from './pages/patient/DoctorProfile';

// Patient pages (protected)
import PatientDashboard from './pages/patient/Dashboard';
import BookAppointment from './pages/patient/BookAppointment';
import MedicalRecords from './pages/patient/MedicalRecords';
import UploadResults from './pages/patient/UploadResults';
import MapSearch from './pages/patient/MapSearch';
import MyAppointments from './pages/patient/MyAppointments';
import Chat from './pages/patient/Chat';

// Doctor pages (protected)
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorAppointments from './pages/doctor/DoctorAppointments';
import DoctorPatientRecords from './pages/doctor/DoctorPatientRecords';
import DoctorResults from './pages/doctor/DoctorResults';
import DoctorDiagnosis from './pages/doctor/DoctorDiagnosis';
import DoctorStats from './pages/doctor/DoctorStats';
import DoctorChat from './pages/doctor/DoctorChat';

// Admin pages (protected)
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminDoctors from './pages/admin/AdminDoctors';
import AdminAppointments from './pages/admin/AdminAppointments';
import AdminReviews from './pages/admin/AdminReviews';
import AdminAnalytics from './pages/admin/AdminAnalytics';

// Shared
import Settings from './components/Settings';

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return <PageLoader message="Loading EasyCare..." fullScreen />;
  }

  return (
    <>
      <ScrollToTop />
      <Routes>
      {/* ─── Public Routes (patient/guest only — staff redirected to portal) ─ */}
      <Route path="/" element={<RoleRedirect><Home /></RoleRedirect>} />
      <Route path="/login" element={<RoleRedirect><Login /></RoleRedirect>} />
      <Route path="/register" element={<RoleRedirect><Register /></RoleRedirect>} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/doctors" element={<RoleRedirect><Doctors /></RoleRedirect>} />
      <Route path="/doctors/:id" element={<RoleRedirect><DoctorProfile /></RoleRedirect>} />

      {/* ─── Patient Routes ─────────────── */}
      <Route
        path="/patient/dashboard"
        element={
          <ProtectedRoute roles={['patient']}>
            <PatientDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/book/:doctorId"
        element={
          <ProtectedRoute roles={['patient']}>
            <BookAppointment />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/appointments"
        element={
          <ProtectedRoute roles={['patient']}>
            <MyAppointments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/records"
        element={
          <ProtectedRoute roles={['patient']}>
            <MedicalRecords />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/upload"
        element={
          <ProtectedRoute roles={['patient']}>
            <UploadResults />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/map"
        element={
          <ProtectedRoute roles={['patient']}>
            <MapSearch />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/settings"
        element={
          <ProtectedRoute roles={['patient']}>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/chat"
        element={
          <ProtectedRoute roles={['patient']}>
            <Chat />
          </ProtectedRoute>
        }
      />

      {/* ─── Doctor Routes ──────────────── */}
      <Route
        path="/doctor/dashboard"
        element={
          <ProtectedRoute roles={['doctor']}>
            <DoctorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/appointments"
        element={
          <ProtectedRoute roles={['doctor']}>
            <DoctorAppointments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/records"
        element={
          <ProtectedRoute roles={['doctor']}>
            <DoctorPatientRecords />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/results"
        element={
          <ProtectedRoute roles={['doctor']}>
            <DoctorResults />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/diagnosis"
        element={
          <ProtectedRoute roles={['doctor']}>
            <DoctorDiagnosis />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/stats"
        element={
          <ProtectedRoute roles={['doctor']}>
            <DoctorStats />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/chat"
        element={
          <ProtectedRoute roles={['doctor']}>
            <DoctorChat />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/settings"
        element={
          <ProtectedRoute roles={['doctor']}>
            <Settings />
          </ProtectedRoute>
        }
      />

      {/* ─── Admin Routes ───────────────── */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminUsers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/doctors"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminDoctors />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/appointments"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminAppointments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reviews"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminReviews />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminAnalytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute roles={['admin']}>
            <Settings />
          </ProtectedRoute>
        }
      />
    </Routes>
    </>
  );
}
