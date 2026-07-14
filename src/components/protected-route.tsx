import { Navigate } from 'react-router-dom'
import { useAuthContext } from '@/providers/auth-provider'
import type { ReactNode } from 'react'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuthContext()
  if (loading) return <div className="spinner-container"><div className="spinner spinner-lg" /></div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}
