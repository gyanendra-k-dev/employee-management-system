// Label + input + error message in one reusable piece.
export default function FormField({ label, name, error, hint, children, ...inputProps }) {
  return (
    <div>
      <label htmlFor={name} className="label">
        {label}
      </label>
      {children || <input id={name} name={name} className={`input ${error ? 'border-red-400' : ''}`} {...inputProps} />}
      {hint && !error && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
