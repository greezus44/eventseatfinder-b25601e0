import { Navigate } from 'react-router-dom';
import { useAuth } from '@/providers/auth-provider';
import { LoadingScreen } from '@/components/ui/feedback';

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
