import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { CheckCircle2, AlertCircle, CalendarDays } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { generateBookingCode } from '../utils/bookingId'
import { validateBookingForm } from '../utils/validation'
import LoadingSpinner from '../components/LoadingSpinner'

export default function BookingForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [provider, setProvider] = useState(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ date: '', time: '', location: '', description: '' })
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      const { data } = await supabase
        .from('provider_profiles')
        .select('*, profiles(full_name)')
        .eq('id', id)
        .single()
      if (mounted) {
        setProvider(data)
        setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')
    const validation = validateBookingForm(form)
    setErrors(validation)
    if (Object.keys(validation).length) return

    setSubmitting(true)
    const bookingCode = generateBookingCode()
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        booking_code: bookingCode,
        customer_id: user.id,
        provider_id: id,
        service_category: provider.service_category,
        booking_date: form.date,
        booking_time: form.time,
        location: form.location,
        description: form.description,
        status: 'pending',
      })
      .select()
      .single()
    setSubmitting(false)

    if (error) {
      setSubmitError(error.message)
      return
    }
    setSuccess(data)
  }

  if (loading) return <LoadingSpinner full />
  if (!provider) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-slate-500">
        Provider not found.
      </div>
    )
  }

  if (success) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="card p-8">
          <CheckCircle2 className="mx-auto mb-4 text-emerald-500" size={44} />
          <h1 className="text-xl font-bold text-slate-900">Booking request sent!</h1>
          <p className="mt-2 text-sm text-slate-500">
            {provider.profiles?.full_name} will review your request. Track its status from your dashboard.
          </p>
          <div className="mx-auto mt-5 w-fit rounded-xl bg-brand-50 px-4 py-2 font-mono text-sm font-bold text-brand-700">
            {success.booking_code}
          </div>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/dashboard" className="btn-primary">
              Go to dashboard
            </Link>
            <Link to="/" className="btn-secondary">
              Browse more
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="card p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
            <CalendarDays size={20} />
          </span>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Book {provider.profiles?.full_name}</h1>
            <p className="text-sm text-slate-500">{provider.service_category} · {provider.location}</p>
          </div>
        </div>

        {submitError && (
          <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-600">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                className="input"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
              {errors.date && <p className="mt-1 text-xs text-red-600">{errors.date}</p>}
            </div>
            <div>
              <label className="label">Time</label>
              <input
                type="time"
                className="input"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
              />
              {errors.time && <p className="mt-1 text-xs text-red-600">{errors.time}</p>}
            </div>
          </div>

          <div>
            <label className="label">Service location</label>
            <input
              className="input"
              placeholder="e.g. House 12, Street 4, DHA Phase 6, Karachi"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
            {errors.location && <p className="mt-1 text-xs text-red-600">{errors.location}</p>}
          </div>

          <div>
            <label className="label">Describe what you need</label>
            <textarea
              className="input min-h-[100px]"
              placeholder="Tell the provider what needs to be done…"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Submitting…' : 'Submit booking request'}
          </button>
        </form>
      </div>
    </div>
  )
}
