import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/providers/toast-provider';
import { Spinner } from '@/components/ui/feedback';

type Mode = 'sign-in' | 'sign-up';

export function LoginPage() {
  const { signIn, signUp, session, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="auth-loading">
        <Spinner size={32} />
      </div>
    );
  }

  if (session) {
    const from = (location.state as { from?: { pathname: string } })?.from;
    return <Navigate to={from?.pathname ?? '/'} replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      if (mode === 'sign-in') {
        await signIn(email, password);
        toast('Welcome back!', 'success');
      } else {
        await signUp(email, password);
        toast('Account created! Please sign in.', 'success');
        setMode('sign-in');
        setPassword('');
        setSubmitting(false);
        return;
      }
      navigate('/');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Authentication failed';
      toast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <div className="auth-card__logo">Seatly</div>
          <p className="auth-card__subtitle">
            {mode === 'sign-in'
              ? 'Sign in to manage your events'
              : 'Create an account to get started'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-form__field">
            <label htmlFor="email" className="auth-form__label">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              disabled={submitting}
            />
          </div>

          <div className="auth-form__field">
            <label htmlFor="password" className="auth-form__label">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete={
                mode === 'sign-in' ? 'current-password' : 'new-password'
              }
              disabled={submitting}
            />
          </div>

          <button
            type="submit"
            className="btn btn--primary w-full"
            disabled={submitting}
          >
            {submitting ? <Spinner size={18} /> : null}
            {mode === 'sign-in' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="auth-card__footer">
          {mode === 'sign-in' ? (
            <span>
              Don't have an account?{' '}
              <button
                className="auth-card__toggle"
                onClick={() => setMode('sign-up')}
              >
                Sign up
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button
                className="auth-card__toggle"
                onClick={() => setMode('sign-in')}
              >
                Sign in
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
