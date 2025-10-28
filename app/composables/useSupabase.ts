import { createClient } from '@supabase/supabase-js'

export const useSupabaseClient = () => {
  if (import.meta.server) {
    return null
  }

  const nuxtApp = useNuxtApp()
  const config = useRuntimeConfig()

  const client = createClient(
    config.public.supabaseUrl,
    config.public.supabaseKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  )

  nuxtApp.provide('supabase', client)
  return client
}

