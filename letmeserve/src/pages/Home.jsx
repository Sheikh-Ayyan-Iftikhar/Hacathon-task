import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import ProviderCard from '../components/ProviderCard'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Home() {
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from('provider_profiles')
        .select('*, profiles(full_name)')
        .order('rating_avg', { ascending: false })
      if (mounted) {
        if (!error) setProviders(data || [])
        setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const categories = useMemo(() => {
    const set = new Set(providers.map((p) => p.service_category).filter(Boolean))
    return ['All', ...Array.from(set)]
  }, [providers])

  const filtered = useMemo(() => {
    return providers.filter((p) => {
      const matchesCategory = category === 'All' || p.service_category === category
      const q = query.trim().toLowerCase()
      const matchesQuery =
        !q ||
        p.profiles?.full_name?.toLowerCase().includes(q) ||
        p.service_category?.toLowerCase().includes(q) ||
        p.location?.toLowerCase().includes(q)
      return matchesCategory && matchesQuery
    })
  }, [providers, query, category])

  return (
    <div>
      <section className="border-b border-slate-200 bg-gradient-to-b from-brand-50 to-transparent">
        <div className="mx-auto max-w-6xl px-4 py-14 text-center sm:px-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            LetMeServe
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-500">
            Let Find. Book. Get It Done. — connect with trusted local service providers in minutes.
          </p>

          <div className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                className="input pl-10"
                placeholder="Search by name, service, or location…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <select
              className="input sm:w-56"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            {loading ? 'Loading providers…' : `${filtered.length} service provider${filtered.length !== 1 ? 's' : ''}`}
          </h2>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <div className="card p-10 text-center text-slate-500">
            No providers match your search yet. Try a different keyword or category.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <ProviderCard key={p.id} provider={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
