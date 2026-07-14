import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
interface AuthContextValue { user: User | null; loading: boolean; signOut: () => Promise<void> }
const AuthContext = createContext<AuthContextValue>({ user: null, loading: true, signOut: async () => {} })
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setUser(session?.user ?? null); setLoading(false) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { (async () => { setUser(session?.user ?? null) })() })
    return () => subscription.unsubscribe()
  }, [])
  return <AuthContext.Provider value={{ user, loading, signOut: async () => { await supabase.auth.signOut() } }}>{children}</AuthContext.Provider>
}
export function useAuth() { return useContext(AuthContext) }
