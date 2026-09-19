import { Link } from 'react-router-dom'
import { MapPin, Star, Briefcase } from 'lucide-react'

export default function ProviderCard({ provider }) {
  return (
    <Link
      to={`/provider/${provider.id}`}
      className="card group flex flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-2xl">
              {provider.avatar_url ? (
                <img
                  src={provider.avatar_url}
                  alt={`${provider.full_name} profile`}
                  className="rounded-full w-full h-full object-cover"
                />
              ) : (
                provider.avatar_emoji || '🧰'
              )}
            </span>
          <div>
            <p className="font-semibold text-slate-900 group-hover:text-brand-700">
              {provider.profiles?.full_name}
            </p>
            <p className="text-sm text-slate-500">{provider.service_category}</p>
          </div>
        </div>
        {!provider.is_available && (
          <span className="badge bg-slate-100 text-slate-500">Unavailable</span>
        )}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
        <span className="flex items-center gap-1">
          <MapPin size={14} /> {provider.location}
        </span>
        <span className="flex items-center gap-1">
          <Briefcase size={14} /> {provider.experience_years} yrs exp.
        </span>
      </div>

      <div className="mt-1 flex items-center justify-between">
        <span className="flex items-center gap-1 text-sm font-medium text-amber-600">
          <Star size={15} className="fill-amber-400 text-amber-400" />
          {provider.rating_avg > 0 ? provider.rating_avg.toFixed(1) : 'New'}
          {provider.rating_count > 0 && (
            <span className="text-slate-400">({provider.rating_count})</span>
          )}
        </span>
        <span className="font-bold text-brand-700">PKR {Number(provider.price).toLocaleString()}</span>
      </div>
    </Link>
  )
}
