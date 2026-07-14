import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/providers/auth-provider';
import { LoadingScreen } from '@/components/ui/feedback';

export function ProtectedLayout() {
  const { session, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
