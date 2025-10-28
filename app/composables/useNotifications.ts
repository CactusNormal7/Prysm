export const useNotifications = () => {
  const { user } = useAuth()
  const { getFriendRequests } = useFriends()
  const { getRoomInvites } = useInvites()

  const friendRequests = ref<any[]>([])
  const roomInvites = ref<any[]>([])
  const roomResults = ref<any[]>([])
  const loading = ref(false)

  const notificationCount = computed(() => {
    return friendRequests.value.length + roomInvites.value.length + roomResults.value.length
  })

  const fetchNotifications = async () => {
    if (!user.value) return
    
    loading.value = true
    try {
      const [friendData, inviteData] = await Promise.all([
        getFriendRequests(),
        getRoomInvites()
      ])
      
      friendRequests.value = friendData.received || []
      roomInvites.value = inviteData || []
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      loading.value = false
    }
  }

  const addRoomResultNotification = (roomResult: any) => {
    roomResults.value.unshift(roomResult)
  }

  const clearRoomResultNotifications = () => {
    roomResults.value = []
  }

  return {
    friendRequests,
    roomInvites,
    roomResults,
    notificationCount,
    loading,
    fetchNotifications,
    addRoomResultNotification,
    clearRoomResultNotifications
  }
}
