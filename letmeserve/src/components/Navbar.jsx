import { Link, useNavigate } from 'react-router-dom'
import { Wrench, LogOut, LayoutDashboard, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, profile, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-extrabold text-brand-700">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Wrench size={18} />
          </span>
          <span className="text-lg">LetMeServe</span>
        </Link>

        <nav className="hidden items-center gap-6 sm:flex">
          <Link to="/" className="text-sm font-medium text-slate-600 hover:text-brand-700">
            Browse
          </Link>
          {user && profile && (
            <Link
              to={profile.role === 'provider' ? '/provider/dashboard' : '/dashboard'}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-brand-700"
            >
              <LayoutDashboard size={16} />
              Dashboard
            </Link>
          )}
          {user ? (
            <button onClick={handleLogout} className="btn-ghost">
              <LogOut size={16} />
              Log out
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-secondary">
                Log in
              </Link>
              <Link to="/register" className="btn-primary">
                Sign up
              </Link>
            </div>
          )}
        </nav>

        <button className="sm:hidden" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:hidden">
          <Link to="/" onClick={() => setOpen(false)} className="text-sm font-medium text-slate-700">
            Browse
          </Link>
          {user && profile && (
            <Link
              to={profile.role === 'provider' ? '/provider/dashboard' : '/dashboard'}
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-slate-700"
            >
              Dashboard
            </Link>
          )}
          {user ? (
            <button
              onClick={() => {
                setOpen(false)
                handleLogout()
              }}
              className="btn-ghost justify-start"
            >
              <LogOut size={16} /> Log out
            </button>
          ) : (
            <div className="flex gap-2">
              <Link to="/login" onClick={() => setOpen(false)} className="btn-secondary flex-1">
                Log in
              </Link>
              <Link to="/register" onClick={() => setOpen(false)} className="btn-primary flex-1">
                Sign up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
