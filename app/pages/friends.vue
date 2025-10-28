<template>
  <div class="container">
    <h1 class="page-title">Friends</h1>

    <!-- Search Users -->
    <div class="card">
      <div class="card__header">
        <h2 class="card__title">Search Users</h2>
      </div>
      <div class="form__group">
        <input
          v-model="searchQuery"
          type="text"
          class="form__input"
          placeholder="Search by username or email..."
          @input="handleSearch"
        />
      </div>

      <div v-if="searchResults.length > 0" class="search-results">
        <h3 class="search-results__title">Search Results</h3>
        <div class="search-results__list">
          <div v-for="user in searchResults" :key="user.id" class="search-result-item">
            <div class="search-result-item__info">
              <p class="search-result-item__name">{{ user.username || user.email }}</p>
              <p class="search-result-item__points">{{ user.total_points }} points</p>
            </div>
            <button
              @click="sendFriendRequest(user.id)"
              class="btn btn--primary"
              :disabled="sendingRequest === user.id"
            >
              {{ sendingRequest === user.id ? 'Sending...' : 'Add Friend' }}
            </button>
          </div>
        </div>
      </div>
      <div v-else-if="searchQuery.length >= 2 && !searching && searchResults.length === 0" class="empty-state">
        <p>No users found</p>
      </div>
    </div>

    <!-- Pending Friend Requests -->
    <div class="card">
      <div class="card__header">
        <h2 class="card__title">Friend Requests</h2>
      </div>

      <div v-if="loading" class="loading-state">
        <p>Loading...</p>
      </div>

      <div v-else-if="friendRequests.received.length === 0 && friendRequests.sent.length === 0" class="empty-state">
        <p>No pending friend requests</p>
      </div>

      <div v-else>
        <!-- Received Requests -->
        <div v-if="friendRequests.received.length > 0" class="friend-requests">
          <h3 class="friend-requests__title">Received</h3>
          <div v-for="request in friendRequests.received" :key="request.id" class="friend-request">
            <div class="friend-request__info">
              <p class="friend-request__name">{{ request.user?.username || request.user?.email }}</p>
              <p class="friend-request__points">{{ request.user?.total_points }} points</p>
            </div>
            <div class="friend-request__actions">
              <button
                @click="acceptRequest(request.id)"
                class="btn btn--primary"
                :disabled="processingRequest"
              >
                Accept
              </button>
              <button
                @click="declineRequest(request.id)"
                class="btn btn--secondary"
                :disabled="processingRequest"
              >
                Decline
              </button>
            </div>
          </div>
        </div>

        <!-- Sent Requests -->
        <div v-if="friendRequests.sent.length > 0" class="friend-requests">
          <h3 class="friend-requests__title">Sent</h3>
          <div v-for="request in friendRequests.sent" :key="request.id" class="friend-request">
            <div class="friend-request__info">
              <p class="friend-request__name">{{ request.friend?.username || request.friend?.email }}</p>
              <p class="friend-request__points">{{ request.friend?.total_points }} points</p>
            </div>
            <span class="friend-request__status">Pending</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Friends List -->
    <div class="card">
      <div class="card__header">
        <h2 class="card__title">Your Friends</h2>
      </div>

      <div v-if="loadingFriends" class="loading-state">
        <p>Loading...</p>
      </div>

      <div v-else-if="friends.length === 0" class="empty-state">
        <p>You don't have any friends yet</p>
      </div>

      <div v-else class="friends-list">
        <div v-for="friendship in friends" :key="friendship.id" class="friend-card">
          <div class="friend-card__info">
            <p class="friend-card__name">{{ friendship.friend?.username || friendship.friend?.email }}</p>
            <p class="friend-card__points">{{ friendship.friend?.total_points }} points</p>
          </div>
          <NuxtLink :to="`/rooms/create?friend=${friendship.friend_id}`" class="btn btn--link">
            Invite to Room
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { user } = useAuth()
const { getFriends, searchUsers, getFriendRequests, acceptFriendRequest, declineFriendRequest, sendFriendRequest } = useFriends()

const searchQuery = ref('')
const searchResults = ref<any[]>([])
const searching = ref(false)
const sendingRequest = ref<string | null>(null)

const friendRequests = ref({ received: [] as any[], sent: [] as any[] })
const friends = ref<any[]>([])
const loading = ref(true)
const loadingFriends = ref(true)
const processingRequest = ref(false)

const handleSearch = async () => {
  if (searchQuery.value.length < 2) {
    searchResults.value = []
    return
  }

  searching.value = true
  try {
    const results = await searchUsers(searchQuery.value)
    searchResults.value = results
  } catch (error) {
    console.error('Failed to search users:', error)
  } finally {
    searching.value = false
  }
}

const sendRequest = async (friendId: string) => {
  sendingRequest.value = friendId
  try {
    await sendFriendRequest(friendId)
    await fetchFriendRequests()
    searchQuery.value = ''
    searchResults.value = []
  } catch (error) {
    console.error('Failed to send friend request:', error)
  } finally {
    sendingRequest.value = null
  }
}

const acceptRequest = async (friendshipId: string) => {
  processingRequest.value = true
  try {
    await acceptFriendRequest(friendshipId)
    await fetchFriendRequests()
    await fetchFriends()
  } catch (error) {
    console.error('Failed to accept friend request:', error)
  } finally {
    processingRequest.value = false
  }
}

const declineRequest = async (friendshipId: string) => {
  processingRequest.value = true
  try {
    await declineFriendRequest(friendshipId)
    await fetchFriendRequests()
  } catch (error) {
    console.error('Failed to decline friend request:', error)
  } finally {
    processingRequest.value = false
  }
}

const fetchFriendRequests = async () => {
  loading.value = true
  try {
    const data = await getFriendRequests()
    friendRequests.value = data
  } catch (error) {
    console.error('Failed to fetch friend requests:', error)
  } finally {
    loading.value = false
  }
}

const fetchFriends = async () => {
  loadingFriends.value = true
  try {
    friends.value = await getFriends()
  } catch (error) {
    console.error('Failed to fetch friends:', error)
  } finally {
    loadingFriends.value = false
  }
}

onMounted(async () => {
  await Promise.all([fetchFriendRequests(), fetchFriends()])
})
</script>

<style lang="scss" scoped>
@use '~/assets/scss/_variables' as *;

.search-results {
  margin-top: 20px;
  &__title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 12px;
    color: $gray-700;
  }
  &__list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}

.search-result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: $light-gray;
  border-radius: 6px;
  &__info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  &__name {
    font-weight: 600;
    color: $gray-900;
  }
  &__points {
    font-size: 14px;
    color: $gray-500;
  }
}

.friend-requests {
  margin-bottom: 24px;
  &:last-child {
    margin-bottom: 0;
  }
  &__title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 12px;
    color: $gray-700;
  }
}

.friend-request {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: $light-gray;
  border-radius: 6px;
  margin-bottom: 8px;
  &__info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  &__name {
    font-weight: 600;
    color: $gray-900;
  }
  &__points {
    font-size: 14px;
    color: $gray-500;
  }
  &__actions {
    display: flex;
    gap: 8px;
  }
  &__status {
    color: $gray-600;
    font-size: 14px;
  }
}

.friends-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.friend-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: $light-gray;
  border-radius: 6px;
  &__info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  &__name {
    font-weight: 600;
    color: $gray-900;
  }
  &__points {
    font-size: 14px;
    color: $gray-500;
  }
}
</style>

