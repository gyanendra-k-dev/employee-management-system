import { statusLabel } from '../utils/helpers';

const styles = {
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  on_leave: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  inactive: 'bg-stone-100 text-stone-600 ring-stone-500/20',
  terminated: 'bg-red-50 text-red-700 ring-red-600/20',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[status] || styles.inactive}`}>
      {statusLabel(status)}
    </span>
  );
}
