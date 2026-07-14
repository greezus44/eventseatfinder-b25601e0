import React from 'react';
import { useAuth } from '@/providers/auth-provider';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="app-header-inner">
          <a href="/dashboard" className="app-logo">
            <span className="app-logo-mark">◆</span> Seatly
          </a>
          <div className="app-header-right">
            {user && (
              <span className="app-user-email">{user.email}</span>
            )}
            <button className="btn btn-secondary" onClick={() => signOut()}>
              Sign Out
            </button>
          </div>
        </div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
