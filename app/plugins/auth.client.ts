export default defineNuxtPlugin(async () => {
  const { $supabase } = useNuxtApp()
  const user = useState('supabase_user')
  const session = useState('supabase_session')

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
})

