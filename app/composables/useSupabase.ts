export const useSupabase = () => {
  const nuxtApp = useNuxtApp()
  return nuxtApp.$supabase || null
}

export const useSupabaseClient = () => {
  const nuxtApp = useNuxtApp()
  return nuxtApp.$supabase || null
}

