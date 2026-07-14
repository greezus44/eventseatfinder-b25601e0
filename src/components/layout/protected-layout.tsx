import { type ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/providers/auth-provider';

export function ProtectedLayout({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !session) {
      navigate('/login', { replace: true, state: { from: location.pathname } });
    }
  }, [loading, session, navigate, location.pathname]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F8F8F8',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <span style={{ fontSize: 16, color: '#4A4A4A' }}>Loading…</span>
      </div>
    );
  }

  if (!session) return null;

  return <>{children}</>;
}
