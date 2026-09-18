import { useEffect, useState, useCallback } from 'react'
import { CalendarDays, MapPin, Star, X } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'
import StarRating from '../components/StarRating'
import LoadingSpinner from '../components/LoadingSpinner'

export default function CustomerDashboard() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [reviewTarget, setReviewTarget] = useState(null)
  const [reviewValue, setReviewValue] = useState(0)
  const [comment, setComment] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadBookings = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('bookings')
      .select('*, provider_profiles(*, profiles(full_name)), reviews(id)')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
    setBookings(data || [])
    setLoading(false)
  }, [user.id])

  useEffect(() => {
    loadBookings()
  }, [loadBookings])

  const openReview = (booking) => {
    setReviewTarget(booking)
    setReviewValue(0)
    setComment('')
    setReviewError('')
  }

  const submitReview = async () => {
    if (reviewValue < 1) {
      setReviewError('Please select a star rating.')
      return
    }
    setSubmitting(true)
    setReviewError('')
    const { error } = await supabase.from('reviews').insert({
      booking_id: reviewTarget.id,
      customer_id: user.id,
      provider_id: reviewTarget.provider_id,
      rating: reviewValue,
      comment,
    })
    setSubmitting(false)
    if (error) {
      setReviewError(error.message)
      return
    }
    setReviewTarget(null)
    loadBookings()
  }

  if (loading) return <LoadingSpinner full />

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-xl font-bold text-slate-900">My bookings</h1>
      <p className="mt-1 text-sm text-slate-500">Track the status of every service you've requested.</p>

      {bookings.length === 0 ? (
        <div className="card mt-6 p-10 text-center text-slate-500">
          No bookings yet. Browse providers and request your first service.
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {bookings.map((b) => {
            const alreadyReviewed = b.reviews && b.reviews.length > 0
            return (
              <div key={b.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {b.provider_profiles?.profiles?.full_name} — {b.service_category}
                    </p>
                    <p className="mt-1 font-mono text-xs text-slate-400">{b.booking_code}</p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>

                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <CalendarDays size={14} /> {b.booking_date} at {b.booking_time}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={14} /> {b.location}
                  </span>
                </div>

                {b.description && <p className="mt-2 text-sm text-slate-600">{b.description}</p>}

                {b.status === 'completed' && !alreadyReviewed && (
                  <button onClick={() => openReview(b)} className="btn-secondary mt-4">
                    <Star size={16} /> Leave a review
                  </button>
                )}
                {alreadyReviewed && (
                  <p className="mt-4 text-xs font-medium text-emerald-600">✓ You reviewed this booking</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {reviewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Rate your experience</h2>
              <button onClick={() => setReviewTarget(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <div className="flex justify-center">
              <StarRating value={reviewValue} onChange={setReviewValue} size={28} />
            </div>
            <textarea
              className="input mt-4 min-h-[80px]"
              placeholder="Optional comment…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            {reviewError && <p className="mt-2 text-xs text-red-600">{reviewError}</p>}
            <button onClick={submitReview} disabled={submitting} className="btn-primary mt-4 w-full">
              {submitting ? 'Submitting…' : 'Submit review'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
