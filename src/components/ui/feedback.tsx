export function Spinner({ size = 24 }: { size?: number }) {
  return (
    <span
      className="spinner"
      style={{
        width: size,
        height: size,
        borderWidth: Math.max(2, Math.floor(size / 10)),
      }}
    />
  );
}

export function LoadingScreen({ message }: { message?: string }) {
  return (
    <div className="loading-screen">
      <Spinner size={32} />
      {message && <p className="text-secondary">{message}</p>}
    </div>
  );
}

export function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="loading-screen">
      <div
        className="card"
        style={{ padding: 'var(--space-8)', textAlign: 'center' }}
      >
        <h2 style={{ marginBottom: 'var(--space-2)' }}>Something went wrong</h2>
        <p className="text-secondary">{message}</p>
      </div>
    </div>
  );
}
