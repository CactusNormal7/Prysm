export const useAuth = () => {
  const nuxtApp = useNuxtApp()
  const supabase = nuxtApp.$supabase
  
  // État simple et réactif
  const user = useState<any>('auth_user', () => null)
  const session = useState<any>('auth_session', () => null)
  const isLoading = useState<boolean>('auth_loading', () => false)
  const isInitialized = useState<boolean>('auth_initialized', () => false)

  // Fonction pour récupérer le profil utilisateur
  const fetchUserProfile = async (userId: string) => {
    if (!supabase) return null
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error)
      return null
    }
  }

  // Initialisation simple de l'authentification
  const initializeAuth = async () => {
    if (isInitialized.value || !supabase) return
    
    try {
      isLoading.value = true
      
      // Récupérer la session actuelle
      const { data: { session: currentSession }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Erreur lors de la récupération de la session:', error)
        return
      }

      // Mettre à jour l'état
      session.value = currentSession
      user.value = currentSession?.user || null

      // Si l'utilisateur est connecté, récupérer son profil
      if (currentSession?.user) {
        const profile = await fetchUserProfile(currentSession.user.id)
        if (profile) {
          user.value = { ...currentSession.user, ...profile }
        }
      }
      
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error)
    } finally {
      isLoading.value = false
      isInitialized.value = true
    }
  }

  // Connexion
  const signIn = async (email: string, password: string) => {
    if (!supabase) throw new Error('Client Supabase non initialisé')
    
    try {
      isLoading.value = true
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      
      // Mettre à jour l'état après connexion réussie
      session.value = data.session
      user.value = data.session?.user || null
      
      // Récupérer le profil utilisateur
      if (data.session?.user) {
        const profile = await fetchUserProfile(data.session.user.id)
        if (profile) {
          user.value = { ...data.session.user, ...profile }
        }
      }
      
      return data
    } catch (error) {
      console.error('Erreur de connexion:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // Inscription
  const signUp = async (email: string, password: string) => {
    if (!supabase) throw new Error('Client Supabase non initialisé')
    
    try {
      isLoading.value = true
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: import.meta.client ? `${window.location.origin}/auth/callback` : ''
        }
      })
      
      if (error) throw error
      
      // Si l'utilisateur est automatiquement connecté
      if (data.session) {
        session.value = data.session
        user.value = data.session.user
        
        const profile = await fetchUserProfile(data.session.user.id)
        if (profile) {
          user.value = { ...data.session.user, ...profile }
        }
      }
      
      return data
    } catch (error) {
      console.error('Erreur d\'inscription:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // Déconnexion
  const signOut = async () => {
    if (!supabase) throw new Error('Client Supabase non initialisé')
    
    try {
      isLoading.value = true
      
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // Réinitialiser l'état
      user.value = null
      session.value = null
      
    } catch (error) {
      console.error('Erreur de déconnexion:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // Connexion avec magic link
  const signInWithMagicLink = async (email: string) => {
    if (!supabase) throw new Error('Client Supabase non initialisé')
    
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: import.meta.client ? `${window.location.origin}/auth/callback` : ''
        }
      })
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Erreur magic link:', error)
      throw error
    }
  }

  return {
    user,
    session,
    isLoading: readonly(isLoading),
    isInitialized: readonly(isInitialized),
    signIn,
    signUp,
    signOut,
    signInWithMagicLink,
    initializeAuth,
    fetchUserProfile
  }
}