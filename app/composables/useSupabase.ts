export const useSupabase = () => {
  const { $supabase } = useNuxtApp()
  return $supabase
}

export const useSupabaseClient = () => {
  const { $supabase } = useNuxtApp()
  return $supabase
}

