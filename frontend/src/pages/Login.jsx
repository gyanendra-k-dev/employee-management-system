import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import FormField from '../components/FormField';
import ErrorMessage from '../components/ErrorMessage';
import { getErrorMessage, homePathFor } from '../utils/helpers';
import { isEmail } from '../utils/validators';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    const next = {};
    if (!isEmail(form.email)) next.email = 'Enter a valid email address';
    if (!form.password) next.password = 'Password is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      const user = await login(form.email.trim(), form.password);
      toast.success(`Welcome back, ${user.fullName.split(' ')[0]}!`);
      const from = location.state?.from?.pathname;
      navigate(from && from !== '/login' ? from : homePathFor(user.role), { replace: true });
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
          <h1 className="text-2xl font-bold text-stone-900">Log in to Employee Manager</h1>
          <p className="mt-1 text-sm text-stone-500">Use the email and password for your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4 p-6" noValidate>
          <ErrorMessage message={serverError} />
          <FormField label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={handleChange} error={errors.email} placeholder="you@company.com" />
          <FormField label="Password" name="password" type="password" autoComplete="current-password" value={form.password} onChange={handleChange} error={errors.password} />
          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-stone-600">
          New here?{' '}
          <Link to="/signup" className="font-semibold text-teal-700 hover:underline">
            Create an employee account
          </Link>
        </p>
      </div>
    </div>
  );
}
