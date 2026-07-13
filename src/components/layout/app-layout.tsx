import { Outlet } from 'react-router-dom';

export function AppLayout() {
  return (
    <div
      style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
    >
      <Outlet />
    </div>
  );
}
