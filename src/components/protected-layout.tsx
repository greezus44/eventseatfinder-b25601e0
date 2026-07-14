import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/providers/auth-provider';

export function ProtectedLayout({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: '#4A4A4A', fontSize: '14px' }}>Loading...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
