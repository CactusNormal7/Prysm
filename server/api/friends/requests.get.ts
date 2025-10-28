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

  // Get pending friend requests (received)
  const { data: receivedRequests, error: receivedError } = await supabase
    .from('friendships')
    .select('*, user:users!friendships_user_id_fkey(*)')
    .eq('friend_id', user_id)
    .eq('status', 'pending')

  if (receivedError) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch received friend requests'
    })
  }

  // Get pending friend requests (sent)
  const { data: sentRequests, error: sentError } = await supabase
    .from('friendships')
    .select('*, friend:users!friendships_friend_id_fkey(*)')
    .eq('user_id', user_id)
    .eq('status', 'pending')

  if (sentError) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch sent friend requests'
    })
  }

  return {
    received: receivedRequests || [],
    sent: sentRequests || []
  }
})
