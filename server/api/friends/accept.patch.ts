import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  
  if (method !== 'PATCH') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed'
    })
  }

  const body = await readBody(event)
  const { friendship_id, user_id } = body

  if (!friendship_id || !user_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Friendship ID and User ID are required'
    })
  }

  // Get Supabase credentials from runtime config
  const config = useRuntimeConfig()
  const supabase = createClient(
    config.public.supabaseUrl,
    config.public.supabaseKey
  )

  // Get the friendship request
  const { data: friendship, error: fetchError } = await supabase
    .from('friendships')
    .select('*')
    .eq('id', friendship_id)
    .eq('friend_id', user_id)
    .eq('status', 'pending')
    .single()

  if (fetchError || !friendship) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Friend request not found'
    })
  }

  // Update the friendship to accepted
  const { data: updatedFriendship, error: updateError } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', friendship_id)
    .select()
    .single()

  if (updateError) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to accept friend request'
    })
  }

  // Create reciprocal friendship
  const { error: reciprocalError } = await supabase
    .from('friendships')
    .insert([{
      user_id: friendship.friend_id,
      friend_id: friendship.user_id,
      status: 'accepted'
    }])

  if (reciprocalError) {
    console.error('Failed to create reciprocal friendship:', reciprocalError)
    // Don't throw error here as the main friendship was created successfully
  }

  return updatedFriendship
})
