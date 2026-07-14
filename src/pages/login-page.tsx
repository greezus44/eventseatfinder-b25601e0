import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/providers/toast-provider';
import { Spinner } from '@/components/ui/feedback';

export function LoginPage() {
  const { user, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setSubmitting(true);
    try {
      if (mode === 'signin') {
        await signIn(email.trim(), password);
        toast('Welcome back!', 'success');
      } else {
        await signUp(email.trim(), password);
        toast(
          'Account created! Please check your email to confirm.',
          'success',
        );
      }
      navigate('/');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = () => {
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
    setError(null);
  };

  return (
    <div className="loading-screen" style={{ minHeight: '100vh' }}>
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 400,
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
            borderRadius: 8,
            overflow: 'hidden',
            border: '1px solid var(--border)',
          }}
        >
          <button
            type="button"
            className="btn btn--sm"
            style={{
              flex: 1,
              borderRadius: 0,
              background: mode === 'signin' ? 'var(--primary)' : 'transparent',
              color: mode === 'signin' ? '#fff' : 'var(--text)',
            }}
            onClick={() => setMode('signin')}
          >
            Sign In
          </button>
          <button
            type="button"
            className="btn btn--sm"
            style={{
              flex: 1,
              borderRadius: 0,
              background: mode === 'signup' ? 'var(--primary)' : 'transparent',
              color: mode === 'signup' ? '#fff' : 'var(--text)',
            }}
            onClick={() => setMode('signup')}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div
            className="form-field"
            style={{ marginBottom: 'var(--space-4)' }}
          >
            <label className="form-field__label">Email</label>
            <input
              type="email"
              className="input w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <div
            className="form-field"
            style={{ marginBottom: 'var(--space-5)' }}
          >
            <label className="form-field__label">Password</label>
            <input
              type="password"
              className="input w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={
                mode === 'signin' ? 'current-password' : 'new-password'
              }
            />
          </div>

          {error && (
            <div
              className="card"
              style={{
                padding: 'var(--space-3)',
                marginBottom: 'var(--space-4)',
                background: 'var(--error-bg, rgba(220,38,38,0.1))',
                border: '1px solid var(--error)',
              }}
            >
              <p
                style={{
                  color: 'var(--error)',
                  fontSize: '0.875rem',
                }}
              >
                {error}
              </p>
            </div>
          )}

          <button
            type="submit"
            className="btn btn--primary w-full"
            disabled={submitting}
          >
            {submitting ? (
              <Spinner size={18} />
            ) : mode === 'signin' ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p
          className="text-muted"
          style={{
            textAlign: 'center',
            marginTop: 'var(--space-4)',
            fontSize: '0.875rem',
          }}
        >
          {mode === 'signin'
            ? "Don't have an account? "
            : 'Already have an account? '}
          <button
            type="button"
            onClick={switchMode}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              cursor: 'pointer',
              font: 'inherit',
              padding: 0,
            }}
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
