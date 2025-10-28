import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  
  if (method !== 'DELETE') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed'
    })
  }

  const query = getQuery(event)
  const { participant_id, user_id } = query

  if (!participant_id || !user_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Participant ID and User ID are required'
    })
  }

  // Get Supabase credentials from runtime config
  const config = useRuntimeConfig()
  const supabase = createClient(
    config.public.supabaseUrl,
    config.public.supabaseKey
  )

  // Get participant details and verify room creator
  const { data: participant, error: participantError } = await supabase
    .from('room_participants')
    .select(`
      *,
      room:rooms!room_participants_room_id_fkey (
        creator_id,
        status
      ),
      user:users!room_participants_user_id_fkey (
        total_points
      )
    `)
    .eq('id', participant_id)
    .single()

  if (participantError || !participant) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Participant not found'
    })
  }

  // Check if user is the creator of the room
  if (participant.room.creator_id !== user_id) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Only room creators can ban participants'
    })
  }

  // Check if room is still open (can't ban from finished rooms)
  if (participant.room.status === 'finished') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Cannot ban participants from finished rooms'
    })
  }

  // Start a transaction to ensure data consistency
  try {
    // 1. Refund the points to the user
    const refundAmount = participant.points_bet
    const newTotalPoints = (participant.user?.total_points || 0) + refundAmount

    const { error: updateUserError } = await supabase
      .from('users')
      .update({ total_points: newTotalPoints })
      .eq('id', participant.user_id)

    if (updateUserError) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to refund points to user'
      })
    }

    // 2. Delete the participant from the room
    const { error: deleteParticipantError } = await supabase
      .from('room_participants')
      .delete()
      .eq('id', participant_id)

    if (deleteParticipantError) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to remove participant from room'
      })
    }

    return { 
      success: true, 
      message: 'Participant banned and points refunded successfully',
      refundAmount 
    }
  } catch (error) {
    console.error('Error banning participant:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to ban participant'
    })
  }
})
