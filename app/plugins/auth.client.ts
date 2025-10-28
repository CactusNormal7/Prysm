export default defineNuxtPlugin(async () => {
  if (import.meta.server) return // Skip on server-side
  
  const { $supabase } = useNuxtApp()
  
  if (!$supabase) {
    console.warn('Supabase client not initialized. Please configure SUPABASE_URL and SUPABASE_KEY in .env')
    return
  }
  
  const user = useState('supabase_user')
  const session = useState('supabase_session')

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await $supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (!error && data && user.value) {
        // Merge profile data with auth user
        user.value = { ...user.value, ...data }
      }
    } catch (err) {
      console.error('Error fetching user profile:', err)
    }
  }

  try {
    // Get initial session
    const { data: { session: currentSession } } = await $supabase.auth.getSession()
    
    session.value = currentSession
    user.value = currentSession?.user || null

    // Fetch user profile if user is authenticated
    if (user.value) {
      await fetchUserProfile(user.value.id)
    }

    // Listen for auth changes
    $supabase.auth.onAuthStateChange(async (event, newSession) => {
      user.value = newSession?.user || null
      session.value = newSession
      
      if (event === 'SIGNED_OUT') {
        user.value = null
        session.value = null
      } else if (event === 'SIGNED_IN' && user.value) {
        // Fetch profile when user signs in
        await fetchUserProfile(user.value.id)
      }
    })
  } catch (error) {
    console.error('Error initializing Supabase auth:', error)
  }
})

