export default defineNuxtPlugin({
  name: 'auth',
  dependsOn: ['supabase'],
  async setup() {
    if (import.meta.server) return // Skip on server-side
    
    const { $supabase } = useNuxtApp()
    
    if (!$supabase) {
      console.warn('Supabase client not initialized. Please configure SUPABASE_URL and SUPABASE_KEY in .env')
      return
    }
  
  const user = useState('supabase_user')
  const session = useState('supabase_session')

  const fetchUserProfile = async (userId: string) => {
    if (!userId) return null
    
    try {
      const { data, error } = await $supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (!error && data) {
        // Merge profile data with auth user
        const authUser = user.value as any
        if (authUser) {
          user.value = { ...authUser, ...data } as any
        }
        return data
      }
    } catch (err) {
      console.error('Error fetching user profile:', err)
    }
    return null
  }

  try {
    // Get initial session (this will get the session from localStorage automatically)
    const { data: { session: currentSession } } = await $supabase.auth.getSession()
    
    session.value = currentSession
    user.value = currentSession?.user || null

    // Fetch user profile if user is authenticated
    if (user.value && currentSession) {
      const currentUser = user.value as any
      if (currentUser?.id) {
        await fetchUserProfile(currentUser.id)
      }
    }

    // Listen for auth changes
    $supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (event === 'SIGNED_OUT') {
        user.value = null
        session.value = null
      } else if (newSession) {
        // Update user and session
        session.value = newSession
        user.value = newSession.user
        
        // Fetch profile when user signs in
        if (event === 'SIGNED_IN' && newSession.user) {
          await fetchUserProfile(newSession.user.id)
        }
        // On TOKEN_REFRESHED, we keep the existing user data
        // and only refresh the profile if it's missing
        else if (event === 'TOKEN_REFRESHED' && newSession.user) {
          const currentUser = user.value as any
          if (!currentUser?.total_points) {
            await fetchUserProfile(newSession.user.id)
          }
        }
      }
    })
  } catch (error) {
    console.error('Error initializing Supabase auth:', error)
  }
  }
})

