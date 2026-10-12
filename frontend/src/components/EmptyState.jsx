export default function EmptyState({ title, message, action }) {
  return (
    <div className="flex flex-col items-center px-4 py-14 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-xl text-stone-400">
        ∅
      </div>
      <h3 className="font-semibold text-stone-800">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-stone-500">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
