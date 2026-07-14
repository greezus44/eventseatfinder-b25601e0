import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/providers/auth-provider'

export function AppHeader() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const handleSignOut = async () => { await signOut(); navigate('/login') }
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link to="/" className="app-logo">Seatly</Link>
        <div className="app-header-actions">
          {user && <span className="user-badge">{user.email}</span>}
          {user && <button className="btn btn-ghost btn-sm" onClick={handleSignOut}>Sign Out</button>}
        </div>
      </div>
    </header>
  )
}
