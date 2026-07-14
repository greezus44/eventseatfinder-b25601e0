import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/providers/toast-provider';

const LOGIN_CSS = `
.login-root {
  min-height: 100vh; background: #F8F8F8; display: flex; align-items: center; justify-content: center;
  padding: 24px; font-family: 'Inter', system-ui, sans-serif;
}
.login-card {
  background: #FFFFFF; border: 1px solid #EFEFEF; border-radius: 16px;
  padding: 40px; width: 100%; max-width: 420px; box-shadow: 0 4px 24px rgba(0,0,0,0.06);
}
.login-logo {
  width: 56px; height: 56px; border-radius: 14px; background: #1A1A1A; color: #FFFFFF;
  display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 700;
  margin: 0 auto 24px;
}
.login-title { font-size: 24px; font-weight: 700; color: #1A1A1A; text-align: center; margin: 0 0 4px; letter-spacing: -0.02em; }
.login-subtitle { font-size: 14px; color: #B0B0B0; text-align: center; margin: 0 0 32px; }

/* Toggle */
.login-toggle {
  display: flex; background: #F8F8F8; border: 1px solid #EFEFEF; border-radius: 12px;
  padding: 4px; margin-bottom: 24px; gap: 4px;
}
.login-toggle-btn {
  flex: 1; height: 40px; border: none; border-radius: 10px; background: transparent;
  font-size: 14px; font-weight: 500; color: #4A4A4A; cursor: pointer;
  transition: all 200ms ease; font-family: inherit;
}
.login-toggle-btn--active { background: #FFFFFF; color: #1A1A1A; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }

/* Form */
.login-field { margin-bottom: 16px; }
.login-label { display: block; font-size: 13px; font-weight: 600; color: #4A4A4A; margin-bottom: 6px; }
.login-input {
  width: 100%; height: 44px; padding: 10px 14px; border: 1px solid #DADADA; border-radius: 12px;
  background: #FFFFFF; font-size: 14px; color: #1A1A1A; outline: none; box-sizing: border-box;
  transition: border-color 200ms ease, box-shadow 200ms ease;
}
.login-input:focus { border-color: #1A1A1A; box-shadow: 0 0 0 3px rgba(0,0,0,0.06); }
.login-input::placeholder { color: #DADADA; }

.login-submit {
  width: 100%; height: 44px; border: 1px solid #1A1A1A; border-radius: 12px;
  background: #1A1A1A; color: #FFFFFF; font-size: 14px; font-weight: 500; cursor: pointer;
  transition: background 200ms ease; display: inline-flex; align-items: center; justify-content: center;
  gap: 8px; margin-top: 8px; font-family: inherit;
}
.login-submit:hover { background: #333333; }
.login-submit:disabled { opacity: 0.6; cursor: not-allowed; }

.login-spinner {
  width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #FFFFFF; border-radius: 50%; animation: login-spin 0.7s linear infinite;
}
@keyframes login-spin { to { transform: rotate(360deg); } }

.login-hint { font-size: 13px; color: #B0B0B0; text-align: center; margin: 20px 0 0; line-height: 1.5; }
.login-error { font-size: 13px; color: #C0392B; text-align: center; margin: 12px 0 0; }
`;

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signin') {
        await signIn(email.trim(), password);
        toast('Welcome back!', 'success');
      } else {
        await signUp(email.trim(), password);
        toast('Account created! Check your email to confirm.', 'success');
      }
      navigate('/');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <style>{LOGIN_CSS}</style>
      <div className="login-card">
        <div className="login-logo">S</div>
        <h1 className="login-title">{mode === 'signin' ? 'Welcome back' : 'Create account'}</h1>
        <p className="login-subtitle">
          {mode === 'signin' ? 'Sign in to manage your events' : 'Start planning your seating in minutes'}
        </p>

        <div className="login-toggle">
          <button
            className={`login-toggle-btn${mode === 'signin' ? ' login-toggle-btn--active' : ''}`}
            onClick={() => { setMode('signin'); setError(''); }}
          >
            Sign In
          </button>
          <button
            className={`login-toggle-btn${mode === 'signup' ? ' login-toggle-btn--active' : ''}`}
            onClick={() => { setMode('signup'); setError(''); }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <label className="login-label">Email</label>
            <input
              className="login-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              autoFocus
            />
          </div>
          <div className="login-field">
            <label className="login-label">Password</label>
            <input
              className="login-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />
          </div>
          {error && <p className="login-error">{error}</p>}
          <button className="login-submit" type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="login-spinner" />
                {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
              </>
            ) : (
              mode === 'signin' ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        <p className="login-hint">
          {mode === 'signin'
            ? "Don't have an account? Switch to Sign Up above."
            : 'Already have an account? Switch to Sign In above.'}
        </p>
      </div>
    </div>
  );
}
