export const useRooms = () => {
  const supabase = useNuxtApp().$supabase
  const { user } = useAuth()

  if (!supabase) {
    throw new Error('Supabase client is not initialized')
  }

  const createRoom = async (roomData: any) => {
    if (!user.value) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('rooms')
      .insert([{
        ...roomData,
        creator_id: user.value.id
      }])
      .select()
      .single()

    if (error) throw error
    return data
  }

  const joinRoom = async (roomId: string, prediction: { home: number, away: number }, pointsBet: number) => {
    if (!user.value) throw new Error('User not authenticated')

    // Check if user is the creator of this room
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('creator_id')
      .eq('id', roomId)
      .single()

    if (roomError) throw new Error('Room not found')
    if (roomData.creator_id === user.value.id) {
      throw new Error('Room creators cannot join their own rooms')
    }

    // Check if user has enough points
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('total_points')
      .eq('id', user.value.id)
      .single()

    if (userError || !userData) throw new Error('User not found')
    if (userData.total_points < pointsBet) throw new Error('Insufficient points')

    const { data, error } = await supabase
      .from('room_participants')
      .insert([{
        room_id: roomId,
        user_id: user.value.id,
        prediction_home: prediction.home,
        prediction_away: prediction.away,
        points_bet: pointsBet
      }])
      .select()
      .single()

    if (error) throw error

    // Deduct points from user
    await supabase
      .from('users')
      .update({ total_points: userData.total_points - pointsBet })
      .eq('id', user.value.id)

    return data
  }

  const submitRoomResult = async (roomId: string, result: { home: number, away: number }) => {
    if (!user.value) throw new Error('User not authenticated')

    // Update room with results
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .update({
        result_home: result.home,
        result_away: result.away,
        status: 'finished'
      })
      .eq('id', roomId)
      .select()
      .single()

    if (roomError) throw roomError

    // Get all participants
    const { data: participants, error: participantsError } = await supabase
      .from('room_participants')
      .select('*, user:users(total_points)')
      .eq('room_id', roomId)

    if (participantsError || !participants) throw participantsError

    // Calculate scores and update rankings
    const participantsWithScores = participants.map((participant: any) => ({
      ...participant,
      points_earned: calculatePoints(
        { home: participant.prediction_home, away: participant.prediction_away },
        result,
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

    return room
  }

  const getRoom = async (roomId: string) => {
    const { data, error } = await supabase
      .from('rooms')
      .select('*, creator:users!rooms_creator_id_fkey(*)')
      .eq('id', roomId)
      .single()

    if (error) throw error
    return data
  }

  const getRoomParticipants = async (roomId: string) => {
    const { data, error } = await supabase
      .from('room_participants')
      .select('*, user:users(*)')
      .eq('room_id', roomId)
      .order('joined_at', { ascending: true })

    if (error) throw error
    return data
  }

  const getRooms = async (filters?: { status?: string, type?: string }) => {
    let query = supabase
      .from('rooms')
      .select('*')

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.type) {
      query = query.eq('type', filters.type)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  const calculatePoints = (prediction: { home: number, away: number }, result: { home: number, away: number }, bet: number) => {
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

  return {
    createRoom,
    joinRoom,
    submitRoomResult,
    getRoom,
    getRoomParticipants,
    getRooms
  }
}

