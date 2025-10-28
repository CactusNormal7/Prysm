import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  
  if (method !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed'
    })
  }

  const body = await readBody(event)
  const { friend_id, user_id } = body

  if (!friend_id || !user_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Friend ID and User ID are required'
    })
  }

  if (friend_id === user_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Cannot send friend request to yourself'
    })
  }

  // Get Supabase credentials from runtime config
  const config = useRuntimeConfig()
  const supabase = createClient(
    config.public.supabaseUrl,
    config.public.supabaseKey
  )

  // Check if friendship already exists
  const { data: existingFriendship, error: checkError } = await supabase
    .from('friendships')
    .select('*')
    .or(`and(user_id.eq.${user_id},friend_id.eq.${friend_id}),and(user_id.eq.${friend_id},friend_id.eq.${user_id})`)
    .single()

  if (checkError && checkError.code !== 'PGRST116') {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to check existing friendship'
    })
  }

  if (existingFriendship) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Friendship already exists or request already sent'
    })
  }

  // Create friend request
  const { data, error } = await supabase
    .from('friendships')
    .insert([{
      user_id,
      friend_id,
      status: 'pending'
    }])
    .select()
    .single()

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to send friend request'
    })
  }

  return data
})
