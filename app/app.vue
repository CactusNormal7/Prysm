<template>
  <NuxtLayout>
    <NuxtPage />
    <NuxtRouteAnnouncer />
  </NuxtLayout>
</template>

<script setup lang="ts">
// Add global error handler for session issues
if (import.meta.client) {
  // Handle visibility changes globally
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      // When tab becomes visible, check session
      const nuxtApp = useNuxtApp()
      const { user } = useAuth()
      
      // If we have a user but no profile data, something went wrong
      if (user.value && !user.value.total_points && user.value.id) {
        // Silently try to restore the profile
        const supabase = useSupabaseClient()
        if (supabase) {
          supabase
            .from('users')
            .select('*')
            .eq('id', user.value.id)
            .single()
            .then(({ data, error }) => {
              if (!error && data) {
                user.value = { ...user.value, ...data }
              }
            })
            .catch(() => {
              // Silently fail, this is just a recovery attempt
            })
        }
      }
    }
  })
}
</script>

<style lang="scss">
@use './assets/scss/main' as *;
</style>
