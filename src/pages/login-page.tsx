import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/providers/toast-provider';

export function LoginPage() {
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = mode === 'signin'
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password);
      if (result.error) {
        setError(result.error);
      } else {
        toast(mode === 'signin' ? 'Welcome back!' : 'Account created!', 'success');
        navigate('/');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{LOGIN_CSS}</style>
      <div className="login-page">
        <div className="login-card">
          {/* Logo */}
          <div className="login-logo">
            <div className="login-logo-mark">S</div>
          </div>
          <h1 className="login-app-name">Seatly</h1>
          <p className="login-tagline">Event seating, simplified.</p>

          {/* Toggle */}
          <div className="login-toggle">
            <button
              className={`login-toggle-btn${mode === 'signin' ? ' login-toggle-btn--active' : ''}`}
              onClick={() => { setMode('signin'); setError(null); }}
            >
              Sign In
            </button>
            <button
              className={`login-toggle-btn${mode === 'signup' ? ' login-toggle-btn--active' : ''}`}
              onClick={() => { setMode('signup'); setError(null); }}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label className="login-label" htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                className="login-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={loading}
              />
            </div>
            <div className="login-field">
              <label className="login-label" htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                className="login-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                disabled={loading}
              />
            </div>

            {error && <p className="login-error">{error}</p>}

            <button
              type="submit"
              className="login-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="login-spinner" />
                  <span>{mode === 'signin' ? 'Signing in…' : 'Creating account…'}</span>
                </>
              ) : (
                <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
              )}
            </button>
          </form>

          <p className="login-footer">
            {mode === 'signin'
              ? "Don't have an account? "
              : 'Already have an account? '}
            <button
              className="login-switch-link"
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); }}
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </>
  );
}

const LOGIN_CSS = `
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F8F8F8;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  padding: 24px;
  box-sizing: border-box;
}

.login-card {
  background: #FFFFFF;
  border: 1px solid #EFEFEF;
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Logo */
.login-logo {
  margin-bottom: 16px;
}

.login-logo-mark {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: #1A1A1A;
  color: #FFFFFF;
  font-size: 28px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Inter', system-ui, sans-serif;
}

.login-app-name {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  color: #1A1A1A;
}

.login-tagline {
  font-size: 14px;
  color: #4A4A4A;
  margin: 4px 0 28px 0;
}

/* Toggle */
.login-toggle {
  display: flex;
  width: 100%;
  border: 1px solid #EFEFEF;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 24px;
}

.login-toggle-btn {
  flex: 1;
  padding: 10px;
  border: none;
  background: #FFFFFF;
  color: #4A4A4A;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}

.login-toggle-btn--active {
  background: #1A1A1A;
  color: #FFFFFF;
  font-weight: 600;
}

.login-toggle-btn:not(.login-toggle-btn--active):hover {
  background: #F8F8F8;
  color: #1A1A1A;
}

/* Form */
.login-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.login-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.login-label {
  font-size: 13px;
  font-weight: 500;
  color: #4A4A4A;
}

.login-input {
  padding: 12px 14px;
  border: 1px solid #DADADA;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  color: #1A1A1A;
  background: #FFFFFF;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  box-sizing: border-box;
}

.login-input:focus {
  border-color: #1A1A1A;
  box-shadow: 0 0 0 3px rgba(26,26,26,0.06);
}

.login-input:disabled {
  background: #F8F8F8;
  cursor: not-allowed;
}

.login-error {
  font-size: 13px;
  color: #1A1A1A;
  background: #EFEFEF;
  border: 1px solid #DADADA;
  border-radius: 8px;
  padding: 10px 14px;
  margin: 0;
  line-height: 1.4;
}

.login-submit-btn {
  padding: 12px;
  border: none;
  border-radius: 8px;
  background: #1A1A1A;
  color: #FFFFFF;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 4px;
}

.login-submit-btn:hover:not(:disabled) {
  background: #4A4A4A;
}

.login-submit-btn:disabled {
  background: #DADADA;
  cursor: not-allowed;
}

.login-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #FFFFFF;
  border-radius: 50%;
  animation: login-spin 0.7s linear infinite;
}

@keyframes login-spin {
  to { transform: rotate(360deg); }
}

/* Footer */
.login-footer {
  font-size: 13px;
  color: #4A4A4A;
  margin: 24px 0 0 0;
  text-align: center;
}

.login-switch-link {
  background: none;
  border: none;
  color: #1A1A1A;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  padding: 0;
  text-decoration: underline;
  transition: color 0.15s;
}

.login-switch-link:hover {
  color: #4A4A4A;
}
`;
