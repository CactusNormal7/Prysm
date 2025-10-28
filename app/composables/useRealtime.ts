export const useRealtime = () => {
  const supabase = useSupabaseClient()

  if (!supabase) {
    throw new Error('Supabase client is not initialized')
  }

  const subscribeToRoomUpdates = (roomId: string, callback: (payload: any) => void) => {
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_participants',
          filter: `room_id=eq.${roomId}`
        },
        callback
      )
      .subscribe()

    return channel
  }

  const subscribeToScoreUpdates = (roomId: string, callback: (payload: any) => void) => {
    const channel = supabase
      .channel(`room-score-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`
        },
        (payload) => {
          // Only trigger callback if score fields were updated
          if (payload.new.result_home !== payload.old.result_home || 
              payload.new.result_away !== payload.old.result_away) {
            callback(payload)
          }
        }
      )
      .subscribe()

    return channel
  }

  const subscribeToUserUpdates = (userId: string, callback: (payload: any) => void) => {
    const channel = supabase
      .channel(`user-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userId}`
        },
        callback
      )
      .subscribe()

    return channel
  }

  const subscribeToFriendshipUpdates = (userId: string, callback: (payload: any) => void) => {
    const channel = supabase
      .channel(`friendships-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
          filter: `friend_id=eq.${userId}`
        },
        callback
      )
      .subscribe()

    return channel
  }

  const subscribeToInviteUpdates = (userId: string, callback: (payload: any) => void) => {
    const channel = supabase
      .channel(`invites-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_invites',
          filter: `invitee_id=eq.${userId}`
        },
        callback
      )
      .subscribe()

    return channel
  }

  const unsubscribe = (channel: any) => {
    if (channel) {
      supabase.removeChannel(channel)
    }
  }

  return {
    subscribeToRoomUpdates,
    subscribeToScoreUpdates,
    subscribeToUserUpdates,
    subscribeToFriendshipUpdates,
    subscribeToInviteUpdates,
    unsubscribe
  }
}
