import { useAuthContext } from '@/providers/auth-provider'
export function AppHeader() {
  const { user, signOut } = useAuthContext()
  return <header className="app-header"><div className="app-logo">Seatly</div><nav className="app-nav"><a href="/dashboard">Dashboard</a>{user && <button className="btn btn-ghost btn-sm" onClick={() => signOut()}>Sign Out</button>}</nav></header>
}
