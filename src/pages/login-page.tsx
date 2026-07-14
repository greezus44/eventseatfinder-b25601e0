import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/providers/toast-provider';

type AuthMode = 'signin' | 'signup';

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isSignUp = mode === 'signup';

  const toggleMode = () => {
    setMode((prev) => (prev === 'signin' ? 'signup' : 'signin'));
    setEmail('');
    setPassword('');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast('Please enter both email and password.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (isSignUp) {
        await signUp(email.trim(), password);
        toast('Account created. Welcome to Seatly!', 'success');
      } else {
        await signIn(email.trim(), password);
        toast('Signed in successfully.', 'success');
      }
      navigate('/');
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : isSignUp
            ? 'Could not create your account. Please try again.'
            : 'Could not sign you in. Please check your credentials.';
      toast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 18v-7a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v7" />
              <path d="M4 18h16" />
              <path d="M6 18v2" />
              <path d="M18 18v2" />
              <path d="M9 11h6" />
            </svg>
          </div>
          <h1 className="login-title">Seatly</h1>
          <p className="login-subtitle">
            {isSignUp ? 'Create your account to reserve the perfect seat.' : 'Sign in to manage your seating.'}
          </p>
        </div>

        <div className="login-toggle" role="tablist" aria-label="Authentication mode">
          <button
            type="button"
            role="tab"
            aria-selected={!isSignUp}
            className={`login-toggle-btn ${!isSignUp ? 'is-active' : ''}`}
            onClick={() => setMode('signin')}
          >
            Sign In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isSignUp}
            className={`login-toggle-btn ${isSignUp ? 'is-active' : ''}`}
            onClick={() => setMode('signup')}
          >
            Sign Up
          </button>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <label className="login-field">
            <span className="login-label">Email</span>
            <input
              type="email"
              className="login-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label className="login-field">
            <span className="login-label">Password</span>
            <input
              type="password"
              className="login-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              required
            />
          </label>

          <button
            type="submit"
            className="login-submit"
            disabled={submitting}
          >
            {submitting ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="login-switch">
          {isSignUp ? 'Already have an account?' : 'New to Seatly?'}{' '}
          <button type="button" className="login-switch-link" onClick={toggleMode}>
            {isSignUp ? 'Sign in' : 'Create one'}
          </button>
        </p>
      </div>
    </div>
  );
}
