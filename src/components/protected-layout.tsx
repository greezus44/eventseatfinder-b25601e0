import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/providers/auth-provider';

export function ProtectedLayout({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
