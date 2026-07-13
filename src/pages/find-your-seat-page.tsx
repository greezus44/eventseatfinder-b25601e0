export function FindYourSeatPage() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 'var(--space-6)',
        textAlign: 'center',
      }}
    >
      <h1>Find Your Seat</h1>
      <p className="text-secondary" style={{ marginTop: 'var(--space-2)' }}>
        Search for your name to find your assigned table.
      </p>
    </div>
  );
}
