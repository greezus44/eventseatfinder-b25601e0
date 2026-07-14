import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/providers/auth-provider';

export function ProtectedLayout() {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={loadingStyle}>
        <span style={spinnerStyle} />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

const loadingStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#F8F8F8',
};

const spinnerStyle: React.CSSProperties = {
  display: 'inline-block',
  width: 32,
  height: 32,
  border: '3px solid #EFEFEF',
  borderTopColor: '#1A1A1A',
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite',
};
