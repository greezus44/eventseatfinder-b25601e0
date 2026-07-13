import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/providers/auth-provider';
import { LoadingScreen } from '@/components/ui/feedback';

export function ProtectedLayout() {
  const { loading, session } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen message="Checking your session…" />;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
