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
  const { invite_id, user_id } = body

  if (!invite_id || !user_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invite ID and User ID are required'
    })
  }

  // Get Supabase credentials from runtime config
  const config = useRuntimeConfig()
  const supabase = createClient(
    config.public.supabaseUrl,
    config.public.supabaseKey
  )

  // Get the invite
  const { data: invite, error: fetchError } = await supabase
    .from('room_invites')
    .select('*, room:rooms(*)')
    .eq('id', invite_id)
    .eq('invitee_id', user_id)
    .eq('status', 'pending')
    .single()

  if (fetchError || !invite) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Room invite not found'
    })
  }

  // Check if room is still open
  if (invite.room.status !== 'open') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Room is no longer open for joining'
    })
  }

  // Check if user is already a participant
  const { data: existingParticipant } = await supabase
    .from('room_participants')
    .select('id')
    .eq('room_id', invite.room.id)
    .eq('user_id', user_id)
    .single()

  if (existingParticipant) {
    throw createError({
      statusCode: 400,
      statusMessage: 'You are already a participant in this room'
    })
  }

  // Update invite status to accepted
  const { data: updatedInvite, error: updateError } = await supabase
    .from('room_invites')
    .update({ status: 'accepted' })
    .eq('id', invite_id)
    .select()
    .single()

  if (updateError) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to accept room invite'
    })
  }

  // Add user as participant with default prediction (they can update later)
  const { error: participantError } = await supabase
    .from('room_participants')
    .insert([{
      room_id: invite.room.id,
      user_id: user_id,
      prediction_home: 0,
      prediction_away: 0,
      points_bet: invite.room.entry_fee || 10
    }])

  if (participantError) {
    console.error('Failed to add participant:', participantError)
    // Don't fail the whole operation, just log the error
  }

  return updatedInvite
})
