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

        <!-- User Invitation for Private Rooms -->
        <div v-if="form.type === 'private'" class="form__group">
          <label for="invite_username" class="form__label">Invite User</label>
          <div class="invite-section">
            <input
              id="invite_username"
              v-model="inviteUsername"
              type="text"
              class="form__input"
              placeholder="Enter exact username to invite"
            />
            <button
              type="button"
              @click="addInvite"
              :disabled="!inviteUsername.trim() || loadingInvite"
              class="btn btn--secondary btn--small"
            >
              {{ loadingInvite ? 'Adding...' : 'Add Invite' }}
            </button>
          </div>
          
          <!-- Invited Users List -->
          <div v-if="invitedUsers.length > 0" class="invited-users">
            <h4 class="invited-users__title">Invited Users:</h4>
            <div class="invited-users__list">
              <div
                v-for="user in invitedUsers"
                :key="user.id"
                class="invited-user"
              >
                <span class="invited-user__name">{{ user.username }}</span>
                <button
                  type="button"
                  @click="removeInvite(user.id)"
                  class="btn btn--danger btn--small"
                >
                  Remove
                </button>
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
const { sendRoomInvite } = useInvites()
const router = useRouter()

const loading = ref(false)
const loadingInvite = ref(false)
const error = ref('')
const inviteUsername = ref('')
const invitedUsers = ref<any[]>([])

const form = ref({
  name: '',
  description: '',
  type: 'public',
  entry_fee: 10,
  team_home: '',
  team_away: '',
  match_date: ''
})

const addInvite = async () => {
  const username = inviteUsername.value.trim()
  if (!username) return

  loadingInvite.value = true
  try {
    // Search for user by exact username
    const response = await $fetch('/api/friends/search', {
      query: {
        q: username,
        user_id: useAuth().user.value?.id
      }
    })

    const users = response.users || []
    if (users.length === 0) {
      error.value = `User "${username}" not found`
      return
    }

    const user = users.find((u: any) => u.username === username)
    if (!user) {
      error.value = `User "${username}" not found`
      return
    }

    // Check if already invited
    if (invitedUsers.value.some(u => u.id === user.id)) {
      error.value = `User "${username}" already invited`
      return
    }

    invitedUsers.value.push(user)
    inviteUsername.value = ''
    error.value = ''
  } catch (err: any) {
    error.value = err.message || 'Failed to find user'
  } finally {
    loadingInvite.value = false
  }
}

const removeInvite = (userId: string) => {
  invitedUsers.value = invitedUsers.value.filter(u => u.id !== userId)
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
    
    // Send invites to invited users for private rooms
    if (form.value.type === 'private' && invitedUsers.value.length > 0) {
      try {
        await Promise.all(
          invitedUsers.value.map(user => 
            sendRoomInvite(room.id, user.id)
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

// No need to fetch friends anymore
</script>

<style scoped>
.invite-section {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.invite-section .form__input {
  flex: 1;
}

.btn--small {
  padding: 8px 16px;
  font-size: 14px;
}

.btn--danger {
  background-color: #dc2626;
  color: white;
  border: none;
}

.btn--danger:hover {
  background-color: #b91c1c;
}

.invited-users {
  margin-top: 16px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.invited-users__title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #374151;
}

.invited-users__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.invited-user {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}

.invited-user__name {
  font-weight: 500;
  color: #111827;
}
</style>

