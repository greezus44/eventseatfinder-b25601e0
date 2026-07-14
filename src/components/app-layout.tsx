import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/auth-provider';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return React.createElement(
    'div',
    { className: 'app-layout' },
    React.createElement(
      'header',
      { className: 'app-header' },
      React.createElement(
        Link,
        { to: '/dashboard', className: 'app-logo' },
        React.createElement('span', { className: 'app-logo-text' }, 'Seatly'),
      ),
      React.createElement(
        'button',
        { className: 'btn btn-secondary', onClick: handleSignOut },
        'Sign Out',
      ),
    ),
    React.createElement('main', { className: 'app-main' }, children),
  );
}
