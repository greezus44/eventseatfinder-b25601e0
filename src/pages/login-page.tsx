import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/auth-provider';

export function LoginPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fn = mode === 'signin' ? signIn : signUp;
    const { error: err } = await fn(email, password);

    if (err) {
      setError(err);
      setLoading(false);
    } else {
      navigate('/');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F8F8' }}>
      <div style={{ width: '100%', maxWidth: '360px', padding: '0 24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1A1A1A', marginBottom: '8px', letterSpacing: '-0.02em' }}>Seatly</h1>
        <p style={{ fontSize: '14px', color: '#4A4A4A', marginBottom: '32px' }}>Event seating made simple</p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                height: '44px',
                padding: '0 16px',
                borderRadius: '12px',
                border: '1px solid #DADADA',
                background: '#FFFFFF',
                fontSize: '15px',
                color: '#1A1A1A',
                outline: 'none',
              }}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                height: '44px',
                padding: '0 16px',
                borderRadius: '12px',
                border: '1px solid #DADADA',
                background: '#FFFFFF',
                fontSize: '15px',
                color: '#1A1A1A',
                outline: 'none',
              }}
            />
          </div>

          {error && (
            <p style={{ fontSize: '13px', color: '#DC2626', marginBottom: '16px' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              height: '44px',
              borderRadius: '12px',
              border: 'none',
              background: '#1A1A1A',
              color: '#FFFFFF',
              fontSize: '15px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          style={{
            width: '100%',
            marginTop: '16px',
            background: 'none',
            border: 'none',
            color: '#4A4A4A',
            fontSize: '13px',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}
