import { Link, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/providers/auth-provider';

export function AppLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="app-header__inner">
          <Link to="/" className="app-header__logo">
            <span className="app-header__logo-mark">S</span>
            <span className="app-header__logo-text">Seatly</span>
          </Link>
          <div className="app-header__actions">
            {user && (
              <div className="app-header__user">
                <span className="app-header__user-email">{user.email}</span>
                <button className="btn btn--ghost btn--sm" onClick={handleSignOut}>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="app-main"><Outlet /></main>
    </div>
  );
}
