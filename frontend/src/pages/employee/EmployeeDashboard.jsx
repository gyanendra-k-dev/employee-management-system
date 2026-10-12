import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import { formatDate } from '../../utils/helpers';

function InfoCard({ label, children }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-stone-500">{label}</p>
      <div className="mt-2 text-lg font-semibold text-stone-900">{children}</div>
    </div>
  );
}

export default function EmployeeDashboard() {
  const { user, setUser } = useAuth();

  // Refresh details in case an administrator changed them since login.
  useEffect(() => {
    api.get('/auth/me').then((res) => setUser(res.data.user)).catch(() => {});
  }, [setUser]);

  const joined = user.joiningDate ? new Date(user.joiningDate) : null;
  const days = joined ? Math.max(Math.floor((Date.now() - joined.getTime()) / 86400000), 0) : null;

  return (
    <>
      <PageHeader title={`Hello, ${user.fullName.split(' ')[0]}`} subtitle="Here are your employment details.">
        <Link to="/profile" className="btn-secondary">
          Edit profile
        </Link>
      </PageHeader>

      {!user.department && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Your department and designation haven't been assigned yet. Your administrator will update them.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InfoCard label="Department">{user.department?.name || '-'}</InfoCard>
        <InfoCard label="Designation">{user.designation || '-'}</InfoCard>
        <InfoCard label="Joining date">
          {formatDate(user.joiningDate)}
          {days !== null && <span className="mt-1 block text-xs font-normal text-stone-500">{days} days with the company</span>}
        </InfoCard>
        <InfoCard label="Employment status">
          <StatusBadge status={user.status} />
        </InfoCard>
      </div>

      <section className="card mt-6 p-6">
        <h2 className="mb-3 font-semibold text-stone-900">Contact details</h2>
        <dl className="grid gap-4 text-sm sm:grid-cols-3">
          <div><dt className="text-stone-500">Email</dt><dd className="font-medium">{user.email}</dd></div>
          <div><dt className="text-stone-500">Phone</dt><dd className="font-medium">{user.phone}</dd></div>
          <div><dt className="text-stone-500">Address</dt><dd className="font-medium">{user.address || '-'}</dd></div>
        </dl>
      </section>
    </>
  );
}
