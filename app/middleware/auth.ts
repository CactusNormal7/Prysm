export default defineNuxtRouteMiddleware(async (to, from) => {
  const { user, isInitialized, initializeAuth } = useAuth()

  // Initialiser l'auth si ce n'est pas déjà fait
  if (!isInitialized.value) {
    await initializeAuth()
  }

  // Vérifier si l'utilisateur est connecté
  if (!user.value) {
    return navigateTo('/login')
  }
})