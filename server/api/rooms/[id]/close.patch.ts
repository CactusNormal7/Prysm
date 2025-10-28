import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const roomId = getRouterParam(event, 'id')
  
  if (!roomId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Room ID is required'
    })
  }

  if (method === 'PATCH') {
    const body = await readBody(event)
    const { user_id } = body

    if (!user_id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'User ID is required'
      })
    }

    // Get Supabase credentials from runtime config
    const config = useRuntimeConfig()
    const supabase = createClient(
      config.public.supabaseUrl,
      config.public.supabaseKey
    )
    
    // Verify the user is the creator of the room
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single()

    if (roomError || !room) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Room not found'
      })
    }

    if (room.creator_id !== user_id) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Only room creators can close matches'
      })
    }

    if (room.status === 'finished') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Room is already closed'
      })
    }

    if (!room.result_home || !room.result_away) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Match result must be set before closing'
      })
    }

    // Close the room
    const { data: updatedRoom, error: updateError } = await supabase
      .from('rooms')
      .update({
        status: 'finished'
      })
      .eq('id', roomId)
      .select()
      .single()

    if (updateError) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to close room'
      })
    }

    // Calculate scores for all participants
    const { data: participants, error: participantsError } = await supabase
      .from('room_participants')
      .select('*, user:users(total_points)')
      .eq('room_id', roomId)

    if (participantsError || !participants) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch participants'
      })
    }

    // Calculate points for each participant
    const participantsWithScores = participants.map((participant: any) => ({
      ...participant,
      points_earned: calculatePoints(
        { home: participant.prediction_home, away: participant.prediction_away },
        { home: room.result_home, away: room.result_away },
        participant.points_bet
      )
    }))

    // Sort by points earned (descending)
    participantsWithScores.sort((a, b) => b.points_earned - a.points_earned)

    // Update participants with scores and ranks
    for (let i = 0; i < participantsWithScores.length; i++) {
      const participant = participantsWithScores[i]
      
      await supabase
        .from('room_participants')
        .update({
          points_earned: participant.points_earned,
          rank: i + 1
        })
        .eq('id', participant.id)

      // Update user's total points
      const newTotal = (participant.user?.total_points || 0) + participant.points_earned
      await supabase
        .from('users')
        .update({ total_points: newTotal })
        .eq('id', participant.user_id)
    }

    return updatedRoom
  }

  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed'
  })
})

function calculatePoints(prediction: { home: number, away: number }, result: { home: number, away: number }, bet: number) {
  // Exact score match
  if (prediction.home === result.home && prediction.away === result.away) {
    return 100 * bet
  }

  const predictionDiff = prediction.home - prediction.away
  const resultDiff = result.home - result.away

  // Correct goal difference
  if (predictionDiff === resultDiff) {
    return 50 * bet
  }

  // Correct winner (or draw)
  const predictedWinner = predictionDiff > 0 ? 'home' : predictionDiff < 0 ? 'away' : 'draw'
  const actualWinner = resultDiff > 0 ? 'home' : resultDiff < 0 ? 'away' : 'draw'

  if (predictedWinner === actualWinner) {
    return 30 * bet
  }

  // Wrong prediction - lose bet
  return -bet
}
