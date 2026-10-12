import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { initials } from '../utils/helpers';

const adminLinks = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/employees', label: 'Employees' },
  { to: '/admin/departments', label: 'Departments' },
  { to: '/profile', label: 'My profile' },
];

const employeeLinks = [
  { to: '/employee', label: 'Dashboard', end: true },
  { to: '/profile', label: 'My profile' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const links = user.role === 'admin' ? adminLinks : employeeLinks;

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login', { replace: true });
  };

  const sidebar = (
    <div className="flex h-full flex-col bg-teal-950 text-teal-50">
      <div className="px-6 py-6">
        <p className="text-lg font-bold">Employee Manager</p>
        <p className="text-xs text-teal-300">{user.role === 'admin' ? 'Admin console' : 'Employee portal'}</p>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `block rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive ? 'bg-teal-800 text-white' : 'text-teal-100 hover:bg-teal-900'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-teal-900 p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-700 text-sm font-semibold">
            {initials(user.fullName)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user.fullName}</p>
            <p className="truncate text-xs text-teal-300">{user.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="w-full rounded-lg border border-teal-800 px-3 py-2 text-sm font-medium hover:bg-teal-900">
          Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:flex">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block">{sidebar}</aside>

      {/* Mobile top bar + drawer */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3 lg:hidden">
        <p className="font-bold text-teal-900">Employee Manager</p>
        <button onClick={() => setOpen(true)} className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium" aria-label="Open menu">
          Menu
        </button>
      </header>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-stone-900/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64">{sidebar}</div>
        </div>
      )}

      <main className="flex-1 px-4 py-6 sm:px-8 lg:ml-64">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
