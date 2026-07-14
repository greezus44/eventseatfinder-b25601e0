import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/providers/toast-provider';

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isSignUp = mode === 'signup';

  const switchMode = () => {
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
    setEmail('');
    setPassword('');
    setShowPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      toast('Please enter both email and password.', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast('Please enter a valid email address.', 'error');
      return;
    }

    if (isSignUp && password.length < 6) {
      toast('Password must be at least 6 characters long.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (isSignUp) {
        await signUp(email.trim(), password);
        toast('Account created successfully. Welcome to Seatly!', 'success');
      } else {
        await signIn(email.trim(), password);
        toast('Signed in. Welcome back to Seatly!', 'success');
      }
      navigate('/');
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : isSignUp
            ? 'Sign up failed. Please try again.'
            : 'Sign in failed. Please check your credentials.';
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
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 18V14M4 14V6C4 5.44772 4.44772 5 5 5H19C19.5523 5 20 5.44772 20 6V14M4 14H20M20 14V18M6 18H18"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8 9H16M8 11.5H13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h1 className="login-title">Seatly</h1>
          <p className="login-subtitle">
            {isSignUp ? 'Create your account to get started' : 'Sign in to manage your events'}
          </p>
        </div>

        <div className="login-mode-toggle" role="tablist" aria-label="Authentication mode">
          <button
            type="button"
            role="tab"
            aria-selected={!isSignUp}
            className={`login-mode-button ${!isSignUp ? 'login-mode-button--active' : ''}`}
            onClick={() => !isSignUp || switchMode()}
          >
            Sign In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isSignUp}
            className={`login-mode-button ${isSignUp ? 'login-mode-button--active' : ''}`}
            onClick={() => isSignUp || switchMode()}
          >
            Sign Up
          </button>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="login-field">
            <label className="login-label" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              className="login-input"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="login-password">
              Password
            </label>
            <div className="login-password-wrapper">
              <input
                id="login-password"
                className="login-input login-input--with-action"
                type={showPassword ? 'text' : 'password'}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                placeholder={isSignUp ? 'At least 6 characters' : 'Enter your password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                required
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-submit"
            disabled={submitting}
          >
            {submitting
              ? isSignUp ? 'Creating account…' : 'Signing in…'
              : isSignUp ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="login-switch-prompt">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            className="login-switch-link"
            onClick={switchMode}
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </div>
    </div>
  );
}
