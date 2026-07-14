import { CSSProperties } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/auth-provider';

export function AppLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const layoutStyle: CSSProperties = {
    minHeight: '100vh',
    background: '#F8F8F8',
    fontFamily: 'Inter, system-ui, sans-serif',
  };

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    background: '#FFFFFF',
    borderBottom: '1px solid #EFEFEF',
  };

  const logoStyle: CSSProperties = {
    fontSize: 22,
    fontWeight: 700,
    color: '#1A1A1A',
    letterSpacing: '-0.02em',
    margin: 0,
    cursor: 'pointer',
  };

  const userInfoStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  };

  const emailStyle: CSSProperties = {
    fontSize: 14,
    color: '#4A4A4A',
  };

  const signOutButtonStyle: CSSProperties = {
    padding: '8px 16px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    border: '1px solid #1A1A1A',
    background: '#FFFFFF',
    color: '#1A1A1A',
    fontFamily: 'inherit',
  };

  const mainStyle: CSSProperties = {
    padding: '32px 24px',
    maxWidth: 1200,
    margin: '0 auto',
  };

  return (
    <div style={layoutStyle}>
      <header style={headerStyle}>
        <h1 style={logoStyle} onClick={() => navigate('/')}>
          Seatly
        </h1>
        <div style={userInfoStyle}>
          {user?.email && <span style={emailStyle}>{user.email}</span>}
          <button style={signOutButtonStyle} onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </header>
      <main style={mainStyle}>
        <Outlet />
      </main>
    </div>
  );
}
