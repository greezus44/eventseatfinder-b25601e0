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
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast('Please enter both email and password.', 'error');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signin') {
        await signIn(email.trim(), password);
        toast('Welcome back to Seatly!', 'success');
      } else {
        await signUp(email.trim(), password);
        toast('Account created. Welcome to Seatly!', 'success');
      }
      navigate('/');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo" aria-label="Seatly logo">
          <span className="login-logo-mark">S</span>
          <span className="login-logo-text">Seatly</span>
        </div>

        <div className="login-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signin'}
            className={`login-tab ${mode === 'signin' ? 'login-tab--active' : ''}`}
            onClick={() => setMode('signin')}
          >
            Sign In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signup'}
            className={`login-tab ${mode === 'signup' ? 'login-tab--active' : ''}`}
            onClick={() => setMode('signup')}
          >
            Sign Up
          </button>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-field">
            <span className="login-label">Email</span>
            <input
              type="email"
              className="login-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              disabled={loading}
            />
          </label>

          <label className="login-field">
            <span className="login-label">Password</span>
            <input
              type="password"
              className="login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              required
              disabled={loading}
            />
          </label>

          <button
            type="submit"
            className="login-submit"
            disabled={loading}
          >
            {loading ? (
              <span className="login-spinner" aria-hidden="true" />
            ) : mode === 'signin' ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p className="login-hint">
          {mode === 'signin'
            ? "Don't have an account? "
            : 'Already have an account? '}
          <button
            type="button"
            className="login-switch"
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
