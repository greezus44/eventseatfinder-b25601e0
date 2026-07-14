import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/providers/toast-provider';

const LOGIN_CSS = `
.login-root {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F8F8F8;
  padding: 24px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
.login-card {
  width: 100%;
  max-width: 420px;
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  border-radius: 20px;
  padding: 48px 40px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04);
}
.login-logo-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 28px;
}
.login-logo {
  width: 56px;
  height: 56px;
  background: #1A1A1A;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.02em;
}
.login-title {
  text-align: center;
  font-size: 24px;
  font-weight: 700;
  color: #1A1A1A;
  margin: 0 0 6px 0;
  letter-spacing: -0.02em;
}
.login-subtitle {
  text-align: center;
  font-size: 14px;
  color: #8A8A8A;
  margin: 0 0 32px 0;
}
.login-toggle {
  display: flex;
  background: #F8F8F8;
  border: 1px solid #E5E5E5;
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 28px;
}
.login-toggle-btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #8A8A8A;
  cursor: pointer;
  transition: all 0.2s ease;
}
.login-toggle-btn--active {
  background: #1A1A1A;
  color: #FFFFFF;
}
.login-field {
  margin-bottom: 20px;
}
.login-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #4A4A4A;
  margin-bottom: 8px;
}
.login-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #D5D5D5;
  border-radius: 10px;
  font-size: 15px;
  color: #1A1A1A;
  background: #FFFFFF;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  box-sizing: border-box;
}
.login-input:focus {
  border-color: #1A1A1A;
  box-shadow: 0 0 0 3px rgba(26,26,26,0.06);
}
.login-input::placeholder {
  color: #B5B5B5;
}
.login-submit {
  width: 100%;
  padding: 13px 16px;
  background: #1A1A1A;
  color: #FFFFFF;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, opacity 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 4px;
}
.login-submit:hover:not(:disabled) {
  background: #2A2A2A;
}
.login-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.login-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #FFFFFF;
  border-radius: 50%;
  animation: login-spin 0.6s linear infinite;
}
@keyframes login-spin {
  to { transform: rotate(360deg); }
}
.login-error {
  background: #F0F0F0;
  border: 1px solid #D5D5D5;
  color: #4A4A4A;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 14px;
  margin-bottom: 20px;
}
.login-footer {
  text-align: center;
  margin-top: 28px;
  font-size: 13px;
  color: #8A8A8A;
}
`;

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      if (mode === 'signin') {
        await signIn(email.trim(), password);
        toast('Welcome back!', 'success');
      } else {
        await signUp(email.trim(), password);
        toast('Account created. Please check your email to confirm.', 'success');
      }
      navigate('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{LOGIN_CSS}</style>
      <div className="login-root">
        <div className="login-card">
          <div className="login-logo-wrap">
            <div className="login-logo">S</div>
          </div>
          <h1 className="login-title">Seatly</h1>
          <p className="login-subtitle">
            {mode === 'signin' ? 'Sign in to manage your events' : 'Create an account to get started'}
          </p>

          <div className="login-toggle">
            <button
              type="button"
              className={`login-toggle-btn${mode === 'signin' ? ' login-toggle-btn--active' : ''}`}
              onClick={() => { setMode('signin'); setError(null); }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`login-toggle-btn${mode === 'signup' ? ' login-toggle-btn--active' : ''}`}
              onClick={() => { setMode('signup'); setError(null); }}
            >
              Sign Up
            </button>
          </div>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="login-field">
              <label className="login-label" htmlFor="login-email">Email</label>
              <input
                id="login-email"
                className="login-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={loading}
              />
            </div>
            <div className="login-field">
              <label className="login-label" htmlFor="login-password">Password</label>
              <input
                id="login-password"
                className="login-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                disabled={loading}
              />
            </div>
            <button className="login-submit" type="submit" disabled={loading}>
              {loading && <span className="login-spinner" />}
              {loading
                ? (mode === 'signin' ? 'Signing in…' : 'Creating account…')
                : (mode === 'signin' ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <p className="login-footer">
            {mode === 'signin'
              ? 'New to Seatly? Use the toggle above to sign up.'
              : 'Already have an account? Use the toggle above to sign in.'}
          </p>
        </div>
      </div>
    </>
  );
}
