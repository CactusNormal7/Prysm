export const useNotifications = () => {
  const { user } = useAuth()
  const { getRoomInvites } = useInvites()

  const roomInvites = ref<any[]>([])
  const roomResults = ref<any[]>([])
  const loading = ref(false)

  const notificationCount = computed(() => {
    return roomInvites.value.length + roomResults.value.length
  })
  
  const fetchNotifications = async () => {
    console.log('Fetching notifications')
    if (!user.value) {
      console.log('No user, skipping notifications fetch')
      return
    }

    loading.value = true
    try {
      console.log('Fetching notifications for user:', user.value.id)
      const inviteData = await getRoomInvites()
      console.log('Received invite data:', inviteData)
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
    roomInvites,
    roomResults,
    notificationCount,
    loading,
    fetchNotifications,
    addRoomResultNotification,
    clearRoomResultNotifications
  }
}
