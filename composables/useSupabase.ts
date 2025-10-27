export const useSupabase = () => {
  return useNuxtApp().$supabase
}

export const useSupabaseClient = () => {
  const supabase = useSupabase()
  return supabase.client
}

