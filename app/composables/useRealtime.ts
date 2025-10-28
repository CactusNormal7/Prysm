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

  const unsubscribe = (channel: any) => {
    if (channel) {
      supabase.removeChannel(channel)
    }
  }

  return {
    subscribeToRoomUpdates,
    subscribeToUserUpdates,
    unsubscribe
  }
}
