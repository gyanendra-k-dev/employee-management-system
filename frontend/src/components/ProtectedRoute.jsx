import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';
import { homePathFor } from '../utils/helpers';

// Usage:  <Route element={<ProtectedRoute roles={['admin']} />}> ...child routes... </Route>
// NOTE: this only improves the user experience. The REAL protection is on the backend.
export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner fullPage label="Checking your session..." />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to={homePathFor(user.role)} replace />;

  return <Outlet />;
}
