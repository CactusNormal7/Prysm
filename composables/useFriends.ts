export const useFriends = () => {
  const supabase = useSupabaseClient()
  const { user } = useAuth()

  const sendFriendRequest = async (friendId: string) => {
    if (!user.value) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('friendships')
      .insert([{
        user_id: user.value.id,
        friend_id: friendId,
        status: 'pending'
      }])

    if (error) throw error
    return data
  }

  const acceptFriendRequest = async (friendshipId: string) => {
    const { data, error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId)

    if (error) throw error
    return data
  }

  const getFriends = async () => {
    if (!user.value) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('friendships')
      .select('*, friend:users!friendships_friend_id_fkey(*)')
      .eq('user_id', user.value.id)
      .eq('status', 'accepted')

    if (error) throw error
    return data
  }

  return {
    sendFriendRequest,
    acceptFriendRequest,
    getFriends
  }
}

