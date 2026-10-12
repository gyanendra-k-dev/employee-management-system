// Client-side checks give instant feedback. The backend validates again - never trust the browser.
export const isEmail = (v) => /^\S+@\S+\.\S+$/.test(v.trim());
export const isPhone = (v) => /^[0-9+\-\s()]{7,15}$/.test(v.trim());

export const passwordError = (v) => {
  if (!v) return 'Password is required';
  if (v.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Za-z]/.test(v)) return 'Password must contain a letter';
  if (!/\d/.test(v)) return 'Password must contain a number';
  return '';
};
