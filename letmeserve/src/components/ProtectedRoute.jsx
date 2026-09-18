import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from './LoadingSpinner'

export default function ProtectedRoute({ children, requireRole }) {
  const { user, profile, loading } = useAuth()

  if (loading) return <LoadingSpinner full />
  if (!user) return <Navigate to="/login" replace />
  if (requireRole && profile?.role !== requireRole) {
    return <Navigate to={profile?.role === 'provider' ? '/provider/dashboard' : '/dashboard'} replace />
  }
  return children
}
