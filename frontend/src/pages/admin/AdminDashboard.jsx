import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import Spinner from '../../components/Spinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import { formatDate, getErrorMessage, statusLabel } from '../../utils/helpers';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/dashboard/stats');
      setStats(data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Spinner label="Loading dashboard..." />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;

  const maxDept = Math.max(...stats.byDepartment.map((d) => d.count), 1);

  return (
    <>
      <PageHeader title="Admin dashboard" subtitle="A snapshot of your workforce.">
        <Link to="/admin/employees/new" className="btn-primary">Add employee</Link>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total employees" value={stats.totalEmployees} hint={`${stats.adminCount} admin account(s)`} />
        <StatCard label="Active employees" value={stats.activeEmployees} />
        <StatCard label="On leave" value={stats.byStatus.on_leave} hint={`${stats.byStatus.inactive} inactive, ${stats.byStatus.terminated} terminated`} />
        <StatCard label="Departments" value={stats.departmentCount} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="mb-4 font-semibold text-stone-900">Employees by department</h2>
          {stats.byDepartment.length === 0 ? (
            <EmptyState title="No employees yet" message="Add your first employee to see department statistics." />
          ) : (
            <ul className="space-y-3">
              {stats.byDepartment.map((d) => (
                <li key={d.name}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-stone-700">{d.name}</span>
                    <span className="font-medium text-stone-900">{d.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-stone-100">
                    <div className="h-2 rounded-full bg-teal-600" style={{ width: `${(d.count / maxDept) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-6">
          <h2 className="mb-4 font-semibold text-stone-900">Status breakdown</h2>
          <ul className="divide-y divide-stone-100 text-sm">
            {Object.entries(stats.byStatus).map(([status, count]) => (
              <li key={status} className="flex items-center justify-between py-2.5">
                <StatusBadge status={status} />
                <span className="font-medium text-stone-900">{count} {statusLabel(status).toLowerCase()}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card mt-6 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-stone-900">Recently added</h2>
          <Link to="/admin/employees" className="text-sm font-semibold text-teal-700 hover:underline">View all</Link>
        </div>
        {stats.recentHires.length === 0 ? (
          <EmptyState title="Nothing here yet" message="Newly added employees will show up here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-stone-500">
                <tr><th className="pb-2 font-medium">Name</th><th className="pb-2 font-medium">Department</th><th className="pb-2 font-medium">Joined</th><th className="pb-2 font-medium">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {stats.recentHires.map((e) => (
                  <tr key={e._id}>
                    <td className="py-2.5"><Link to={`/admin/employees/${e._id}`} className="font-medium text-stone-900 hover:text-teal-700">{e.fullName}</Link></td>
                    <td className="py-2.5 text-stone-600">{e.department?.name || '-'}</td>
                    <td className="py-2.5 text-stone-600">{formatDate(e.joiningDate)}</td>
                    <td className="py-2.5"><StatusBadge status={e.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
