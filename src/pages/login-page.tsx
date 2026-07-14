import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false); const [error, setError] = useState('')
  const navigate = useNavigate()
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      if (mode === 'login') { const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw error }
      else { const { error } = await supabase.auth.signUp({ email, password }); if (error) throw error }
      navigate('/')
    } catch (err) { setError(err instanceof Error ? err.message : 'An error occurred') }
    finally { setLoading(false) }
  }
  return (
    <div className="auth-page">
      <div className="card auth-card">
        <div className="auth-header">
          <div className="auth-logo">Seatly</div>
          <h1 className="auth-title">{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
          <p className="auth-subtitle">{mode === 'login' ? 'Sign in to manage your events' : 'Set up your event seating'}</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group"><label className="form-label">Email</label><input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus /></div>
          <div className="form-group"><label className="form-label">Password</label><input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} /></div>
          {error && <div className="auth-error">{error}</div>}
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>{loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}</button>
        </form>
        <div className="auth-switch">
          {mode === 'login' ? <>No account? <button onClick={() => { setMode('signup'); setError('') }}>Sign up</button></> : <>Already have an account? <button onClick={() => { setMode('login'); setError('') }}>Sign in</button></>}
        </div>
      </div>
    </div>
  )
}
