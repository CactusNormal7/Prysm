export const useAuth = () => {
  const supabase = useSupabaseClient()
  const user = useState('supabase_user', () => null)
  const session = useState('supabase_session', () => null)
  const initialized = useState('auth_initialized', () => false)

  // Initialize auth state
  if (!initialized.value && process.client) {
    initialized.value = true
    
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      session.value = currentSession
      user.value = currentSession?.user || null
    })

    // Listen for auth changes
    supabase.auth.onAuthStateChange((event, newSession) => {
      user.value = newSession?.user || null
      session.value = newSession
      
      if (event === 'SIGNED_OUT') {
        user.value = null
        session.value = null
      }
    })
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    
    user.value = data.user
    session.value = data.session
    return data
  }

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })
    
    if (error) throw error
    
    user.value = data.user
    session.value = data.session
    return data
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    
    if (error) throw error
    
    user.value = null
    session.value = null
  }

  const signInWithMagicLink = async (email: string) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: process.client ? `${window.location.origin}/auth/callback` : ''
      }
    })
    
    if (error) throw error
    return data
  }

  return {
    user,
    session,
    signIn,
    signUp,
    signOut,
    signInWithMagicLink
  }
}

