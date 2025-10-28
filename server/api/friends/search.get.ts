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
  const search_term = query.q as string
  const user_id = query.user_id as string

  if (!search_term || !user_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Search term and User ID are required'
    })
  }

  if (search_term.length < 2) {
    return { users: [] }
  }

  // Get Supabase credentials from runtime config
  const config = useRuntimeConfig()
  const supabase = createClient(
    config.public.supabaseUrl,
    config.public.supabaseKey
  )

  // Search users by username or email
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .or(`username.ilike.%${search_term}%,email.ilike.%${search_term}%`)
    .neq('id', user_id)
    .limit(10)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to search users'
    })
  }

  // Get existing friendships to exclude already-friends and pending requests
  const { data: friendships } = await supabase
    .from('friendships')
    .select('friend_id, status')
    .eq('user_id', user_id)

  const friendIds = new Set(friendships?.map(f => f.friend_id) || [])
  const pendingIds = new Set(friendships?.filter(f => f.status === 'pending').map(f => f.friend_id) || [])

  // Filter out users who are already friends or have pending requests
  const filteredUsers = data?.filter(user => 
    !friendIds.has(user.id) && !pendingIds.has(user.id)
  ) || []

  return { users: filteredUsers }
})
