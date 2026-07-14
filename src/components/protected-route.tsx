import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/providers/auth-provider'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()

  if (loading) {
    return <div className="spinner-container"><div className="spinner spinner-lg" /></div>
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
