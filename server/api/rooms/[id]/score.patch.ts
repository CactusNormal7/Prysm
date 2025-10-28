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
    const { result_home, result_away, user_id } = body

    if (typeof result_home !== 'number' || typeof result_away !== 'number') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid score values'
      })
    }

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
      .select('creator_id')
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
        statusMessage: 'Only room creators can update scores'
      })
    }

    // Update the room with new scores (but don't close it)
    const { data, error } = await supabase
      .from('rooms')
      .update({
        result_home,
        result_away
      })
      .eq('id', roomId)
      .select()
      .single()

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update room'
      })
    }

    return data
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
