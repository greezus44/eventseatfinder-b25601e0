export function Spinner({ size = 24 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        border: '3px solid #e2e8f0',
        borderTopColor: '#0d9488',
        borderRadius: '50%',
        animation: 'spin 0.6s linear infinite',
      }}
    />
  );
}

export function LoadingScreen({
  message = 'Loading...',
}: {
  message?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
      }}
    >
      <Spinner size={40} />
      <p style={{ color: '#64748b', fontSize: 14 }}>{message}</p>
    </div>
  );
}

export function ErrorScreen({
  message = 'Something went wrong',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
      }}
    >
      <p style={{ color: '#dc2626', fontSize: 16, fontWeight: 500 }}>
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: '8px 20px',
            borderRadius: 8,
            border: 'none',
            backgroundColor: '#0d9488',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Try Again
        </button>
      )}
    </div>
  );
}
