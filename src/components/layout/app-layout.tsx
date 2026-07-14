import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/auth-provider';

export function AppLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8F8F8', fontFamily: 'Inter, sans-serif' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 32px',
          background: '#FFFFFF',
          borderBottom: '1px solid #EFEFEF',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: '#1A1A1A',
            }}
          >
            Seatly
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {user && (
            <span style={{ fontSize: 14, color: '#4A4A4A' }}>{user.email}</span>
          )}
          <button
            onClick={handleSignOut}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid #DADADA',
              background: '#FFFFFF',
              color: '#1A1A1A',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Sign out
          </button>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
