import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/auth-provider';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const initials = user?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar__header">
          <a href="/" className="sidebar__logo">
            Seatly
          </a>
        </div>
        <nav className="sidebar__nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
            }
          >
            Dashboard
          </NavLink>
        </nav>
        <div className="sidebar__footer">
          <div className="sidebar__user">
            <div className="sidebar__avatar">{initials}</div>
            <span className="sidebar__email">{user?.email}</span>
          </div>
          <button className="btn btn--ghost btn--sm" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="app-main">{children}</main>
    </div>
  );
}
