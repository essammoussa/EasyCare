import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { getRoleDashboard, isStaffRole } from '../utils/roleRoutes';

/**
 * Redirects logged-in doctors/admins away from public patient-facing pages
 * to their portal dashboard (so they never land on pages with the patient navbar).
 */
export default function RoleRedirect({ children }) {
  const { user, isAuthenticated } = useAuth();

  if (isAuthenticated && isStaffRole(user?.role)) {
    return <Navigate to={getRoleDashboard(user.role)} replace />;
  }

  return children;
}
