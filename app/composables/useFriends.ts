export const useFriends = () => {
  const supabase = useSupabaseClient()
  const { user } = useAuth()

  if (!supabase) {
    throw new Error('Supabase client is not initialized')
  }

  const sendFriendRequest = async (friendId: string) => {
    if (!user.value) throw new Error('User not authenticated')

    const { data, error } = await $fetch('/api/friends/send', {
      method: 'POST',
      body: {
        friend_id: friendId,
        user_id: user.value.id
      }
    })

    if (error) throw error
    return data
  }

  const acceptFriendRequest = async (friendshipId: string) => {
    if (!user.value) throw new Error('User not authenticated')

    const { data, error } = await $fetch('/api/friends/accept', {
      method: 'PATCH',
      body: {
        friendship_id: friendshipId,
        user_id: user.value.id
      }
    })

    if (error) throw error
    return data
  }

  const declineFriendRequest = async (friendshipId: string) => {
    if (!user.value) throw new Error('User not authenticated')

    const { data, error } = await $fetch('/api/friends/decline', {
      method: 'PATCH',
      body: {
        friendship_id: friendshipId,
        user_id: user.value.id
      }
    })

    if (error) throw error
    return data
  }

  const getFriends = async () => {
    if (!user.value) throw new Error('User not authenticated')

    const { data, error } = await $fetch('/api/friends/list', {
      query: {
        user_id: user.value.id
      }
    })

    if (error) throw error
    return data
  }

  const searchUsers = async (query: string) => {
    if (!user.value) throw new Error('User not authenticated')

    const { data, error } = await $fetch('/api/friends/search', {
      query: {
        q: query,
        user_id: user.value.id
      }
    })

    if (error) throw error
    return data.users
  }

  const getFriendRequests = async () => {
    if (!user.value) throw new Error('User not authenticated')

    const { data, error } = await $fetch('/api/friends/requests', {
      query: {
        user_id: user.value.id
      }
    })

    if (error) throw error
    return data
  }

  return {
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    getFriends,
    searchUsers,
    getFriendRequests
  }
}

