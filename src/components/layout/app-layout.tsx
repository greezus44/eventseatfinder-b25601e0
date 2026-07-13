import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/providers/toast-provider';

export function AppLayout() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast('Signed out successfully', 'success');
      navigate('/login');
    } catch {
      toast('Failed to sign out', 'error');
    }
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar__header">
          <Link to="/" className="sidebar__logo">
            Seatly
          </Link>
        </div>
        <nav className="sidebar__nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
            }
          >
            Dashboard
          </NavLink>
        </nav>
        <div className="sidebar__footer">
          <div className="sidebar__user">
            <div className="sidebar__avatar">
              {(user?.email ?? '?')[0].toUpperCase()}
            </div>
            <span className="sidebar__email">{user?.email}</span>
          </div>
          <button
            className="btn btn--ghost"
            onClick={handleSignOut}
            style={{ width: '100%' }}
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
