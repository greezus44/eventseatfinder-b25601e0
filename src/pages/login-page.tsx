import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/providers/toast-provider';

export function LoginPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const toast = useToast();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      toast('Please enter your email and password', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const result =
        mode === 'signin'
          ? await auth.signIn(email.trim(), password)
          : await auth.signUp(email.trim(), password);

      if (result.error) {
        toast(result.error, 'error');
      } else {
        if (mode === 'signup') {
          toast('Account created! Please sign in.', 'success');
          setMode('signin');
          setPassword('');
        } else {
          toast('Welcome back!', 'success');
          navigate('/');
        }
      }
    } catch {
      toast('Something went wrong. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #F8F8F8;
          padding: 24px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
          color: #1A1A1A;
        }
        .login-card {
          background: #FFFFFF;
          border: 1px solid #EFEFEF;
          border-radius: 20px;
          padding: 48px 40px;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.04);
        }
        .login-logo {
          width: 64px;
          height: 64px;
          margin: 0 auto 24px;
          background: #1A1A1A;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .login-logo-text {
          font-size: 32px;
          font-weight: 800;
          color: #FFFFFF;
          letter-spacing: -2px;
          line-height: 1;
        }
        .login-title {
          font-size: 24px;
          font-weight: 700;
          text-align: center;
          margin: 0 0 4px 0;
          letter-spacing: -0.5px;
        }
        .login-subtitle {
          font-size: 14px;
          color: #4A4A4A;
          text-align: center;
          margin: 0 0 32px 0;
        }
        .login-toggle {
          display: flex;
          background: #F8F8F8;
          border-radius: 12px;
          padding: 4px;
          margin-bottom: 24px;
        }
        .login-toggle-btn {
          flex: 1;
          padding: 10px;
          border: none;
          background: transparent;
          color: #4A4A4A;
          font-size: 13px;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .login-toggle-btn.active {
          background: #FFFFFF;
          color: #1A1A1A;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .login-field {
          display: flex;
          flex-direction: column;
        }
        .login-label {
          font-size: 13px;
          font-weight: 600;
          color: #1A1A1A;
          margin-bottom: 6px;
        }
        .login-input {
          width: 100%;
          height: 44px;
          padding: 10px 14px;
          border: 1px solid #DADADA;
          border-radius: 12px;
          background: #FFFFFF;
          font-size: 14px;
          color: #1A1A1A;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          box-sizing: border-box;
          font-family: inherit;
        }
        .login-input:focus {
          border-color: #1A1A1A;
          box-shadow: 0 0 0 3px rgba(0,0,0,0.06);
        }
        .login-input::placeholder {
          color: #DADADA;
        }
        .login-submit {
          width: 100%;
          height: 44px;
          background: #1A1A1A;
          color: #FFFFFF;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 8px;
        }
        .login-submit:hover {
          opacity: 0.85;
        }
        .login-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .login-spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #FFFFFF;
          border-radius: 50%;
          animation: login-spin 0.6s linear infinite;
        }
        @keyframes login-spin {
          to { transform: rotate(360deg); }
        }
        .login-footer {
          text-align: center;
          margin-top: 24px;
          font-size: 12px;
          color: #DADADA;
        }
      `}</style>

      <div className="login-page">
        <div className="login-card">
          <div className="login-logo">
            <span className="login-logo-text">S</span>
          </div>
          <h1 className="login-title">Seatly</h1>
          <p className="login-subtitle">
            {mode === 'signin' ? 'Sign in to your account' : 'Create your account'}
          </p>

          <div className="login-toggle">
            <button
              className={`login-toggle-btn ${mode === 'signin' ? 'active' : ''}`}
              onClick={() => setMode('signin')}
              type="button"
            >
              Sign In
            </button>
            <button
              className={`login-toggle-btn ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => setMode('signup')}
              type="button"
            >
              Sign Up
            </button>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label className="login-label">Email</label>
              <input
                className="login-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
              />
            </div>
            <div className="login-field">
              <label className="login-label">Password</label>
              <input
                className="login-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
            </div>
            <button
              className="login-submit"
              type="submit"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="login-spinner" />
                  {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                mode === 'signin' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <p className="login-footer">
            {mode === 'signin'
              ? 'Don\'t have an account? Click Sign Up above.'
              : 'Already have an account? Click Sign In above.'}
          </p>
        </div>
      </div>
    </>
  );
}
