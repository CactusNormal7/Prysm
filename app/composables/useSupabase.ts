export const useSupabase = () => {
  if (import.meta.server) {
    return null
  }
  
  const nuxtApp = useNuxtApp()
  const client = nuxtApp.$supabase
  
  if (!client) {
    console.warn('Supabase client is not initialized. Please check your .env file has SUPABASE_URL and SUPABASE_KEY set.')
    return null
  }
  
  return client
}

export const useSupabaseClient = () => {
  if (import.meta.server) {
    return null
  }
  
  const nuxtApp = useNuxtApp()
  const client = nuxtApp.$supabase
  
  if (!client) {
    console.warn('Supabase client is not initialized. Please check your .env file has SUPABASE_URL and SUPABASE_KEY set.')
    return null
  }
  
  return client
}

