import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import PageLoader from './PageLoader';
import { getRoleDashboard } from '../utils/roleRoutes';

export default function ProtectedRoute({ children, roles }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return <PageLoader message="Authenticating..." fullScreen />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={getRoleDashboard(user.role)} replace />;
  }

  return children;
}
