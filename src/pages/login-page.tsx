import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/providers/toast-provider';

const LOGIN_CSS = `
.login-root {
  min-height: 100vh; background: #F8F8F8; font-family: 'Inter', sans-serif;
  display: flex; align-items: center; justify-content: center;
  padding: 24px; box-sizing: border-box;
}
.login-card {
  background: #FFFFFF; border-radius: 16px; padding: 48px 40px;
  width: 100%; max-width: 400px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.06);
  border: 1px solid #EFEFEF;
}
.login-logo {
  width: 56px; height: 56px; border-radius: 14px;
  background: #1A1A1A; color: #FFFFFF;
  display: flex; align-items: center; justify-content: center;
  font-size: 28px; font-weight: 800; font-family: 'Inter', sans-serif;
  margin: 0 auto 24px; letter-spacing: -1px;
}
.login-title {
  margin: 0 0 6px; font-size: 24px; font-weight: 700; color: #1A1A1A;
  text-align: center; letter-spacing: -0.5px;
}
.login-subtitle {
  margin: 0 0 32px; font-size: 14px; color: #4A4A4A; text-align: center;
}

/* ---- Toggle ---- */
.login-toggle {
  display: flex; background: #F8F8F8; border-radius: 12px; padding: 4px;
  margin-bottom: 28px; border: 1px solid #EFEFEF;
}
.login-toggle-btn {
  flex: 1; padding: 10px 16px; border: none; border-radius: 9px;
  background: transparent; color: #4A4A4A; font-size: 14px; font-weight: 600;
  font-family: inherit; cursor: pointer; transition: all 200ms ease;
}
.login-toggle-btn--active {
  background: #FFFFFF; color: #1A1A1A;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}

/* ---- Form ---- */
.login-field { margin-bottom: 16px; }
.login-field-label {
  display: block; font-size: 13px; font-weight: 600; color: #4A4A4A;
  margin-bottom: 6px;
}
.login-input-wrap { position: relative; }
.login-input {
  width: 100%; height: 44px; padding: 10px 14px;
  border: 1px solid #DADADA; border-radius: 12px;
  background: #FFFFFF; font-size: 14px; color: #1A1A1A;
  outline: none; transition: border-color 200ms ease, box-shadow 200ms ease;
  box-sizing: border-box; font-family: inherit;
}
.login-input::placeholder { color: #B0B0B0; }
.login-input:focus { border-color: #1A1A1A; box-shadow: 0 0 0 3px rgba(0,0,0,0.06); }
.login-input--with-icon { padding-left: 42px; }
.login-input-icon {
  position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
  color: #B0B0B0; pointer-events: none; display: flex;
}
.login-pw-toggle {
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  background: none; border: none; color: #4A4A4A; cursor: pointer;
  padding: 6px; display: flex; align-items: center; font-family: inherit;
}
.login-pw-toggle:hover { color: #1A1A1A; }

/* ---- Submit ---- */
.login-submit {
  width: 100%; height: 44px; margin-top: 8px;
  border: none; border-radius: 12px;
  background: #1A1A1A; color: #FFFFFF;
  font-size: 14px; font-weight: 600; font-family: inherit;
  cursor: pointer; transition: background 200ms ease, transform 100ms ease;
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
}
.login-submit:hover { background: #333333; }
.login-submit:active { transform: scale(0.99); }
.login-submit:disabled { opacity: 0.5; cursor: not-allowed; }
.login-spinner {
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,0.3); border-top-color: #FFFFFF;
  border-radius: 50%; animation: login-spin 0.6s linear infinite;
}
@keyframes login-spin { to { transform: rotate(360deg); } }

/* ---- Footer ---- */
.login-footer {
  margin-top: 24px; text-align: center; font-size: 13px; color: #B0B0B0;
}
.login-error {
  margin-bottom: 16px; padding: 10px 14px; border-radius: 10px;
  background: #EFEFEF; color: #4A4A4A; font-size: 13px; text-align: center;
}
`;

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        await signIn(email.trim(), password);
        toast('Welcome back', 'success');
      } else {
        await signUp(email.trim(), password);
        toast('Account created. Check your email to confirm.', 'success');
      }
      navigate('/');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-root">
      <style>{LOGIN_CSS}</style>
      <div className="login-card">
        <div className="login-logo">S</div>
        <h1 className="login-title">
          {mode === 'signin' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="login-subtitle">
          {mode === 'signin'
            ? 'Sign in to manage your events'
            : 'Start planning your seating in minutes'}
        </p>

        {/* Toggle */}
        <div className="login-toggle">
          <button
            className={`login-toggle-btn ${mode === 'signin' ? 'login-toggle-btn--active' : ''}`}
            onClick={() => {
              setMode('signin');
              setError('');
            }}
            type="button"
          >
            Sign In
          </button>
          <button
            className={`login-toggle-btn ${mode === 'signup' ? 'login-toggle-btn--active' : ''}`}
            onClick={() => {
              setMode('signup');
              setError('');
            }}
            type="button"
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="login-error">{error}</div>}

          <div className="login-field">
            <label className="login-field-label">Email</label>
            <div className="login-input-wrap">
              <span className="login-input-icon">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="3" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M3 5l5 3 5-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                </svg>
              </span>
              <input
                type="email"
                className="login-input login-input--with-icon"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          <div className="login-field">
            <label className="login-field-label">Password</label>
            <div className="login-input-wrap">
              <span className="login-input-icon">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M5 7V5a3 3 0 1 1 6 0v2" stroke="currentColor" strokeWidth="1.5" fill="none" />
                </svg>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                className="login-input login-input--with-icon"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                className="login-pw-toggle"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M2 2l14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M8 3.2A8 8 0 0 1 16 9a8 8 0 0 1-1.2 2M5.5 4.5A8 8 0 0 0 2 9a8 8 0 0 0 8 4 8 8 0 0 0 3-.6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                    <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M2 9a8 8 0 0 1 14 0 8 8 0 0 1-14 0z" stroke="currentColor" strokeWidth="1.5" fill="none" />
                    <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-submit"
            disabled={loading}
          >
            {loading && <span className="login-spinner" />}
            {loading
              ? 'Please wait...'
              : mode === 'signin'
                ? 'Sign In'
                : 'Create Account'}
          </button>
        </form>

        <p className="login-footer">
          {mode === 'signin'
            ? "Don't have an account? "
            : 'Already have an account? '}
          <a
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setError('');
            }}
            style={{
              color: '#1A1A1A',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'none',
            }}
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </a>
        </p>
      </div>
    </div>
  );
}
