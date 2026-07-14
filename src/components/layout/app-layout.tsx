import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/auth-provider';

export function AppLayout() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F8F8F8',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header
        style={{
          background: '#FFFFFF',
          borderBottom: '1px solid #EFEFEF',
          padding: '0 32px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            fontSize: '20px',
            fontWeight: 700,
            color: '#1A1A1A',
            letterSpacing: '-0.02em',
          }}
        >
          Seatly
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          {session?.user?.email && (
            <span
              style={{
                fontSize: '13px',
                color: '#4A4A4A',
              }}
            >
              {session.user.email}
            </span>
          )}
          <button
            onClick={handleSignOut}
            style={{
              padding: '6px 16px',
              border: '1px solid #DADADA',
              background: '#FFFFFF',
              color: '#1A1A1A',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </div>
      </header>
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
    </div>
  );
}
