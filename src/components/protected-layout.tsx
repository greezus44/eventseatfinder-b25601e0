import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/providers/auth-provider';

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return React.createElement(
      'div',
      { className: 'loading-screen' },
      React.createElement('div', { className: 'spinner' }),
    );
  }

  if (!session) {
    return React.createElement(Navigate, { to: '/login', replace: true });
  }

  return React.createElement(React.Fragment, null, children);
}
