import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import FormField from '../components/FormField';
import ErrorMessage from '../components/ErrorMessage';
import { getErrorMessage, homePathFor } from '../utils/helpers';
import { isEmail, isPhone, passwordError } from '../utils/validators';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    const next = {};
    if (form.fullName.trim().length < 2) next.fullName = 'Enter your full name';
    if (!isEmail(form.email)) next.email = 'Enter a valid email address';
    if (!isPhone(form.phone)) next.phone = 'Enter a valid phone number (7-15 digits)';
    const pwError = passwordError(form.password);
    if (pwError) next.password = pwError;
    if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      const { fullName, email, phone, password } = form; // note: no role is sent
      const user = await signup({ fullName: fullName.trim(), email: email.trim(), phone: phone.trim(), password });
      toast.success('Account created');
      navigate(homePathFor(user.role), { replace: true });
    } catch (error) {
      setServerError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-stone-900">Create your employee account</h1>
          <p className="mt-1 text-sm text-stone-500">An administrator will assign your department and designation.</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4 p-6" noValidate>
          <ErrorMessage message={serverError} />
          <FormField label="Full name" name="fullName" value={form.fullName} onChange={handleChange} error={errors.fullName} autoComplete="name" />
          <FormField label="Email" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} autoComplete="email" />
          <FormField label="Phone number" name="phone" type="tel" value={form.phone} onChange={handleChange} error={errors.phone} autoComplete="tel" />
          <FormField label="Password" name="password" type="password" value={form.password} onChange={handleChange} error={errors.password} hint="At least 8 characters, with a letter and a number." autoComplete="new-password" />
          <FormField label="Confirm password" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} error={errors.confirmPassword} autoComplete="new-password" />
          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-stone-600">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-teal-700 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
