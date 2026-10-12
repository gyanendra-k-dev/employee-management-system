import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Spinner from './components/Spinner';
import Login from './pages/Login';
import Signup from './pages/Signup';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';
import AdminDashboard from './pages/admin/AdminDashboard';
import Employees from './pages/admin/Employees';
import EmployeeFormPage from './pages/admin/EmployeeFormPage';
import EmployeeDetails from './pages/admin/EmployeeDetails';
import Departments from './pages/admin/Departments';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import { homePathFor } from './utils/helpers';

// "/" sends people to the right place based on login state and role.
function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner fullPage />;
  return <Navigate to={user ? homePathFor(user.role) : '/login'} replace />;
}

// Logged-in users shouldn't see the login/signup pages.
function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner fullPage />;
  return user ? <Navigate to={homePathFor(user.role)} replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/signup" element={<PublicOnly><Signup /></PublicOnly>} />

      {/* Any logged-in user */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/profile" element={<Profile />} />

          {/* Admin only */}
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/employees" element={<Employees />} />
            <Route path="/admin/employees/new" element={<EmployeeFormPage />} />
            <Route path="/admin/employees/:id" element={<EmployeeDetails />} />
            <Route path="/admin/employees/:id/edit" element={<EmployeeFormPage />} />
            <Route path="/admin/departments" element={<Departments />} />
          </Route>

          {/* Employee only */}
          <Route element={<ProtectedRoute roles={['employee']} />}>
            <Route path="/employee" element={<EmployeeDashboard />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
