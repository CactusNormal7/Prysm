export default defineNuxtPlugin({
  name: 'auth',
  dependsOn: ['supabase'],
  async setup() {
    if (import.meta.server) return
    
    const { $supabase } = useNuxtApp()
    
    if (!$supabase) {
      console.warn('Client Supabase non initialisé')
      return
    }

    const { user, session, initializeAuth, fetchUserProfile } = useAuth()

    // Initialiser l'authentification au démarrage
    await initializeAuth()

    // Écouter les changements d'état d'authentification
    $supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('Changement d\'état auth:', event)
      
      switch (event) {
        case 'SIGNED_IN':
          if (newSession?.user) {
            session.value = newSession
            user.value = newSession.user
            
            // Récupérer le profil utilisateur
            const profile = await fetchUserProfile(newSession.user.id)
            if (profile) {
              user.value = { ...newSession.user, ...profile }
            }
          }
          break
          
        case 'SIGNED_OUT':
          user.value = null
          session.value = null
          break
          
        case 'TOKEN_REFRESHED':
          if (newSession) {
            session.value = newSession
            // Ne pas toucher à user.value pour éviter les déconnexions
          }
          break
          
        case 'USER_UPDATED':
          if (newSession?.user) {
            user.value = newSession.user
          }
          break
      }
    })
  }
})