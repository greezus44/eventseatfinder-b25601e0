import { useAuth } from '@/providers/auth-provider'
import { supabase } from '@/lib/supabase'

export default function AppHeader() {
  const { session } = useAuth()

  const handleSignOut = () => {
    supabase.auth.signOut()
  }

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div className="app-logo">Seatly</div>
        {session && (
          <div className="app-header-actions">
            <span className="user-badge">{session.user.email}</span>
            <button className="btn btn-ghost btn-sm" onClick={handleSignOut}>Sign out</button>
          </div>
        )}
      </div>
    </header>
  )
}
