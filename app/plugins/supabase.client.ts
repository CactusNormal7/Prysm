import { createClient } from '@supabase/supabase-js'

export default defineNuxtPlugin({
  name: 'supabase',
  async setup(nuxtApp) {
    const config = useRuntimeConfig()
    
    const supabaseUrl = config.public.supabaseUrl
    const supabaseKey = config.public.supabaseKey

    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase credentials not configured. Please set SUPABASE_URL and SUPABASE_KEY in your .env file.')
    }
    
    const supabaseClient = createClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseKey || 'placeholder-key',
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
          storage: typeof window !== 'undefined' ? window.localStorage : undefined
        }
      }
    )

    return {
      provide: {
        supabase: supabaseClient,
        supabaseClient
      }
    }
  }
})

