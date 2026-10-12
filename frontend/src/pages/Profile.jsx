import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import FormField from '../components/FormField';
import ErrorMessage from '../components/ErrorMessage';
import StatusBadge from '../components/StatusBadge';
import { formatDate, getErrorMessage } from '../utils/helpers';
import { isPhone, passwordError } from '../utils/validators';

function DetailRow({ label, children }) {
  return (
    <div className="flex justify-between gap-4 border-b border-stone-100 py-3 text-sm last:border-0">
      <dt className="text-stone-500">{label}</dt>
      <dd className="text-right font-medium text-stone-900">{children}</dd>
    </div>
  );
}

// Shared by Admins and Employees: both can edit ONLY their own personal info here.
export default function Profile() {
  const { user, setUser } = useAuth();

  // ---- Personal info ----
  const [info, setInfo] = useState({ fullName: user.fullName, phone: user.phone, address: user.address || '' });
  const [infoErrors, setInfoErrors] = useState({});
  const [infoServerError, setInfoServerError] = useState('');
  const [savingInfo, setSavingInfo] = useState(false);

  const saveInfo = async (e) => {
    e.preventDefault();
    setInfoServerError('');
    const next = {};
    if (info.fullName.trim().length < 2) next.fullName = 'Enter your full name';
    if (!isPhone(info.phone)) next.phone = 'Enter a valid phone number (7-15 digits)';
    if (info.address.length > 200) next.address = 'Address must be at most 200 characters';
    setInfoErrors(next);
    if (Object.keys(next).length) return;

    setSavingInfo(true);
    try {
      const { data } = await api.put('/auth/me', info);
      setUser(data.user);
      toast.success('Profile updated');
    } catch (error) {
      setInfoServerError(getErrorMessage(error));
    } finally {
      setSavingInfo(false);
    }
  };

  // ---- Change password ----
  const emptyPw = { currentPassword: '', newPassword: '', confirmPassword: '' };
  const [pw, setPw] = useState(emptyPw);
  const [pwErrors, setPwErrors] = useState({});
  const [pwServerError, setPwServerError] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  const savePassword = async (e) => {
    e.preventDefault();
    setPwServerError('');
    const next = {};
    if (!pw.currentPassword) next.currentPassword = 'Enter your current password';
    const err = passwordError(pw.newPassword);
    if (err) next.newPassword = err;
    if (pw.confirmPassword !== pw.newPassword) next.confirmPassword = 'Passwords do not match';
    setPwErrors(next);
    if (Object.keys(next).length) return;

    setSavingPw(true);
    try {
      const { data } = await api.put('/auth/change-password', {
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
      });
      localStorage.setItem('token', data.token); // other devices are logged out; this one gets a fresh token
      setPw(emptyPw);
      toast.success('Password changed');
    } catch (error) {
      setPwServerError(getErrorMessage(error));
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <>
      <PageHeader title="My profile" subtitle="Update your personal details and keep your account secure." />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="mb-4 font-semibold text-stone-900">Personal information</h2>
          <form onSubmit={saveInfo} className="space-y-4" noValidate>
            <ErrorMessage message={infoServerError} />
            <FormField label="Full name" name="fullName" value={info.fullName} onChange={(e) => setInfo({ ...info, fullName: e.target.value })} error={infoErrors.fullName} />
            <FormField label="Email" name="email" value={user.email} disabled hint="Email can only be changed by an administrator." />
            <FormField label="Phone number" name="phone" value={info.phone} onChange={(e) => setInfo({ ...info, phone: e.target.value })} error={infoErrors.phone} />
            <FormField label="Address" name="address" error={infoErrors.address}>
              <textarea id="address" rows={3} className="input" value={info.address} onChange={(e) => setInfo({ ...info, address: e.target.value })} />
            </FormField>
            <button className="btn-primary" disabled={savingInfo}>
              {savingInfo ? 'Saving...' : 'Save changes'}
            </button>
          </form>
        </section>

        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="mb-2 font-semibold text-stone-900">Employment details</h2>
            <dl>
              <DetailRow label="Role"><span className="capitalize">{user.role}</span></DetailRow>
              <DetailRow label="Department">{user.department?.name || 'Not assigned yet'}</DetailRow>
              <DetailRow label="Designation">{user.designation || 'Not assigned yet'}</DetailRow>
              <DetailRow label="Joining date">{formatDate(user.joiningDate)}</DetailRow>
              <DetailRow label="Status"><StatusBadge status={user.status} /></DetailRow>
            </dl>
            <p className="mt-3 text-xs text-stone-500">These details are managed by your administrator.</p>
          </section>

          <section className="card p-6">
            <h2 className="mb-4 font-semibold text-stone-900">Change password</h2>
            <form onSubmit={savePassword} className="space-y-4" noValidate>
              <ErrorMessage message={pwServerError} />
              <FormField label="Current password" name="currentPassword" type="password" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} error={pwErrors.currentPassword} />
              <FormField label="New password" name="newPassword" type="password" autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} error={pwErrors.newPassword} hint="At least 8 characters, with a letter and a number." />
              <FormField label="Confirm new password" name="confirmPassword" type="password" autoComplete="new-password" value={pw.confirmPassword} onChange={(e) => setPw({ ...pw, confirmPassword: e.target.value })} error={pwErrors.confirmPassword} />
              <button className="btn-primary" disabled={savingPw}>
                {savingPw ? 'Updating...' : 'Update password'}
              </button>
            </form>
          </section>
        </div>
      </div>
    </>
  );
}
