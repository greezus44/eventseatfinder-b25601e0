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
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold text-teal-700">Seatly</span>
      </div>
      <nav className="flex items-center gap-4">
        <Link to="/dashboard" className="text-sm font-medium text-slate-700 hover:text-teal-700">
          Dashboard
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="text-sm font-medium text-slate-700 hover:text-red-600"
        >
          Sign Out
        </button>
      </nav>
    </header>
  )
}
