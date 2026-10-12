import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import ErrorMessage from '../../components/ErrorMessage';
import ConfirmModal from '../../components/ConfirmModal';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import { getErrorMessage } from '../../utils/helpers';

// Modal used for both creating and editing a department and its designations.
function DepartmentModal({ department, onClose, onSaved }) {
  const isEdit = Boolean(department);
  const [name, setName] = useState(department?.name || '');
  const [designations, setDesignations] = useState(department?.designations || []);
  const [newDesignation, setNewDesignation] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const addDesignation = () => {
    const value = newDesignation.trim();
    if (!value) return;
    if (designations.some((d) => d.toLowerCase() === value.toLowerCase())) {
      setError('That designation already exists');
      return;
    }
    setError('');
    setDesignations([...designations, value]);
    setNewDesignation('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (name.trim().length < 2) return setError('Department name must be at least 2 characters');

    setSaving(true);
    try {
      const payload = { name: name.trim(), designations };
      if (isEdit) await api.put(`/departments/${department._id}`, payload);
      else await api.post('/departments', payload);
      toast.success(isEdit ? 'Department updated' : 'Department created');
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <Modal title={isEdit ? 'Edit department' : 'Add department'} onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <ErrorMessage message={error} />
        <FormField label="Department name" name="deptName" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Engineering" />

        <div>
          <label className="label" htmlFor="newDesignation">Designations</label>
          <div className="flex gap-2">
            <input
              id="newDesignation"
              className="input"
              value={newDesignation}
              onChange={(e) => setNewDesignation(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addDesignation();
                }
              }}
              placeholder="e.g. Frontend Developer"
            />
            <button type="button" className="btn-secondary" onClick={addDesignation}>Add</button>
          </div>

          {designations.length === 0 ? (
            <p className="mt-2 text-xs text-stone-500">No designations yet. Add the job titles used in this department.</p>
          ) : (
            <ul className="mt-3 flex flex-wrap gap-2">
              {designations.map((d) => (
                <li key={d} className="flex items-center gap-1 rounded-full bg-teal-50 py-1 pl-3 pr-1 text-sm text-teal-800">
                  {d}
                  <button type="button" onClick={() => setDesignations(designations.filter((x) => x !== d))} className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-teal-100" aria-label={`Remove ${d}`}>
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save department'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // null | 'new' | department object
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/departments');
      setDepartments(data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/departments/${toDelete._id}`);
      toast.success('Department deleted');
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err)); // e.g. "Cannot delete: 3 employee(s) still belong to this department"
      setToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader title="Departments" subtitle="Manage departments and the designations inside each one.">
        <button className="btn-primary" onClick={() => setModal('new')}>Add department</button>
      </PageHeader>

      <ErrorMessage message={error} onRetry={load} />

      {loading ? (
        <Spinner label="Loading departments..." />
      ) : departments.length === 0 ? (
        <div className="card">
          <EmptyState title="No departments yet" message="Create departments like Engineering or HR, then assign employees to them." action={<button className="btn-primary" onClick={() => setModal('new')}>Add department</button>} />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {departments.map((d) => (
            <div key={d._id} className="card flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-stone-900">{d.name}</h3>
                  <p className="text-sm text-stone-500">{d.employeeCount} employee(s)</p>
                </div>
              </div>
              <div className="mt-3 flex-1">
                {d.designations.length === 0 ? (
                  <p className="text-sm text-stone-400">No designations</p>
                ) : (
                  <ul className="flex flex-wrap gap-1.5">
                    {d.designations.map((x) => <li key={x} className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-700">{x}</li>)}
                  </ul>
                )}
              </div>
              <div className="mt-4 flex gap-3 border-t border-stone-100 pt-3 text-sm">
                <button className="font-medium text-stone-600 hover:text-teal-700" onClick={() => setModal(d)}>Edit</button>
                <button className="font-medium text-red-600 hover:text-red-700" onClick={() => setToDelete(d)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <DepartmentModal
          department={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            load();
          }}
        />
      )}

      {toDelete && (
        <ConfirmModal
          title="Delete department?"
          message={`Delete "${toDelete.name}"? Departments that still have employees can't be deleted.`}
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </>
  );
}
