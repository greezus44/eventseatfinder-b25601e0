import { Link, useNavigate } from 'react-router-dom'
import { useAuthContext } from '@/providers/auth-provider'

export function AppHeader() {
  const { signOut } = useAuthContext()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-xl font-bold text-slate-900">Seatly</span>
            </Link>
            <nav className="flex items-center gap-4">
              <Link
                to="/dashboard"
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Dashboard
              </Link>
            </nav>
          </div>
          <button
            onClick={handleSignOut}
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  )
}
