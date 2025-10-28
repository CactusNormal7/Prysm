<template>
  <div class="page-wrapper">
    <!-- Navigation -->
    <nav class="nav">
      <div class="nav__content">
        <NuxtLink to="/" class="nav__brand">Prysm</NuxtLink>
        <div class="nav__links">
          <NuxtLink to="/">Home</NuxtLink>
          <NuxtLink to="/rooms">Rooms</NuxtLink>
          <NuxtLink to="/friends">Friends</NuxtLink>
          <NuxtLink to="/leaderboard">Leaderboard</NuxtLink>
        </div>
        <div class="nav__user">
          <!-- Notification Bell -->
          <div v-if="user" class="notifications-dropdown" @click.stop="showNotifications = !showNotifications">
            <button class="notification-bell">
              🔔
              <span v-if="notificationCount > 0" class="notification-badge">{{ notificationCount }}</span>
            </button>
            
            <!-- Notification Panel -->
            <div v-if="showNotifications" class="notification-panel" @click.stop>
              <div class="notification-panel__header">
                <h3>Notifications</h3>
                <button @click="showNotifications = false" class="btn btn--link">Close</button>
              </div>
              
              <div class="notification-panel__content">
                <!-- Friend Requests -->
                <div v-if="friendRequests.length > 0" class="notification-section">
                  <h4 class="notification-section__title">Friend Requests</h4>
                  <div v-for="request in friendRequests" :key="request.id" class="notification-item">
                    <p class="notification-item__text">
                      {{ request.user?.username || request.user?.email }} wants to be friends
                    </p>
                    <div class="notification-item__actions">
                      <button
                        @click="acceptFriendRequest(request.id)"
                        class="btn btn--primary"
                        :disabled="processing"
                      >
                        Accept
                      </button>
                      <button
                        @click="declineFriendRequest(request.id)"
                        class="btn btn--secondary"
                        :disabled="processing"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Room Invites -->
                <div v-if="roomInvites.length > 0" class="notification-section">
                  <h4 class="notification-section__title">Room Invitations</h4>
                  <div v-for="invite in roomInvites" :key="invite.id" class="notification-item">
                    <p class="notification-item__text">
                      {{ invite.inviter?.username || invite.inviter?.email }} invited you to <strong>{{ invite.room?.name }}</strong>
                    </p>
                    <div class="notification-item__actions">
                      <button
                        @click="acceptRoomInvite(invite.id)"
                        class="btn btn--primary"
                        :disabled="processing"
                      >
                        Accept
                      </button>
                      <button
                        @click="declineRoomInvite(invite.id)"
                        class="btn btn--secondary"
                        :disabled="processing"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </div>

                <div v-if="friendRequests.length === 0 && roomInvites.length === 0" class="notification-empty">
                  <p>No notifications</p>
                </div>
              </div>
            </div>
          </div>

          <NuxtLink v-if="user && user.total_points !== undefined" to="/profile" class="btn btn--link">
            <span class="user-points">{{ user.total_points }} pts</span>
          </NuxtLink>
          <NuxtLink v-else-if="user" to="/profile" class="btn btn--link">
            <span class="user-points">Loading...</span>
          </NuxtLink>
          <NuxtLink v-else to="/login" class="btn btn--secondary">
            Sign in
          </NuxtLink>
          <button v-if="user" @click="handleSignOut" class="btn btn--link">
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
const { user, signOut } = useAuth()
const { friendRequests, roomInvites, notificationCount, fetchNotifications } = useNotifications()
const { acceptFriendRequest: acceptFriendRequestAPI, declineFriendRequest: declineFriendRequestAPI } = useFriends()
const { acceptRoomInvite: acceptRoomInviteAPI, declineRoomInvite: declineRoomInviteAPI } = useInvites()
const router = useRouter()

const showNotifications = ref(false)
const processing = ref(false)

const handleSignOut = async () => {
  await signOut()
  router.push('/login')
}

const acceptFriendRequest = async (id: string) => {
  processing.value = true
  try {
    await acceptFriendRequestAPI(id)
    await fetchNotifications()
  } catch (error) {
    console.error('Failed to accept friend request:', error)
  } finally {
    processing.value = false
  }
}

const declineFriendRequest = async (id: string) => {
  processing.value = true
  try {
    await declineFriendRequestAPI(id)
    await fetchNotifications()
  } catch (error) {
    console.error('Failed to decline friend request:', error)
  } finally {
    processing.value = false
  }
}

const acceptRoomInvite = async (id: string) => {
  processing.value = true
  try {
    await acceptRoomInviteAPI(id)
    await fetchNotifications()
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

// Close notifications when clicking outside
onMounted(() => {
  document.addEventListener('click', () => {
    showNotifications.value = false
  })
  if (user.value) {
    fetchNotifications()
  }
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
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  transition: background-color 0.2s;
}

.notification-item:hover {
  background-color: #f9fafb;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item__text {
  font-size: 13px;
  color: #374151;
  margin-bottom: 8px;
}

.notification-item__actions {
  display: flex;
  gap: 8px;
}

.notification-empty {
  padding: 24px 16px;
  text-align: center;
  color: #6b7280;
  font-size: 14px;
}
</style>

