import { Loader2 } from 'lucide-react'

export default function LoadingSpinner({ full }) {
  return (
    <div className={full ? 'flex min-h-[60vh] items-center justify-center' : 'flex items-center justify-center py-8'}>
      <Loader2 className="animate-spin text-brand-600" size={28} />
    </div>
  )
}
