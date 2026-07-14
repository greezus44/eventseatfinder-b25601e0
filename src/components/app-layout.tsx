import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/auth-provider';

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F8F8' }}>
      <header
        style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #EFEFEF',
          padding: '0 24px',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link to="/" style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A1A', textDecoration: 'none', letterSpacing: '-0.02em' }}>
          Seatly
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {user && (
            <button
              onClick={handleSignOut}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #DADADA',
                background: 'transparent',
                color: '#4A4A4A',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Sign Out
            </button>
          )}
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
