import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  
  if (method !== 'GET') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed'
    })
  }

  const query = getQuery(event)
  const user_id = query.user_id as string

  if (!user_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'User ID is required'
    })
  }

  // Get Supabase credentials from runtime config
  const config = useRuntimeConfig()
  const supabase = createClient(
    config.public.supabaseUrl,
    config.public.supabaseKey
  )

  // Get pending invites
  const { data, error } = await supabase
    .from('room_invites')
    .select('*, room:rooms(*), inviter:users!room_invites_inviter_id_fkey(*)')
    .eq('invitee_id', user_id)
    .eq('status', 'pending')

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch room invites'
    })
  }

  return data
})
