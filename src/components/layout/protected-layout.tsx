import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/providers/auth-provider';
import { Spinner } from '@/components/ui/feedback';

export function ProtectedLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <Spinner size={32} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
