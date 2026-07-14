import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/auth-provider';

export function AppLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div style={layoutStyle}>
      <header style={headerStyle}>
        <div style={brandStyle}>
          <span style={logoStyle}>Seatly</span>
        </div>
        <div style={userSectionStyle}>
          {user?.email && <span style={emailStyle}>{user.email}</span>}
          <button style={signOutBtnStyle} onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </header>
      <main style={mainStyle}>
        <Outlet />
      </main>
    </div>
  );
}

const layoutStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: '#F8F8F8',
  display: 'flex',
  flexDirection: 'column',
  fontFamily: 'Inter, system-ui, sans-serif',
};

const headerStyle: React.CSSProperties = {
  height: 64,
  background: '#FFFFFF',
  borderBottom: '1px solid #EFEFEF',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 32px',
  position: 'sticky',
  top: 0,
  zIndex: 100,
};

const brandStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
};

const logoStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  color: '#1A1A1A',
  letterSpacing: '-0.02em',
};

const userSectionStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
};

const emailStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#4A4A4A',
};

const signOutBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 8,
  border: '1px solid #DADADA',
  background: '#FFFFFF',
  color: '#1A1A1A',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const mainStyle: React.CSSProperties = {
  flex: 1,
  padding: 32,
};
