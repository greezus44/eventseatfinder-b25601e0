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
    if (!email || !password) {
      toast('Please enter your email and password.', 'error');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
        toast('Welcome back to Seatly.', 'success');
      } else {
        await signUp(email, password);
        toast('Account created. You are signed in.', 'success');
      }
      navigate('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (next: 'signin' | 'signup') => {
    setMode(next);
    setEmail('');
    setPassword('');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo__mark">S</div>
        </div>
        <h1 className="login-title">
          {mode === 'signin' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="login-subtitle">
          {mode === 'signin'
            ? 'Sign in to manage your events and seating.'
            : 'Start planning your event seating in minutes.'}
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label className="login-label" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              className="login-input"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              className="login-input"
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <button
            className="login-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <span className="login-spinner" aria-hidden="true" />
            ) : (
              <span>{mode === 'signin' ? 'Sign In' : 'Sign Up'}</span>
            )}
          </button>
        </form>

        <div className="login-toggle">
          {mode === 'signin' ? (
            <>
              <span className="login-toggle__text">Don't have an account?</span>
              <button
                className="login-toggle__btn"
                type="button"
                onClick={() => switchMode('signup')}
                disabled={loading}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              <span className="login-toggle__text">Already have an account?</span>
              <button
                className="login-toggle__btn"
                type="button"
                onClick={() => switchMode('signin')}
                disabled={loading}
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
