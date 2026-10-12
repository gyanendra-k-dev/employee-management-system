import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import ErrorMessage from '../../components/ErrorMessage';
import ConfirmModal from '../../components/ConfirmModal';
import { STATUS_OPTIONS, formatDate, getErrorMessage } from '../../utils/helpers';

export default function Employees() {
  const { user: me } = useAuth();

  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0); // bump to refetch

  // Delete flow
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Wait until the admin stops typing before calling the API.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    api.get('/departments').then((res) => setDepartments(res.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    let ignore = false; // prevents an old slow response from overwriting a newer one
    setLoading(true);
    setError('');

    const params = { page, limit: 8 };
    if (debouncedSearch) params.search = debouncedSearch;
    if (department) params.department = department;
    if (status) params.status = status;
    if (role) params.role = role;

    api
      .get('/employees', { params })
      .then((res) => {
        if (ignore) return;
        setEmployees(res.data.data);
        setPagination(res.data.pagination);
      })
      .catch((err) => !ignore && setError(getErrorMessage(err)))
      .finally(() => !ignore && setLoading(false));

    return () => {
      ignore = true;
    };
  }, [debouncedSearch, department, status, role, page, reloadKey]);

  const changeFilter = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setDepartment('');
    setStatus('');
    setRole('');
    setPage(1);
  };

  const updateStatus = async (employee, newStatus) => {
    try {
      await api.patch(`/employees/${employee._id}/status`, { status: newStatus });
      toast.success(`${employee.fullName} is now ${newStatus.replace('_', ' ')}`);
      setReloadKey((k) => k + 1);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/employees/${toDelete._id}`);
      toast.success('Employee deleted');
      setToDelete(null);
      // If we deleted the last row on this page, step back one page.
      if (employees.length === 1 && page > 1) setPage(page - 1);
      else setReloadKey((k) => k + 1);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const hasFilters = search || department || status || role;

  return (
    <>
      <PageHeader title="Employees" subtitle={`${pagination.total} employee(s) found`}>
        <Link to="/admin/employees/new" className="btn-primary">Add employee</Link>
      </PageHeader>

      <div className="card mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <input className="input lg:col-span-2" placeholder="Search by name, email, phone..." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search employees" />
        <select className="input" value={department} onChange={changeFilter(setDepartment)} aria-label="Filter by department">
          <option value="">All departments</option>
          {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
        </select>
        <select className="input" value={status} onChange={changeFilter(setStatus)} aria-label="Filter by status">
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select className="input" value={role} onChange={changeFilter(setRole)} aria-label="Filter by role">
          <option value="">All roles</option>
          <option value="employee">Employee</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <ErrorMessage message={error} onRetry={() => setReloadKey((k) => k + 1)} />

      <div className="card overflow-hidden">
        {loading ? (
          <Spinner label="Loading employees..." />
        ) : employees.length === 0 ? (
          <EmptyState
            title={hasFilters ? 'No employees match your filters' : 'No employees yet'}
            message={hasFilters ? 'Try a different search or clear the filters.' : 'Add your first employee to get started.'}
            action={hasFilters ? <button className="btn-secondary" onClick={clearFilters}>Clear filters</button> : <Link to="/admin/employees/new" className="btn-primary">Add employee</Link>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-stone-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Employee</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Department</th>
                  <th className="hidden px-4 py-3 font-medium lg:table-cell">Designation</th>
                  <th className="hidden px-4 py-3 font-medium xl:table-cell">Joined</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {employees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-stone-50">
                    <td className="px-4 py-3">
                      <Link to={`/admin/employees/${emp._id}`} className="font-medium text-stone-900 hover:text-teal-700">{emp.fullName}</Link>
                      {emp.role === 'admin' && <span className="ml-2 rounded bg-teal-50 px-1.5 py-0.5 text-xs font-medium text-teal-700">Admin</span>}
                      <p className="text-xs text-stone-500">{emp.email}</p>
                    </td>
                    <td className="hidden px-4 py-3 text-stone-600 md:table-cell">{emp.department?.name || '-'}</td>
                    <td className="hidden px-4 py-3 text-stone-600 lg:table-cell">{emp.designation || '-'}</td>
                    <td className="hidden px-4 py-3 text-stone-600 xl:table-cell">{formatDate(emp.joiningDate)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={emp.status}
                        onChange={(e) => updateStatus(emp, e.target.value)}
                        disabled={emp._id === me._id}
                        className="rounded-md border border-stone-300 bg-white px-2 py-1 text-xs disabled:bg-stone-100"
                        aria-label={`Status for ${emp.fullName}`}
                      >
                        {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Link to={`/admin/employees/${emp._id}`} className="font-medium text-stone-600 hover:text-teal-700">View</Link>
                      <Link to={`/admin/employees/${emp._id}/edit`} className="ml-3 font-medium text-stone-600 hover:text-teal-700">Edit</Link>
                      <button
                        onClick={() => setToDelete(emp)}
                        disabled={emp._id === me._id}
                        className="ml-3 font-medium text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:text-stone-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination.pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-stone-500">Page {pagination.page} of {pagination.pages}</span>
          <div className="flex gap-2">
            <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
            <button className="btn-secondary" disabled={page >= pagination.pages} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </div>
      )}

      {toDelete && (
        <ConfirmModal
          title="Delete employee?"
          message={`This permanently removes ${toDelete.fullName} and their account. This can't be undone.`}
          loading={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </>
  );
}
