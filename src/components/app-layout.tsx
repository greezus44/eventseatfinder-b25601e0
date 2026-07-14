import { ReactNode } from 'react';
import { useAuth } from '@/providers/auth-provider';

export function AppLayout({ children }: { children: ReactNode }) {
  const { signOut } = useAuth();

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="app-header-inner">
          <a href="/" className="app-logo">
            Seatly
          </a>
          <button className="btn btn-secondary" onClick={() => signOut()}>
            Sign Out
          </button>
        </div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
