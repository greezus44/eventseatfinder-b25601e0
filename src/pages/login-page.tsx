import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/providers/toast-provider';

const LOGIN_CSS = `
.login-root { min-height: 100vh; background: #F8F8F8; font-family: 'Inter', sans-serif; display: flex; align-items: center; justify-content: center; padding: 24px; }
.login-card { background: #FFFFFF; border: 1px solid #EFEFEF; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); padding: 40px; width: 100%; max-width: 400px; }
.login-logo { display: flex; align-items: center; justify-content: center; margin-bottom: 24px; }
.login-logo-mark { width: 56px; height: 56px; border-radius: 14px; background: #1A1A1A; display: flex; align-items: center; justify-content: center; }
.login-logo-mark span { font-size: 28px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.02em; }
.login-brand { text-align: center; font-size: 20px; font-weight: 700; color: #1A1A1A; margin-bottom: 4px; letter-spacing: -0.01em; }
.login-brand-sub { text-align: center; font-size: 13px; color: #B0B0B0; margin-bottom: 28px; }

.login-toggle { display: flex; gap: 4px; background: #F8F8F8; border: 1px solid #EFEFEF; border-radius: 12px; padding: 4px; margin-bottom: 24px; }
.login-toggle-btn { flex: 1; height: 40px; border: none; border-radius: 8px; background: transparent; font-size: 14px; font-weight: 500; color: #4A4A4A; cursor: pointer; transition: all 200ms ease; }
.login-toggle-btn--active { background: #FFFFFF; color: #1A1A1A; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }

.login-field { margin-bottom: 16px; }
.login-label { display: block; font-size: 13px; font-weight: 600; color: #4A4A4A; margin-bottom: 6px; }
.login-input { width: 100%; height: 44px; padding: 10px 14px; border: 1px solid #DADADA; border-radius: 12px; background: #FFFFFF; font-size: 14px; color: #1A1A1A; outline: none; transition: border-color 200ms ease, box-shadow 200ms ease; box-sizing: border-box; }
.login-input:focus { border-color: #1A1A1A; box-shadow: 0 0 0 3px rgba(0,0,0,0.06); }
.login-input::placeholder { color: #B0B0B0; }

.login-submit { width: 100%; height: 44px; border: none; border-radius: 12px; background: #1A1A1A; color: #FFFFFF; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 200ms ease; display: inline-flex; align-items: center; justify-content: center; gap: 8px; margin-top: 8px; }
.login-submit:hover { background: #333333; }
.login-submit:disabled { opacity: 0.5; cursor: not-allowed; }

.login-error { background: #FDF2F1; border: 1px solid #E5A29B; border-radius: 10px; padding: 12px 14px; font-size: 13px; color: #C0392B; margin-bottom: 16px; }

.login-spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #FFFFFF; border-radius: 50%; animation: login-spin 0.6s linear infinite; display: inline-block; }
@keyframes login-spin { to { transform: rotate(360deg); } }

.login-hint { text-align: center; font-size: 12px; color: #B0B0B0; margin-top: 20px; line-height: 1.6; }
`;

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const toast = useToast();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error: signInError } = await signIn(email.trim(), password);
        if (signInError) {
          setError(signInError);
          return;
        }
        toast('Welcome back!', 'success');
        navigate('/');
      } else {
        const { error: signUpError } = await signUp(email.trim(), password);
        if (signUpError) {
          setError(signUpError);
          return;
        }
        toast('Account created. Please check your email to confirm.', 'success');
        setMode('signin');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <style>{LOGIN_CSS}</style>
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-mark">
            <span>S</span>
          </div>
        </div>
        <div className="login-brand">Seatly</div>
        <div className="login-brand-sub">Event seating, simplified.</div>

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

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <label className="login-label" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              className="login-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <div className="login-field">
            <label className="login-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              className="login-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />
          </div>
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

        <div className="login-hint">
          {mode === 'signin'
            ? 'Don\'t have an account? Click Sign Up above.'
            : 'Already have an account? Click Sign In above.'}
        </div>
      </div>
    </div>
  );
}
