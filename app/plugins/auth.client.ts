export default defineNuxtPlugin(async () => {
  if (import.meta.server) return // Skip on server-side
  
  const { $supabase } = useNuxtApp()
  
  if (!$supabase) {
    console.warn('Supabase client not initialized. Please configure SUPABASE_URL and SUPABASE_KEY in .env')
    return
  }
  
  const user = useState('supabase_user')
  const session = useState('supabase_session')

  try {
    // Get initial session
    const { data: { session: currentSession } } = await $supabase.auth.getSession()
    
    session.value = currentSession
    user.value = currentSession?.user || null

    // Listen for auth changes
    $supabase.auth.onAuthStateChange((event, newSession) => {
      user.value = newSession?.user || null
      session.value = newSession
      
      if (event === 'SIGNED_OUT') {
        user.value = null
        session.value = null
      }
    })
  } catch (error) {
    console.error('Error initializing Supabase auth:', error)
  }
})

