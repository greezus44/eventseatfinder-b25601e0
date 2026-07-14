import { useAuth } from '@/providers/auth-provider';
import { Outlet, useNavigate } from 'react-router-dom';

export function AppLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8F8F8' }}>
      <header
        style={{
          background: '#FFFFFF',
          borderBottom: '1px solid #EFEFEF',
          padding: '0 24px',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: '#1A1A1A',
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '-0.02em',
            }}
          >
            Seatly
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {user?.email && (
            <span
              style={{
                fontSize: 13,
                color: '#4A4A4A',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {user.email}
            </span>
          )}
          <button
            onClick={handleSignOut}
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              border: '1px solid #DADADA',
              background: '#FFFFFF',
              color: '#1A1A1A',
              fontSize: 13,
              fontWeight: 500,
              fontFamily: 'Inter, sans-serif',
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
