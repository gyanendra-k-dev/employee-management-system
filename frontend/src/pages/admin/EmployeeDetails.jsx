import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import ErrorMessage from '../../components/ErrorMessage';
import StatusBadge from '../../components/StatusBadge';
import ConfirmModal from '../../components/ConfirmModal';
import { formatDate, getErrorMessage, initials } from '../../utils/helpers';

function Item({ label, children }) {
  return (
    <div>
      <dt className="text-sm text-stone-500">{label}</dt>
      <dd className="mt-0.5 font-medium text-stone-900">{children || '-'}</dd>
    </div>
  );
}

export default function EmployeeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: me } = useAuth();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/employees/${id}`);
      setEmployee(data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/employees/${id}`);
      toast.success('Employee deleted');
      navigate('/admin/employees', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
      setDeleting(false);
    }
  };

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;

  return (
    <>
      <PageHeader title="Employee details">
        <Link to="/admin/employees" className="btn-secondary">Back to list</Link>
        <Link to={`/admin/employees/${id}/edit`} className="btn-primary">Edit</Link>
        {employee._id !== me._id && <button className="btn-danger" onClick={() => setConfirming(true)}>Delete</button>}
      </PageHeader>

      <div className="card p-6">
        <div className="flex items-center gap-4 border-b border-stone-100 pb-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-100 text-lg font-bold text-teal-800">{initials(employee.fullName)}</div>
          <div>
            <h2 className="text-xl font-bold text-stone-900">{employee.fullName}</h2>
            <p className="text-sm text-stone-500">{employee.designation || 'No designation'} {employee.department ? `· ${employee.department.name}` : ''}</p>
          </div>
          <div className="ml-auto"><StatusBadge status={employee.status} /></div>
        </div>

        <dl className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Item label="Email">{employee.email}</Item>
          <Item label="Phone">{employee.phone}</Item>
          <Item label="Address">{employee.address}</Item>
          <Item label="Department">{employee.department?.name}</Item>
          <Item label="Designation">{employee.designation}</Item>
          <Item label="Joining date">{formatDate(employee.joiningDate)}</Item>
          <Item label="Role"><span className="capitalize">{employee.role}</span></Item>
          <Item label="Record created">{formatDate(employee.createdAt)}</Item>
          <Item label="Last updated">{formatDate(employee.updatedAt)}</Item>
        </dl>
      </div>

      {confirming && (
        <ConfirmModal
          title="Delete employee?"
          message={`This permanently removes ${employee.fullName} and their account. This can't be undone.`}
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setConfirming(false)}
        />
      )}
    </>
  );
}
