export const useInvites = () => {
  const { user } = useAuth()

  const sendRoomInvite = async (roomId: string, inviteeId: string) => {
    if (!user.value) throw new Error('User not authenticated')

    const { data, error } = await $fetch('/api/invites/send', {
      method: 'POST',
      body: {
        room_id: roomId,
        invitee_id: inviteeId,
        inviter_id: user.value.id
      }
    })

    if (error) throw error
    return data
  }

  const acceptRoomInvite = async (inviteId: string) => {
    if (!user.value) throw new Error('User not authenticated')

    const { data, error } = await $fetch('/api/invites/accept', {
      method: 'PATCH',
      body: {
        invite_id: inviteId,
        user_id: user.value.id
      }
    })

    if (error) throw error
    return data
  }

  const declineRoomInvite = async (inviteId: string) => {
    if (!user.value) throw new Error('User not authenticated')

    const { data, error } = await $fetch('/api/invites/decline', {
      method: 'PATCH',
      body: {
        invite_id: inviteId,
        user_id: user.value.id
      }
    })

    if (error) throw error
    return data
  }

  const getRoomInvites = async () => {
    if (!user.value) throw new Error('User not authenticated')

    const response = await $fetch<any[]>('/api/invites/list', {
      query: {
        user_id: user.value.id
      }
    })

    return response
  }

  const deleteRoomInvite = async (inviteId: string) => {
    if (!user.value) throw new Error('User not authenticated')

    const { data, error } = await $fetch('/api/invites/delete', {
      method: 'DELETE',
      query: {
        invite_id: inviteId,
        user_id: user.value.id
      }
    })

    if (error) throw error
    return data
  }

  return {
    sendRoomInvite,
    acceptRoomInvite,
    declineRoomInvite,
    getRoomInvites,
    deleteRoomInvite
  }
}
