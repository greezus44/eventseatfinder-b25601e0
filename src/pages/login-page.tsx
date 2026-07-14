import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/auth-provider';
import { Spinner } from '@/components/ui/feedback';

type Mode = 'signin' | 'signup';

export function LoginPage() {
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [mode]);

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
      setError(
        mode === 'signin'
          ? `Sign in failed: ${message}`
          : `Sign up failed: ${message}`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-card__brand">
          <div className="auth-card__logo">Seatly</div>
          <p className="auth-card__tagline text-secondary">
            Event seating made simple
          </p>
        </div>

        <div className="auth-card__tabs">
          <button
            type="button"
            className={`auth-card__tab ${
              mode === 'signin' ? 'auth-card__tab--active' : ''
            }`}
            onClick={() => setMode('signin')}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`auth-card__tab ${
              mode === 'signup' ? 'auth-card__tab--active' : ''
            }`}
            onClick={() => setMode('signup')}
          >
            Sign up
          </button>
        </div>

        <form className="auth-card__form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span className="form-field__label">Email</span>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="form-field">
            <span className="form-field__label">Password</span>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={
                mode === 'signin' ? 'current-password' : 'new-password'
              }
              minLength={6}
              required
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button
            className="btn btn--primary"
            type="submit"
            disabled={submitting}
          >
            {submitting ? (
              <Spinner size={18} />
            ) : mode === 'signin' ? (
              'Sign in'
            ) : (
              'Create account'
            )}
          </button>
        </form>

        <p className="auth-card__switch text-muted">
          {mode === 'signin' ? (
            <>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                className="link-button"
                onClick={() => setMode('signup')}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                className="link-button"
                onClick={() => setMode('signin')}
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
