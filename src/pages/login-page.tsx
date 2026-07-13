export function LoginPage() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 'var(--space-6)',
      }}
    >
      <div className="card" style={{ maxWidth: 400, width: '100%' }}>
        <h1 style={{ marginBottom: 'var(--space-2)' }}>Seatly</h1>
        <p className="text-secondary">
          Sign in to manage your events and seating arrangements.
        </p>
      </div>
    </div>
  );
}
