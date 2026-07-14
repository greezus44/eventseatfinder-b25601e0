import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/auth-provider';
import { Spinner } from '@/components/ui/feedback';

export function LoginPage() {
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="loading-screen">
        <Spinner size={32} />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      navigate('/');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="loading-screen"
      style={{ minHeight: '100vh', padding: 'var(--space-4)' }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: 'var(--space-8)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              marginBottom: 'var(--space-1)',
            }}
          >
            Seatly
          </h1>
          <p className="text-secondary">Event seating made simple</p>
        </div>

        <div
          className="flex"
          style={{
            marginBottom: 'var(--space-5)',
            gap: 'var(--space-1)',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-1)',
          }}
        >
          <button
            type="button"
            className={`btn ${mode === 'signin' ? 'btn--primary' : 'btn--ghost'}`}
            style={{ flex: 1 }}
            onClick={() => {
              setMode('signin');
              setError(null);
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`btn ${mode === 'signup' ? 'btn--primary' : 'btn--ghost'}`}
            style={{ flex: 1 }}
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="form-field__label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="input w-full"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-field">
            <label className="form-field__label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="input w-full"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete={
                mode === 'signin' ? 'current-password' : 'new-password'
              }
              minLength={6}
            />
          </div>

          {error && (
            <div
              className="card"
              style={{
                background: 'var(--error-bg)',
                padding: 'var(--space-3)',
                marginBottom: 'var(--space-4)',
                color: 'var(--error)',
                fontSize: '0.875rem',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn--primary w-full"
            disabled={submitting}
            style={{ gap: 'var(--space-2)' }}
          >
            {submitting && <Spinner size={16} />}
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p
          className="text-muted"
          style={{
            textAlign: 'center',
            marginTop: 'var(--space-5)',
            fontSize: '0.8125rem',
          }}
        >
          {mode === 'signin'
            ? "Don't have an account? "
            : 'Already have an account? '}
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            style={{ display: 'inline-flex', padding: '0' }}
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setError(null);
            }}
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
