import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import FormField from '../../components/FormField';
import Spinner from '../../components/Spinner';
import ErrorMessage from '../../components/ErrorMessage';
import { STATUS_OPTIONS, getErrorMessage, toDateInput } from '../../utils/helpers';
import { isEmail, isPhone, passwordError } from '../../utils/validators';

const emptyForm = {
  fullName: '',
  email: '',
  phone: '',
  address: '',
  department: '',
  designation: '',
  joiningDate: new Date().toISOString().slice(0, 10),
  status: 'active',
  role: 'employee',
  password: '',
};

// One form for BOTH "Add employee" (/new) and "Edit employee" (/:id/edit).
export default function EmployeeFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user: me } = useAuth();

  const [form, setForm] = useState(emptyForm);
  const [departments, setDepartments] = useState([]);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let ignore = false;
    const requests = [api.get('/departments')];
    if (isEdit) requests.push(api.get(`/employees/${id}`));

    Promise.all(requests)
      .then(([deptRes, empRes]) => {
        if (ignore) return;
        setDepartments(deptRes.data.data);
        if (empRes) {
          const e = empRes.data.data;
          setForm({
            fullName: e.fullName,
            email: e.email,
            phone: e.phone,
            address: e.address || '',
            department: e.department?._id || '',
            designation: e.designation || '',
            joiningDate: toDateInput(e.joiningDate),
            status: e.status,
            role: e.role,
            password: '',
          });
        }
      })
      .catch((err) => !ignore && setServerError(getErrorMessage(err)))
      .finally(() => !ignore && setLoading(false));

    return () => {
      ignore = true;
    };
  }, [id, isEdit]);

  const editingSelf = isEdit && id === me._id;
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Designations come from the selected department. Keep the current value visible when editing.
  const selectedDept = departments.find((d) => d._id === form.department);
  const designationOptions = selectedDept ? [...selectedDept.designations] : [];
  if (form.designation && selectedDept && !designationOptions.includes(form.designation)) {
    designationOptions.push(form.designation);
  }

  const validate = () => {
    const next = {};
    if (form.fullName.trim().length < 2) next.fullName = 'Enter the full name';
    if (!isEmail(form.email)) next.email = 'Enter a valid email address';
    if (!isPhone(form.phone)) next.phone = 'Enter a valid phone number (7-15 digits)';
    if (!form.joiningDate) next.joiningDate = 'Choose a joining date';
    if (!isEdit || form.password) {
      const pwError = passwordError(form.password);
      if (pwError) next.password = pwError;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    const payload = {
      ...form,
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
    };
    if (isEdit && !payload.password) delete payload.password; // blank = keep the old password

    setSubmitting(true);
    try {
      if (isEdit) {
        await api.put(`/employees/${id}`, payload);
        toast.success('Employee updated');
      } else {
        await api.post('/employees', payload);
        toast.success('Employee created');
      }
      navigate('/admin/employees');
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <>
      <PageHeader title={isEdit ? 'Edit employee' : 'Add employee'} subtitle={isEdit ? 'Update this employee\'s details.' : 'Create an account and employment record.'} />

      <form onSubmit={handleSubmit} className="card max-w-3xl space-y-5 p-6" noValidate>
        <ErrorMessage message={serverError} />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Full name" name="fullName" value={form.fullName} onChange={handleChange} error={errors.fullName} />
          <FormField label="Email" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} />
          <FormField label="Phone number" name="phone" type="tel" value={form.phone} onChange={handleChange} error={errors.phone} />
          <FormField label="Joining date" name="joiningDate" type="date" value={form.joiningDate} onChange={handleChange} error={errors.joiningDate} />

          <FormField label="Department" name="department">
            <select id="department" name="department" className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value, designation: '' })}>
              <option value="">Not assigned</option>
              {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </FormField>

          <FormField label="Designation" name="designation" hint={selectedDept && designationOptions.length === 0 ? 'No designations defined for this department yet. Type one or add them under Departments.' : undefined}>
            {designationOptions.length > 0 ? (
              <select id="designation" name="designation" className="input" value={form.designation} onChange={handleChange}>
                <option value="">Not assigned</option>
                {designationOptions.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            ) : (
              <input id="designation" name="designation" className="input" value={form.designation} onChange={handleChange} placeholder="e.g. Software Engineer" />
            )}
          </FormField>

          <FormField label="Employment status" name="status" hint={editingSelf ? 'You cannot change your own status.' : undefined}>
            <select id="status" name="status" className="input" value={form.status} onChange={handleChange} disabled={editingSelf}>
              {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </FormField>

          <FormField label="Role" name="role" hint={editingSelf ? 'You cannot change your own role.' : 'Admins can manage all employees.'}>
            <select id="role" name="role" className="input" value={form.role} onChange={handleChange} disabled={editingSelf}>
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </FormField>
        </div>

        <FormField label="Address" name="address">
          <textarea id="address" name="address" rows={2} className="input" value={form.address} onChange={handleChange} />
        </FormField>

        <FormField
          label={isEdit ? 'Reset password (optional)' : 'Temporary password'}
          name="password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          hint={isEdit ? 'Leave blank to keep the current password.' : 'Share it with the employee; they can change it from their profile.'}
        />

        <div className="flex justify-end gap-2 border-t border-stone-100 pt-4">
          <button type="button" className="btn-secondary" onClick={() => navigate('/admin/employees')}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Saving...' : isEdit ? 'Save changes' : 'Create employee'}
          </button>
        </div>
      </form>
    </>
  );
}
