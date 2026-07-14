import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/providers/toast-provider'

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      toast('Account created! Please sign in.')
      setMode('signin')
      setLoading(false)
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      navigate('/')
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <div className="auth-header">
          <div className="auth-logo">Seatly</div>
          <h1 className="auth-title">{mode === 'signin' ? 'Welcome back' : 'Create account'}</h1>
          <p className="auth-subtitle">{mode === 'signin' ? 'Sign in to manage your events' : 'Sign up to get started'}</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="••••••••" />
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
            {loading ? 'Loading…' : mode === 'signin' ? 'Sign in' : 'Sign up'}
          </button>
        </form>
        <div className="auth-switch">
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null) }}>
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}
