import { onBeforeUnmount } from 'vue'
import { useSupabaseClient } from './useSupabase'

export const useRealtime = () => {
  const supabase = useNuxtApp().$supabase

  if (!supabase) {
    throw new Error('Supabase client is not initialized')
  }

  const activeChannels: any[] = []

  const subscribe = (channel: any) => {
    activeChannels.push(channel)
    return channel
  }

  const subscribeToRoomUpdates = (roomId: string, callback: (payload: any) => void) => {
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        callback
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_participants', filter: `room_id=eq.${roomId}` },
        callback
      )
      .subscribe()

    return subscribe(channel)
  }

  const subscribeToScoreUpdates = (roomId: string, callback: (payload: any) => void) => {
    const channel = supabase
      .channel(`room-score-${roomId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          if (payload.new.result_home !== payload.old.result_home ||
              payload.new.result_away !== payload.old.result_away) {
            callback(payload)
          }
        }
      )
      .subscribe()

    return subscribe(channel)
  }

  const subscribeToUserUpdates = (userId: string, callback: (payload: any) => void) => {
    const channel = supabase
      .channel(`user-${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${userId}` },
        callback
      )
      .subscribe()

    return subscribe(channel)
  }

  const subscribeToFriendshipUpdates = (userId: string, callback: (payload: any) => void) => {
    const channel = supabase
      .channel(`friendships-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'friendships', filter: `user_id=eq.${userId}` },
        callback
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'friendships', filter: `friend_id=eq.${userId}` },
        callback
      )
      .subscribe()

    return subscribe(channel)
  }

  const subscribeToInviteUpdates = (userId: string, callback: (payload: any) => void) => {
    const channel = supabase
      .channel(`invites-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_invites', filter: `invitee_id=eq.${userId}` },
        callback
      )
      .subscribe()

    return subscribe(channel)
  }

  const unsubscribe = (channel?: any) => {
    if (channel) {
      supabase.removeChannel(channel)
      const idx = activeChannels.indexOf(channel)
      if (idx > -1) activeChannels.splice(idx, 1)
    }
  }

  onBeforeUnmount(() => {
    activeChannels.forEach(ch => supabase.removeChannel(ch))
    activeChannels.length = 0
  })

  return {
    subscribeToRoomUpdates,
    subscribeToScoreUpdates,
    subscribeToUserUpdates,
    subscribeToFriendshipUpdates,
    subscribeToInviteUpdates,
    unsubscribe
  }
}