export const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  (error?.request ? 'Cannot reach the server. Check your connection.' : 'Something went wrong. Please try again.');

export const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '-';

// For <input type="date"> which needs YYYY-MM-DD
export const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');

export const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'on_leave', label: 'On leave' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'terminated', label: 'Terminated' },
];

export const statusLabel = (value) => STATUS_OPTIONS.find((s) => s.value === value)?.label || value;

export const homePathFor = (role) => (role === 'admin' ? '/admin' : '/employee');

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');
