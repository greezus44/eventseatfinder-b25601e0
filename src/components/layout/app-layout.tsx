import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/providers/auth-provider';

export function AppLayout() {
  const { user, signOut } = useAuth();

  const navStyle = ({ isActive }: { isActive: boolean }) => ({
    display: 'block',
    padding: '10px 16px',
    borderRadius: 8,
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 500,
    color: isActive ? '#0d9488' : '#475569',
    backgroundColor: isActive ? '#f0fdfa' : 'transparent',
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside
        style={{
          width: 240,
          backgroundColor: '#fff',
          borderRight: '1px solid #e2e8f0',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: '#0d9488',
            }}
          />
          <span style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
            Seatly
          </span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <NavLink to="/" style={navStyle} end>
            Dashboard
          </NavLink>
        </nav>

        <div style={{ marginTop: 'auto' }}>
          {user && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 13, color: '#64748b' }}>{user.email}</p>
            </div>
          )}
          <button
            onClick={() => signOut()}
            style={{
              width: '100%',
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              backgroundColor: '#fff',
              color: '#dc2626',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        <Outlet />
      </main>
    </div>
  );
}
