import { useEffect, useState, useCallback } from 'react'
import { CalendarDays, MapPin, Check, X as XIcon, PlayCircle, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import { validateProviderProfile } from '../utils/validation'

const TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'rejected', label: 'Rejected' },
]

export default function ProviderDashboard() {
  const { user, profile, refreshProfile } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('pending')
  const [actionError, setActionError] = useState('')
  const [providerProfile, setProviderProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(null)
  const [profileErrors, setProfileErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const loadBookings = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('bookings')
      .select('*, profiles!bookings_customer_id_fkey(full_name)')
      .eq('provider_id', user.id)
      .order('created_at', { ascending: false })
    setBookings(data || [])
    setLoading(false)
  }, [user.id])

  const loadProviderProfile = useCallback(async () => {
    const { data, error } = await supabase.from('provider_profiles').select('*').eq('id', user.id).single()
    if (error) console.error('Error loading provider profile:', error)
    setProviderProfile(data)
    setForm(data)
    setLoading(false)
  }, [user.id])

  useEffect(() => {
    loadBookings()
    loadProviderProfile()
  }, [loadBookings, loadProviderProfile])

  const updateStatus = async (booking, newStatus) => {
    setActionError('')
    const { error } = await supabase.from('bookings').update({ status: newStatus }).eq('id', booking.id)
    if (error) {
      setActionError(error.message)
      return
    }
    loadBookings()
  }

  const saveProfile = async () => {
    const validation = validateProviderProfile({
      serviceCategory: form.service_category,
      location: form.location,
      price: form.price,
    })
    setProfileErrors(validation)
    if (Object.keys(validation).length) return

    setSaving(true)
    const { error } = await supabase
      .from('provider_profiles')
      .update({
        service_category: form.service_category,
        location: form.location,
        experience_years: form.experience_years,
        price: form.price,
        bio: form.bio,
        avatar_url: form.avatar_url,
        is_available: form.is_available,
      })
      .eq('id', user.id)
    setSaving(false)
    if (!error) {
      setEditing(false)
      loadProviderProfile()
      refreshProfile()
    }
  }

  if (loading || !form) return <LoadingSpinner full />

  const filtered = bookings.filter((b) => b.status === tab)

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="card mb-6 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">{profile?.full_name}'s Profile</h1>
            <p className="text-sm text-slate-500">{providerProfile?.service_category} · {providerProfile?.location}</p>
          </div>
          <button onClick={() => setEditing((v) => !v)} className="btn-secondary">
            {editing ? 'Cancel' : 'Edit profile'}
          </button>
        </div>

        {editing && (
          <div className="mt-5 space-y-4 border-t border-slate-100 pt-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Service category</label>
                <input
                  className="input"
                  value={form.service_category}
                  onChange={(e) => setForm({ ...form, service_category: e.target.value })}
                />
                {profileErrors.serviceCategory && (
                  <p className="mt-1 text-xs text-red-600">{profileErrors.serviceCategory}</p>
                )}
              </div>
              <div>
                <label className="label">Location</label>
                <input
                  className="input"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
                {profileErrors.location && <p className="mt-1 text-xs text-red-600">{profileErrors.location}</p>}
              </div>
              <div>
                <label className="label">Experience (years)</label>
                <input
                  type="number"
                  min="0"
                  className="input"
                  value={form.experience_years}
                  onChange={(e) => setForm({ ...form, experience_years: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="label">Price (PKR)</label>
                <input
                  type="number"
                  min="0"
                  className="input"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
                {profileErrors.price && <p className="mt-1 text-xs text-red-600">{profileErrors.price}</p>}
              </div>
            </div>
            <div>
              <label className="label">Bio</label>
              <textarea
                className="input min-h-[80px]"
                value={form.bio || ''}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
              <label className="label mt-4">Profile Picture URL</label>
              <div className="mt-2">
                <input
                  type="text"
                  className="input"
                  placeholder="e.g., https://example.com/avatar.jpg"
                  value={form.avatar_url || ''}
                  onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
                />
                <p className="text-xs text-slate-500 mt-1">Leave blank to keep current emoji</p>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={form.is_available}
                onChange={(e) => setForm({ ...form, is_available: e.target.checked })}
              />
              Available for new bookings
            </label>
            <button onClick={saveProfile} disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        )}
      </div>

      <h2 className="text-lg font-bold text-slate-900">Incoming bookings</h2>

      <div className="mt-3 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
              tab === t.key ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            {t.label} ({bookings.filter((b) => b.status === t.key).length})
          </button>
        ))}
      </div>

      {actionError && <p className="mt-3 text-sm text-red-600">{actionError}</p>}

      {filtered.length === 0 ? (
        <div className="card mt-4 p-10 text-center text-slate-500">No bookings in this category.</div>
      ) : (
        <div className="mt-4 space-y-4">
          {filtered.map((b) => (
            <div key={b.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">
                    {b.profiles?.full_name} — {b.service_category}
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

              <div className="mt-4 flex flex-wrap gap-2">
                {b.status === 'pending' && (
                  <>
                    <button onClick={() => updateStatus(b, 'accepted')} className="btn-primary">
                      <Check size={16} /> Accept
                    </button>
                    <button onClick={() => updateStatus(b, 'rejected')} className="btn-danger">
                      <XIcon size={16} /> Reject
                    </button>
                  </>
                )}
                {b.status === 'accepted' && (
                  <button onClick={() => updateStatus(b, 'in_progress')} className="btn-primary">
                    <PlayCircle size={16} /> Start work
                  </button>
                )}
                {b.status === 'in_progress' && (
                  <button onClick={() => updateStatus(b, 'completed')} className="btn-primary">
                    <CheckCircle2 size={16} /> Mark completed
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
