export function Spinner({ size = 24 }: { size?: number }) {
  return (
    <span
      className="spinner"
      style={{ width: size, height: size, borderWidth: 2 }}
    />
  );
}

export function LoadingScreen({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="loading-screen">
      <Spinner size={32} />
      <p className="text-secondary">{label}</p>
    </div>
  );
}

export function ErrorScreen({ message }: { message?: string }) {
  return (
    <div className="loading-screen">
      <p style={{ color: 'var(--error)', fontWeight: 500 }}>
        {message ?? 'Something went wrong'}
      </p>
    </div>
  );
}
