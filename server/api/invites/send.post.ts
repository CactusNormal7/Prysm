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
  const { room_id, invitee_id, inviter_id } = body

  if (!room_id || !invitee_id || !inviter_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Room ID, Invitee ID, and Inviter ID are required'
    })
  }

  // Get Supabase credentials from runtime config
  const config = useRuntimeConfig()
  const supabase = createClient(
    config.public.supabaseUrl,
    config.public.supabaseKey
  )

  // Verify the room is private and user is creator
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('type, creator_id')
    .eq('id', room_id)
    .single()

  if (roomError || !room) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Room not found'
    })
  }

  // Allow invites for both public and private rooms

  if (room.creator_id !== inviter_id) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Only room creators can send invites'
    })
  }

  // Check if invite already exists
  const { data: existingInvite, error: checkError } = await supabase
    .from('room_invites')
    .select('*')
    .eq('room_id', room_id)
    .eq('invitee_id', invitee_id)
    .single()

  if (checkError && checkError.code !== 'PGRST116') {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to check existing invite'
    })
  }

  if (existingInvite) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invite already sent to this user'
    })
  }

  // Create room invite
  const { data, error } = await supabase
    .from('room_invites')
    .insert([{
      room_id,
      inviter_id,
      invitee_id,
      status: 'pending'
    }])
    .select()
    .single()

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to send room invite'
    })
  }

  return data
})
