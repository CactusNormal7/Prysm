<template>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
      <div class="page-wrapper">
    <!-- Navigation -->
    <nav class="nav">
      <div class="nav__content">
        <NuxtLink to="/" class="nav__brand">Prysm</NuxtLink>
        <div class="nav__links">
          <NuxtLink to="/">Home</NuxtLink>
          <NuxtLink to="/rooms">Rooms</NuxtLink>
          <NuxtLink to="/leaderboard">Leaderboard</NuxtLink>
        </div>
        <div class="nav__user">
          <!-- Notification Bell -->
          <div v-if="user && isInitialized" class="notifications-dropdown" @click.stop="showNotifications = !showNotifications">
            <button class="notification-bell">
              <i class="fa-solid fa-bell"></i>
              <span v-if="notificationCount > 0" class="notification-badge">{{ notificationCount }}</span>
            </button>
            
            <!-- Notification Panel -->
            <div v-if="showNotifications" class="notification-panel" @click.stop>
              <div class="notification-panel__header">
                <h3>Notifications</h3>
                <button @click="showNotifications = false" class="btn btn--link">Close</button>
              </div>
              
              <div class="notification-panel__content">
                <!-- Room Invites -->
                <div v-if="roomInvites.length > 0" class="notification-section">
                  <h4 class="notification-section__title">Room Invitations</h4>
                  <div v-for="invite in roomInvites" :key="invite.id" class="notification-item">
                    <div class="notification-item__content">
                      <p class="notification-item__text">
                        <strong>{{ invite.inviter?.username }}</strong> invited you to join
                      </p>
                      <p class="notification-item__room">
                        🏠 <strong>{{ invite.room?.name }}</strong>
                      </p>
                      <p class="notification-item__match">
                        {{ invite.room?.team_home }} vs {{ invite.room?.team_away }}
                      </p>
                      <p class="notification-item__details">
                        Entry: {{ invite.room?.entry_fee }} points • {{ formatDate(invite.room?.match_date) }}
                      </p>
                    </div>
                    <div class="notification-item__actions">
                      <button
                        @click="acceptRoomInvite(invite.id)"
                        class="btn btn--primary btn--small"
                        :disabled="processing"
                      >
                        Join Room
                      </button>
                      <button
                        @click="declineRoomInvite(invite.id)"
                        class="btn btn--secondary btn--small"
                        :disabled="processing"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </div>

                <div v-if="roomInvites.length === 0" class="notification-empty">
                  <p>No notifications</p>
                </div>
              </div>
            </div>
          </div>

          <!-- User Points / Profile Link -->
          <NuxtLink v-if="user && isInitialized && user.total_points !== undefined" to="/profile" class="btn btn--link">
            <span class="user-points">{{ user.total_points }} pts</span>
          </NuxtLink>
          <NuxtLink v-else-if="user && isInitialized && isLoading" to="/profile" class="btn btn--link">
            <span class="user-points">Loading...</span>
          </NuxtLink>
          <NuxtLink v-else-if="!isInitialized" to="/login" class="btn btn--secondary">
            <span>Sign in</span>
          </NuxtLink>
          <NuxtLink v-else to="/login" class="btn btn--secondary">
            Sign in
          </NuxtLink>
          
          <!-- Sign Out Button -->
          <button v-if="user && isInitialized" @click="handleSignOut" class="btn btn--link">
            Sign out
          </button>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="main-content">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const { user, signOut, isInitialized, isLoading } = useAuth()
const { roomInvites, notificationCount, fetchNotifications } = useNotifications()
const { acceptRoomInvite: acceptRoomInviteAPI, declineRoomInvite: declineRoomInviteAPI } = useInvites()
const router = useRouter()

const showNotifications = ref(false)
const processing = ref(false)
let userPointsChannel: any = null

const handleSignOut = async () => {
  await signOut()
  router.push('/login')
}

const acceptRoomInvite = async (id: string) => {
  processing.value = true
  try {
    const result = await acceptRoomInviteAPI(id)
    await fetchNotifications()
    
    // Redirect to the room if successful
    if (result && result.room_id) {
      await router.push(`/rooms/${result.room_id}`)
    }
  } catch (error) {
    console.error('Failed to accept room invite:', error)
  } finally {
    processing.value = false
  }
}

const declineRoomInvite = async (id: string) => {
  processing.value = true
  try {
    await declineRoomInviteAPI(id)
    await fetchNotifications()
  } catch (error) {
    console.error('Failed to decline room invite:', error)
  } finally {
    processing.value = false
  }
}

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Setup real-time subscription for user points
const setupUserPointsSubscription = () => {
  if (!user.value?.id) return
  
  const supabase = useNuxtApp().$supabase
  if (!supabase) return
  
  // Clean up existing subscription
  if (userPointsChannel) {
    supabase.removeChannel(userPointsChannel)
  }
  
  userPointsChannel = supabase
    .channel(`user-points-${user.value.id}`)
    .on(
      'postgres_changes',
      { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'users', 
        filter: `id=eq.${user.value.id}` 
      },
      (payload) => {
        // Update user points in real-time
        if (payload.new.total_points !== undefined) {
          user.value = { ...user.value, total_points: payload.new.total_points }
        }
      }
    )
    .subscribe()
}

// Clean up subscription
const cleanupUserPointsSubscription = () => {
  if (userPointsChannel) {
    const supabase = useNuxtApp().$supabase
    if (supabase) {
      supabase.removeChannel(userPointsChannel)
    }
    userPointsChannel = null
  }
}

// Close notifications when clicking outside
onMounted(async () => {
  document.addEventListener('click', async () => {
    showNotifications.value = false
    if (user.value) {
      await fetchNotifications()
    }
  })

  // Wait for auth to be initialized
  await nextTick()
  
  if (user.value && isInitialized.value) {
    try {
      await fetchNotifications()
      setupUserPointsSubscription()
    } catch (error) {
      console.error('Error in layout onMounted:', error)
    }
  }
})

// Watch for user changes to setup/cleanup subscriptions
watch(user, (newUser, oldUser) => {
  if (newUser && isInitialized.value) {
    setupUserPointsSubscription()
  } else if (!newUser && oldUser) {
    cleanupUserPointsSubscription()
  }
}, { immediate: false })

// Watch for initialization changes
watch(isInitialized, (newValue) => {
  if (newValue && user.value) {
    setupUserPointsSubscription()
    fetchNotifications()
  }
}, { immediate: false })

// Cleanup on unmount
onUnmounted(() => {
  cleanupUserPointsSubscription()
  document.removeEventListener('click', () => {})
})
</script>

<style scoped>
.notifications-dropdown {
  position: relative;
}

.notification-bell {
  position: relative;
  padding: 8px;
  border-radius: 6px;
  transition: background-color 0.2s;
  cursor: pointer;
  background: none;
  border: none;
  font-size: 20px;
}

.notification-bell:hover {
  background-color: #f3f4f6;
}

.notification-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  background-color: #ef4444;
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 16px;
  text-align: center;
  line-height: 1.2;
}

.notification-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 320px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-height: 400px;
  overflow-y: auto;
}

.notification-panel__header {
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notification-panel__header h3 {
  font-weight: 600;
  color: #111827;
  font-size: 16px;
}

.notification-panel__content {
  padding: 8px 0;
}

.notification-section {
  padding: 8px 16px;
}

.notification-section__title {
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.notification-item {
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  transition: background-color 0.2s;
}

.notification-item:hover {
  background-color: #f9fafb;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item__content {
  margin-bottom: 12px;
}

.notification-item__text {
  font-size: 14px;
  color: #374151;
  margin-bottom: 4px;
}

.notification-item__room {
  font-size: 15px;
  color: #111827;
  margin-bottom: 4px;
}

.notification-item__match {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 4px;
}

.notification-item__details {
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 0;
}

.notification-item__actions {
  display: flex;
  gap: 8px;
}

.btn--small {
  padding: 6px 12px;
  font-size: 12px;
}

.notification-empty {
  padding: 24px 16px;
  text-align: center;
  color: #6b7280;
  font-size: 14px;
}
</style>

