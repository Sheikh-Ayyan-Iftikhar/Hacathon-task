const STYLES = {
  pending: 'bg-amber-50 text-amber-700',
  accepted: 'bg-blue-50 text-blue-700',
  rejected: 'bg-red-50 text-red-700',
  in_progress: 'bg-purple-50 text-purple-700',
  completed: 'bg-emerald-50 text-emerald-700',
}

const LABELS = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
  in_progress: 'In Progress',
  completed: 'Completed',
}

export default function StatusBadge({ status }) {
  return (
    <span className={`badge ${STYLES[status] || 'bg-slate-100 text-slate-600'}`}>
      {LABELS[status] || status}
    </span>
  )
}
