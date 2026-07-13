import type { ReactNode } from 'react';

export function Spinner({ size = 24 }: { size?: number }) {
  return (
    <div
      className="spinner"
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    />
  );
}

export function LoadingScreen({ message = 'Loading…' }: { message?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-4)',
        minHeight: '60vh',
      }}
    >
      <Spinner size={32} />
      <p className="text-secondary">{message}</p>
    </div>
  );
}

export function ErrorScreen({
  message = 'Something went wrong.',
  children,
}: {
  message?: string;
  children?: ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-4)',
        minHeight: '60vh',
        textAlign: 'center',
      }}
    >
      <h2>Oops</h2>
      <p className="text-secondary">{message}</p>
      {children}
    </div>
  );
}
