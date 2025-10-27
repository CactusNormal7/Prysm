export const useAuth = () => {
  const supabase = useSupabaseClient()
  const user = useState<any>('supabase_user', () => null)
  const session = useState<any>('supabase_session', () => null)

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
    const emailRedirectTo = import.meta.client ? `${window.location.origin}/auth/callback` : ''
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo
      }
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
        emailRedirectTo: import.meta.client ? `${window.location.origin}/auth/callback` : ''
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

