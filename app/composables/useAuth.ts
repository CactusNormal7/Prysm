export const useAuth = () => {
  const nuxtApp = useNuxtApp()
  const supabase = nuxtApp.$supabase || null
  const user = useState<any>('supabase_user', () => null)
  const session = useState<any>('supabase_session', () => null)

  const fetchUserProfile = async () => {
    if (!user.value || !supabase) return null

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.value.id)
        .single()

      if (error) throw error

      // Merge profile data with auth user
      user.value = { ...user.value, ...data }
      return data
    } catch (err) {
      console.error('Error fetching user profile:', err)
      return null
    }
  }

  // Ensure user profile is loaded when accessing user
  const ensureUserProfile = async () => {
    if (!user.value || !supabase) return
    // Check if profile data is already loaded (has total_points or other custom fields)
    if (user.value.total_points !== undefined) return
    await fetchUserProfile()
  }

  // Automatically fetch user profile when user is set (but only if profile data is missing)
  watch(user, async (newUser) => {
    if (newUser && supabase) {
      await ensureUserProfile()
    }
  }, { immediate: false })

  // Ensure profile is loaded on initial mount if user is already authenticated
  onMounted(async () => {
    if (user.value && supabase) {
      await ensureUserProfile()
    }
  })

  const signIn = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase client is not initialized')
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    
    if (data.session) {
      user.value = data.session.user
      session.value = data.session
    }
    
    return data
  }

  const signUp = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase client is not initialized')
    
    const emailRedirectTo = import.meta.client ? `${window.location.origin}/auth/callback` : ''
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo
      }
    })
    
    if (error) throw error
    
    if (data.session) {
      user.value = data.session.user
      session.value = data.session
    } else if (data.user) {
      // User created but needs to confirm email
      user.value = data.user
    }
    
    return data
  }

  const signOut = async () => {
    if (!supabase) throw new Error('Supabase client is not initialized')
    
    const { error } = await supabase.auth.signOut()
    
    if (error) throw error
    
    user.value = null
    session.value = null
  }

  const signInWithMagicLink = async (email: string) => {
    if (!supabase) throw new Error('Supabase client is not initialized')
    
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: import.meta.client ? `${window.location.origin}/auth/callback` : ''
      }
    })
    
    if (error) throw error
    return data
  }

  const refreshSession = async () => {
    if (!supabase) return null
    
    try {
      const { data: { session: newSession }, error } = await supabase.auth.refreshSession()
      
      if (error) throw error
      
      if (newSession) {
        session.value = newSession
        user.value = newSession.user
      }
      
      return newSession
    } catch (err) {
      console.error('Error refreshing session:', err)
      return null
    }
  }

  return {
    user,
    session,
    signIn,
    signUp,
    signOut,
    signInWithMagicLink,
    fetchUserProfile,
    refreshSession
  }
}

