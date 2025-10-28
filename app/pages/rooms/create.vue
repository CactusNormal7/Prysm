<template>
  <div class="container">
    <div class="page-header">
      <h1 class="page-title">Create a Room</h1>
      <NuxtLink to="/rooms" class="btn btn--secondary">
        Back to Rooms
      </NuxtLink>
    </div>

    <div class="card">
      <form @submit.prevent="handleSubmit">
        <!-- Room Name -->
        <div class="form__group">
          <label for="name" class="form__label">Room Name</label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            required
            class="form__input"
            placeholder="Enter room name"
          />
        </div>

        <!-- Description -->
        <div class="form__group">
          <label for="description" class="form__label">Description</label>
          <textarea
            id="description"
            v-model="form.description"
            rows="3"
            class="form__input form__textarea"
            placeholder="Enter room description"
          />
        </div>

        <!-- Room Type -->
        <div class="form__group">
          <label for="type" class="form__label">Room Type</label>
          <select
            id="type"
            v-model="form.type"
            required
            class="form__input"
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>

        <!-- Friend Selection for Private Rooms -->
        <div v-if="form.type === 'private'" class="form__group">
          <label class="form__label">Invite Friends</label>
          <div class="friends-selector">
            <div v-if="friends.length === 0" class="friends-selector__empty">
              <p>No friends yet. <NuxtLink to="/friends">Add some friends</NuxtLink> to invite them to private rooms.</p>
            </div>
            <div v-else class="friends-selector__list">
              <div
                v-for="friend in friends"
                :key="friend.id"
                class="friend-option"
                :class="{ 'friend-option--selected': selectedFriends.includes(friend.id) }"
                @click="toggleFriend(friend.id)"
              >
                <div class="friend-option__avatar">
                  {{ friend.username.charAt(0).toUpperCase() }}
                </div>
                <div class="friend-option__info">
                  <div class="friend-option__name">{{ friend.username }}</div>
                  <div class="friend-option__points">{{ friend.total_points || 0 }} pts</div>
                </div>
                <div class="friend-option__checkbox">
                  <input
                    type="checkbox"
                    :checked="selectedFriends.includes(friend.id)"
                    @change="toggleFriend(friend.id)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Entry Fee -->
        <div class="form__group">
          <label for="entry_fee" class="form__label">Entry Fee (points)</label>
          <input
            id="entry_fee"
            v-model.number="form.entry_fee"
            type="number"
            min="10"
            required
            class="form__input"
            placeholder="Minimum 10 points"
          />
        </div>

        <!-- Teams -->
        <div class="teams-grid">
          <div class="form__group">
            <label for="team_home" class="form__label">Home Team</label>
            <input
              id="team_home"
              v-model="form.team_home"
              type="text"
              required
              class="form__input"
              placeholder="Home team name"
            />
          </div>
          <div class="form__group">
            <label for="team_away" class="form__label">Away Team</label>
            <input
              id="team_away"
              v-model="form.team_away"
              type="text"
              required
              class="form__input"
              placeholder="Away team name"
            />
          </div>
        </div>

        <!-- Match Date -->
        <div class="form__group">
          <label for="match_date" class="form__label">Match Date & Time</label>
          <input
            id="match_date"
            v-model="form.match_date"
            type="datetime-local"
            required
            class="form__input"
          />
        </div>

        <div v-if="error" class="form__error">{{ error }}</div>

        <div class="form-actions">
          <NuxtLink to="/rooms" class="btn btn--secondary">
            Cancel
          </NuxtLink>
          <button
            type="submit"
            :disabled="loading"
            class="btn btn--primary"
          >
            {{ loading ? 'Creating...' : 'Create Room' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { createRoom } = useRooms()
const { getFriends } = useFriends()
const { sendRoomInvite } = useInvites()
const router = useRouter()

const loading = ref(false)
const error = ref('')
const friends = ref<any[]>([])
const selectedFriends = ref<string[]>([])

const form = ref({
  name: '',
  description: '',
  type: 'public',
  entry_fee: 10,
  team_home: '',
  team_away: '',
  match_date: ''
})

const toggleFriend = (friendId: string) => {
  const index = selectedFriends.value.indexOf(friendId)
  if (index > -1) {
    selectedFriends.value.splice(index, 1)
  } else {
    selectedFriends.value.push(friendId)
  }
}

const fetchFriends = async () => {
  try {
    const friendsData = await getFriends()
    friends.value = friendsData || []
  } catch (err) {
    console.error('Failed to fetch friends:', err)
  }
}

const handleSubmit = async () => {
  loading.value = true
  error.value = ''

  try {
    // Calculate deadline (same as match date for now)
    const roomData = {
      ...form.value,
      deadline_date: form.value.match_date,
      status: 'open'
    }

    const room = await createRoom(roomData)
    
    // Send invites to selected friends for private rooms
    if (form.value.type === 'private' && selectedFriends.value.length > 0) {
      try {
        await Promise.all(
          selectedFriends.value.map(friendId => 
            sendRoomInvite(room.id, friendId)
          )
        )
      } catch (inviteErr) {
        console.error('Failed to send some invites:', inviteErr)
        // Don't fail the whole operation if invites fail
      }
    }
    
    router.push(`/rooms/${room.id}`)
  } catch (err: any) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchFriends()
})
</script>

<style scoped>
.friends-selector {
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 12px;
  background: var(--light-gray);
}

.friends-selector__empty {
  text-align: center;
  color: var(--gray-500);
  font-size: 14px;
}

.friends-selector__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.friend-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.friend-option:hover {
  background-color: var(--white);
}

.friend-option--selected {
  background-color: var(--white);
  border: 1px solid var(--primary-color);
}

.friend-option__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

.friend-option__info {
  flex: 1;
}

.friend-option__name {
  font-weight: 500;
  color: var(--gray-900);
  font-size: 14px;
}

.friend-option__points {
  font-size: 12px;
  color: var(--gray-500);
}

.friend-option__checkbox {
  margin-left: auto;
}
</style>

