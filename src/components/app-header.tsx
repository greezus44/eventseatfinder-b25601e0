import { Link, useNavigate } from 'react-router-dom'
import { useAuthContext } from '@/providers/auth-provider'

export function AppHeader() {
  const { session, signOut } = useAuthContext()
  const navigate = useNavigate()
  return (
    <header className="app-header">
      <Link to="/dashboard" className="app-header-logo">Seatly</Link>
      {session && (
        <nav className="app-header-nav">
          <Link to="/dashboard">Dashboard</Link>
        </nav>
      )}
      <div className="app-header-spacer" />
      {session && (
        <div className="app-header-actions">
          <button className="btn btn-ghost btn-sm" onClick={async () => { await signOut(); navigate('/login') }}>Sign Out</button>
        </div>
      )}
    </header>
  )
}
