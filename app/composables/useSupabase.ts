export const useSupabase = () => {
  const nuxtApp = useNuxtApp()
  return nuxtApp.$supabase
}

export const useSupabaseClient = () => {
  const nuxtApp = useNuxtApp()
  return nuxtApp.$supabase
}

