import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { MapPin, Briefcase, Star, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import StarRating from '../components/StarRating'
import LoadingSpinner from '../components/LoadingSpinner'

export default function ProviderDetails() {
  const { id } = useParams()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [provider, setProvider] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      const [{ data: providerData }, { data: reviewData }] = await Promise.all([
        supabase
          .from('provider_profiles')
          .select('*, profiles(full_name)')
          .eq('id', id)
          .single(),
        supabase
          .from('reviews')
          .select('*, profiles!reviews_customer_id_fkey(full_name)')
          .eq('provider_id', id)
          .order('created_at', { ascending: false }),
      ])
      if (mounted) {
        setProvider(providerData)
        setReviews(reviewData || [])
        setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [id])

  const handleBookClick = () => {
    if (!user) {
      navigate('/login', { state: { from: `/provider/${id}/book` } })
      return
    }
    if (profile?.role !== 'customer') return
    navigate(`/provider/${id}/book`)
  }

  if (loading) return <LoadingSpinner full />
  if (!provider) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-slate-500">
        Provider not found.{' '}
        <Link to="/" className="text-brand-700 font-semibold">
          Back to browse
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="card p-6 sm:p-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-3xl">
              {provider.avatar_url ? (
                <img
                  src={provider.avatar_url}
                  alt={`${provider.profiles?.full_name} profile`}
                  className="rounded-full w-full h-full object-cover"
                />
              ) : (
                provider.avatar_emoji || '🧰'
              )}
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{provider.profiles?.full_name}</h1>
              <p className="text-slate-500">{provider.service_category}</p>
              <div className="mt-1 flex items-center gap-1 text-sm font-medium text-amber-600">
                <Star size={15} className="fill-amber-400 text-amber-400" />
                {provider.rating_avg > 0 ? provider.rating_avg.toFixed(1) : 'New provider'}
                {provider.rating_count > 0 && (
                  <span className="text-slate-400">({provider.rating_count} reviews)</span>
                )}
              </div>
            </div>
          </div>
          <div className="w-full text-right sm:w-auto">
            <p className="text-2xl font-extrabold text-brand-700">
              PKR {Number(provider.price).toLocaleString()}
            </p>
            <button
              onClick={handleBookClick}
              disabled={!provider.is_available || profile?.role === 'provider'}
              className="btn-primary mt-2 w-full sm:w-auto"
            >
              {provider.is_available ? 'Book this provider' : 'Currently unavailable'}
            </button>
            {profile?.role === 'provider' && (
              <p className="mt-1 text-xs text-slate-400">Only customer accounts can book.</p>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-6 sm:grid-cols-3">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <MapPin size={16} className="text-brand-600" /> {provider.location}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Briefcase size={16} className="text-brand-600" /> {provider.experience_years} years experience
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <CheckCircle2 size={16} className="text-brand-600" />
            {provider.is_available ? 'Available now' : 'Unavailable'}
          </div>
        </div>

        {provider.bio && (
          <p className="mt-6 border-t border-slate-100 pt-6 text-sm leading-relaxed text-slate-600">
            {provider.bio}
          </p>
        )}
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-lg font-bold text-slate-900">
          Reviews {reviews.length > 0 && `(${reviews.length})`}
        </h2>
        {reviews.length === 0 ? (
          <div className="card p-6 text-center text-sm text-slate-500">
            No reviews yet — be the first to book and review.
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-800">{r.profiles?.full_name || 'Customer'}</p>
                  <StarRating value={r.rating} readOnly size={15} />
                </div>
                {r.comment && <p className="mt-1.5 text-sm text-slate-600">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
