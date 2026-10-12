export default function Spinner({ label = 'Loading...', fullPage = false }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 text-stone-500 ${fullPage ? 'min-h-screen' : 'py-16'}`}
      role="status"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-teal-700" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
