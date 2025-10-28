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
          const mergedUser = { ...authUser, ...data }
          user.value = mergedUser as any
          // Store profile data in localStorage for persistence
          if (typeof window !== 'undefined') {
            localStorage.setItem('prysm_user_profile', JSON.stringify(data))
          }
        }
        return data
      }
    } catch (err) {
      console.error('Error fetching user profile:', err)
    }
    return null
  }

  const restoreUserProfile = async (userId: string) => {
    if (typeof window === 'undefined') return null
    
    try {
      const cachedProfile = localStorage.getItem('prysm_user_profile')
      if (cachedProfile) {
        const profileData = JSON.parse(cachedProfile)
        const authUser = user.value as any
        if (authUser && profileData.id === userId) {
          user.value = { ...authUser, ...profileData } as any
          return profileData
        }
      }
    } catch (err) {
      console.error('Error restoring user profile:', err)
    }
    return null
  }

  try {
    // Get initial session (this will get the session from localStorage automatically)
    const { data: { session: currentSession }, error } = await $supabase.auth.getSession()
    
    if (error) {
      console.error('Error getting session:', error)
    }
    
    session.value = currentSession
    user.value = currentSession?.user || null

    // Fetch user profile if user is authenticated
    if (user.value && currentSession) {
      const currentUser = user.value as any
      if (currentUser?.id) {
        // Try to restore from cache first, then fetch if needed
        const cachedProfile = await restoreUserProfile(currentUser.id)
        if (!cachedProfile || !cachedProfile.total_points) {
          await fetchUserProfile(currentUser.id)
        }
      }
    }

    // Listen for auth changes
    $supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('Auth state changed:', event)
      
      if (event === 'SIGNED_OUT') {
        user.value = null
        session.value = null
        // Clear cached profile data
        if (typeof window !== 'undefined') {
          localStorage.removeItem('prysm_user_profile')
        }
      } else if (newSession) {
        // Update user and session
        session.value = newSession
        user.value = newSession.user
        
        // Fetch profile when user signs in
        if (event === 'SIGNED_IN' && newSession.user) {
          await fetchUserProfile(newSession.user.id)
        }
        // On TOKEN_REFRESHED, keep the existing user data
        // and only refresh the profile if it's missing
        else if (event === 'TOKEN_REFRESHED' && newSession.user) {
          const currentUser = user.value as any
          if (!currentUser?.total_points) {
            await fetchUserProfile(newSession.user.id)
          }
        }
      }
    })

    // Handle page visibility changes to refresh session when tab becomes visible
    if (typeof document !== 'undefined') {
      let isRefreshing = false
      document.addEventListener('visibilitychange', async () => {
        if (!document.hidden && session.value && !isRefreshing) {
          isRefreshing = true
          try {
            // Refresh session silently
            const { data, error } = await $supabase.auth.refreshSession()
            if (!error && data.session) {
              session.value = data.session
              // Optionally refetch user profile to get latest data
              const currentUser = user.value as any
              if (currentUser?.id) {
                await fetchUserProfile(currentUser.id)
              }
            }
          } catch (err) {
            console.error('Error refreshing session:', err)
            // If session refresh fails, check if session is still valid
            const { data: { session: currentSession } } = await $supabase.auth.getSession()
            if (!currentSession) {
              console.log('Session lost after refresh, signing out')
              user.value = null
              session.value = null
            }
          } finally {
            isRefreshing = false
          }
        }
      })
    }
  } catch (error) {
    console.error('Error initializing Supabase auth:', error)
  }
  }
})

