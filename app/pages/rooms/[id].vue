<template>
  <div class="container room-detail">
    <div v-if="loading" class="loading-state">
      <p>Loading room...</p>
    </div>

    <div v-else-if="!room" class="empty-state">
      <p>Room not found</p>
    </div>

    <div v-else>
      <!-- Room Header -->
      <div class="card">
        <div class="room-detail__header">
          <div class="room-detail__title-section">
            <h1 class="room-detail__title">{{ room.name }}</h1>
            <p class="room-detail__description">{{ room.description }}</p>
          </div>
          <span :class="getStatusClass(room.status)" class="room__status">
            {{ room.status }}
          </span>
        </div>

        <div class="room-detail__info">
          <div class="room-detail__match">
            <h3 class="room__match">{{ room.team_home }} vs {{ room.team_away }}</h3>
            <p v-if="room.result_home !== null && room.result_away !== null" class="room__score">
              Score: {{ room.result_home }} - {{ room.result_away }}
            </p>
            <p class="room__meta">Match Date: {{ formatDate(room.match_date) }}</p>
            <p class="room__meta">Deadline: {{ formatDate(room.deadline_date) }}</p>
          </div>
          <div class="room-detail__stats">
            <p class="room__meta">Entry Fee: <span class="room__fee">{{ room.entry_fee }} points</span></p>
            <p class="room__meta">Participants: <span class="room__participants">{{ participants.length }}</span></p>
          </div>
        </div>
      </div>

      <!-- Access Denied for Private Rooms -->
      <div v-if="room.type === 'private' && !hasAcceptedInvite && !isCreator" class="card">
        <div class="card__header">
          <h2 class="card__title">Private Room</h2>
        </div>
        <p class="access-denied-message">
          This is a private room. You need an invitation to access it.
        </p>
      </div>

      <!-- Prediction Form (if room is open and user hasn't joined and is not creator) -->
      <div v-if="room.status === 'open' && !hasJoined && !isCreator && (room.type === 'public' || hasAcceptedInvite)" class="card">
        <div class="card__header">
          <h2 class="card__title">Make Your Prediction</h2>
        </div>
        
        <form @submit.prevent="handleJoin">
          <div class="teams-grid">
            <div class="form__group">
              <label :for="room.team_home" class="form__label">{{ room.team_home }}</label>
              <input
                :id="room.team_home"
                v-model.number="prediction.home"
                type="number"
                min="0"
                required
                class="form__input"
                placeholder="0"
              />
            </div>
            <div class="form__group">
              <label :for="room.team_away" class="form__label">{{ room.team_away }}</label>
              <input
                :id="room.team_away"
                v-model.number="prediction.away"
                type="number"
                min="0"
                required
                class="form__input"
                placeholder="0"
              />
            </div>
          </div>

          <div class="form__group">
            <label for="bet" class="form__label">Points to Bet</label>
            <input
              id="bet"
              v-model.number="pointsBet"
              type="number"
              :min="Math.min(room.entry_fee, 10)"
              :max="userPoints"
              required
              class="form__input"
              placeholder="10"
            />
            <p class="bet-hint">Available: {{ userPoints }} points</p>
          </div>

          <div v-if="joinError" class="form__error">{{ joinError }}</div>

          <button
            type="submit"
            :disabled="joinLoading"
            class="btn btn--primary btn--full"
          >
            {{ joinLoading ? 'Joining...' : 'Join Room' }}
          </button>
        </form>
      </div>

      <!-- Creator Info -->
      <div v-if="isCreator && room.status === 'open'" class="card creator-info">
        <div class="card__header">
          <h2 class="card__title">Room Creator</h2>
        </div>
        <p class="creator-message">
          As the creator of this room, you cannot join as a participant. 
          You can update the match score and manage the room.
        </p>
      </div>

      <!-- Invite Users (for creator) -->
      <div v-if="isCreator && room.status === 'open'" class="card">
        <div class="card__header">
          <h2 class="card__title">Invite Users</h2>
        </div>
        
        <div class="invite-section">
          <input
            v-model="inviteUsername"
            type="text"
            class="form__input"
            placeholder="Enter username to invite"
          />
          <button
            @click="sendInvite"
            :disabled="!inviteUsername.trim() || inviteLoading"
            class="btn btn--primary"
          >
            {{ inviteLoading ? 'Sending...' : 'Send Invite' }}
          </button>
        </div>

        <div v-if="inviteError" class="form__error">{{ inviteError }}</div>
        <div v-if="inviteSuccess" class="form__success">{{ inviteSuccess }}</div>
        <div v-if="banError" class="form__error">{{ banError }}</div>
        <div v-if="banSuccess" class="form__success">{{ banSuccess }}</div>

        <!-- Invited Users List -->
        <div v-if="invitedUsers.length > 0" class="invited-users">
          <h4 class="invited-users__title">Invited Users:</h4>
          <div class="invited-users__list">
            <div
              v-for="invite in invitedUsers"
              :key="invite.id"
              class="invited-user"
            >
              <span class="invited-user__name">{{ invite.invitee?.username }}</span>
              <div class="invited-user__actions">
                <span class="invited-user__status">{{ invite.status }}</span>
                <button
                  v-if="invite.status === 'pending'"
                  @click="deleteInvite(invite.id)"
                  class="btn btn--small btn--danger"
                  title="Delete invitation"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Score Update (for creator) -->
      <div v-if="isCreator && room.status !== 'finished'" class="card">
        <div class="card__header">
          <h2 class="card__title">Update Match Score</h2>
        </div>
        
        <div class="teams-grid">
          <div class="form__group">
            <label :for="`result-${room.team_home}`" class="form__label">{{ room.team_home }}</label>
            <input
              :id="`result-${room.team_home}`"
              v-model.number="score.home"
              type="number"
              min="0"
              required
              class="form__input"
              placeholder="0"
              @input="handleScoreChange"
            />
          </div>
          <div class="form__group">
            <label :for="`result-${room.team_away}`" class="form__label">{{ room.team_away }}</label>
            <input
              :id="`result-${room.team_away}`"
              v-model.number="score.away"
              type="number"
              min="0"
              required
              class="form__input"
              placeholder="0"
              @input="handleScoreChange"
            />
          </div>
        </div>

        <div v-if="scoreError" class="form__error">{{ scoreError }}</div>
        <div v-if="scoreLoading" class="form__info">Updating score...</div>
      </div>

      <!-- Close Match (for creator) - Always visible -->
      <div v-if="isCreator && room.status !== 'finished'" class="card">
        <div class="card__header">
          <h2 class="card__title">Close Match</h2>
        </div>
        
        <p class="card__description">
          Once you close the match, points will be distributed to participants based on their predictions.
          Current score: {{ score.home }} - {{ score.away }}
        </p>

        <div v-if="closeError" class="form__error">{{ closeError }}</div>

        <button
          @click="handleCloseMatch"
          :disabled="closeLoading"
          class="btn btn--danger btn--full"
        >
          {{ closeLoading ? 'Closing...' : 'Close Match & Distribute Points' }}
        </button>
      </div>

      <!-- Participants / Leaderboard -->
      <div class="card">
        <div class="card__header">
          <h2 class="card__title">
            {{ room.status === 'finished' ? 'Final Leaderboard' : 'Participants' }}
          </h2>
        </div>

        <div v-if="participants.length === 0" class="empty-state">
          <p>No participants yet</p>
        </div>

        <div v-else class="table-container">
          <table class="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>User</th>
                <th>Prediction</th>
                <th>Bet</th>
                <th v-if="room.status === 'finished'">Points</th>
                <th v-if="isCreator && room.status !== 'finished'">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="participant in sortedParticipants" :key="participant.id">
                <td class="rank-cell">{{ participant.rank || '-' }}</td>
                <td>{{ participant.user?.username || participant.user?.email }}</td>
                <td>{{ participant.prediction_home }} - {{ participant.prediction_away }}</td>
                <td>{{ participant.points_bet }}</td>
                <td v-if="room.status === 'finished'" :class="participant.points_earned >= 0 ? 'points-positive' : 'points-negative'">
                  {{ participant.points_earned > 0 ? '+' : '' }}{{ participant.points_earned }}
                </td>
                <td v-if="isCreator && room.status !== 'finished'" class="actions-cell">
                  <button
                    @click="banParticipantFromRoom(participant.id, participant.user?.username || participant.user?.email)"
                    :disabled="banLoading === participant.id"
                    class="btn btn--small btn--danger"
                    title="Ban participant and refund points"
                  >
                    {{ banLoading === participant.id ? 'Banning...' : 'Ban' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const router = useRouter()
const { user } = useAuth()
const { getRoom, getRoomParticipants, joinRoom, banParticipant } = useRooms()
const { sendRoomInvite, deleteRoomInvite } = useInvites()
const { subscribeToRoomUpdates, subscribeToScoreUpdates, unsubscribe } = useRealtime()
const supabase = useNuxtApp().$supabase

const roomId = route.params.id as string
const loading = ref(true)
const room = ref<any>(null)
const participants = ref<any[]>([])
const hasJoined = ref(false)
const isCreator = ref(false)
const hasAcceptedInvite = ref(false)

const prediction = ref({ home: 0, away: 0 })
const pointsBet = ref(10)
const joinLoading = ref(false)
const joinError = ref('')

const score = ref({ home: 0, away: 0 })
const scoreLoading = ref(false)
const scoreError = ref('')

const closeLoading = ref(false)
const closeError = ref('')

const userPoints = ref(100)
const realtimeChannel = ref<any>(null)

// Invite system
const inviteUsername = ref('')
const inviteLoading = ref(false)
const inviteError = ref('')
const inviteSuccess = ref('')
const invitedUsers = ref<any[]>([])

// Ban participant functionality
const banLoading = ref<string | null>(null)
const banError = ref('')
const banSuccess = ref('')

const sortedParticipants = computed(() => {
  return [...participants.value].sort((a, b) => {
    if (room.value?.status === 'finished') {
      return (b.points_earned || 0) - (a.points_earned || 0)
    }
    return 0
  })
})

const hasParticipants = computed(() => {
  return participants.value.length > 0
})

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

const getStatusClass = (status: string) => {
  const classes: { [key: string]: string } = {
    open: 'room__status--open',
    locked: 'room__status--locked',
    finished: 'room__status--finished'
  }
  return classes[status] || ''
}

const handleJoin = async () => {
  joinLoading.value = true
  joinError.value = ''

  try {
    await joinRoom(roomId, prediction.value, pointsBet.value)
    await fetchParticipants()
    hasJoined.value = true
  } catch (err: any) {
    joinError.value = err.message
  } finally {
    joinLoading.value = false
  }
}

const handleScoreChange = async () => {
  if (!user.value) return
  
  await handleUpdateScore()
}

const handleUpdateScore = async () => {
  if (!user.value) return
  
  // scoreLoading.value = true
  scoreError.value = ''

  try {
    const response = await $fetch(`/api/rooms/${roomId}/score`, {
      method: 'PATCH',
      body: {
        result_home: score.value.home,
        result_away: score.value.away
      }
    })
    
    // Update local state
    room.value = { ...room.value, ...response }
  } catch (err: any) {
    scoreError.value = err.data?.statusMessage || err.message || 'Failed to update score'
  } finally {
    scoreLoading.value = false
  }
}

const handleCloseMatch = async () => {
  if (!user.value) return
  
  closeLoading.value = true
  closeError.value = ''

  try {
    // Ensure score is set (use current values or default to 0-0)
    const finalScore = {
      home: score.value.home ?? 0,
      away: score.value.away ?? 0
    }
    
    // First update the score if needed
    if (room.value.result_home === null || room.value.result_away === null) {
      await $fetch(`/api/rooms/${roomId}/score`, {
        method: 'PATCH',
        body: {
          result_home: finalScore.home,
          result_away: finalScore.away
        }
      })
    }
    
    // Then close the match
    const response = await $fetch(`/api/rooms/${roomId}/close`, {
      method: 'PATCH',
      body: {
        user_id: user.value.id
      }
    })
    
    // Update local state
    room.value = { ...room.value, ...response }
    await fetchParticipants()
  } catch (err: any) {
    closeError.value = err.data?.statusMessage || err.message || 'Failed to close match'
  } finally {
    closeLoading.value = false
  }
}

const sendInvite = async () => {
  const username = inviteUsername.value.trim()
  if (!username || !user.value) return

  inviteLoading.value = true
  inviteError.value = ''
  inviteSuccess.value = ''

  try {
    // Search for user by exact username
    const response = await $fetch('/api/friends/search', {
      query: {
        q: username,
        user_id: user.value.id
      }
    })

    const users = response.users || []
    if (users.length === 0) {
      inviteError.value = `User "${username}" not found`
      return
    }

    const targetUser = users.find((u: any) => u.username === username)
    if (!targetUser) {
      inviteError.value = `User "${username}" not found`
      return
    }

    // Check if user is already a participant
    const isAlreadyParticipant = participants.value.some(p => p.user_id === targetUser.id)
    if (isAlreadyParticipant) {
      inviteError.value = `User "${username}" is already a participant`
      return
    }

    // Check if user is already invited
    const isAlreadyInvited = invitedUsers.value.some(invite => invite.invitee_id === targetUser.id)
    if (isAlreadyInvited) {
      inviteError.value = `User "${username}" has already been invited`
      return
    }

    // Send the invite
    await sendRoomInvite(roomId, targetUser.id)
    
    inviteSuccess.value = `Invitation sent to ${username}`
    inviteUsername.value = ''
    
    // Refresh invited users list
    await fetchInvitedUsers()
  } catch (err: any) {
    inviteError.value = err.data?.statusMessage || err.message || 'Failed to send invitation'
  } finally {
    inviteLoading.value = false
  }
}

const deleteInvite = async (inviteId: string) => {
  if (!user.value) return

  try {
    await deleteRoomInvite(inviteId)
    inviteSuccess.value = 'Invitation deleted successfully'
    inviteError.value = ''
    
    // Refresh invited users list
    await fetchInvitedUsers()
  } catch (err: any) {
    inviteError.value = err.data?.statusMessage || err.message || 'Failed to delete invitation'
  }
}

const banParticipantFromRoom = async (participantId: string, participantName: string) => {
  if (!user.value) return

  banLoading.value = participantId
  banError.value = ''
  banSuccess.value = ''

  try {
    const result = await banParticipant(participantId)
    banSuccess.value = `${participantName} has been banned and their points refunded`
    banError.value = ''
    
    // Refresh participants list
    await fetchParticipants()
    // Refresh user points
    await fetchUserPoints()
  } catch (err: any) {
    banError.value = err.data?.statusMessage || err.message || 'Failed to ban participant'
  } finally {
    banLoading.value = null
  }
}

const fetchInvitedUsers = async () => {
  if (!user.value) return

  try {
    const { data } = await supabase
      .from('room_invites')
      .select(`
        *,
        invitee:invitee_id (
          id,
          username
        )
      `)
      .eq('room_id', roomId)
      .eq('inviter_id', user.value.id)

    invitedUsers.value = data || []
  } catch (error) {
    console.error('Failed to fetch invited users:', error)
  }
}

const checkAcceptedInvite = async () => {
  if (!user.value) return

  try {
    const { data } = await supabase
      .from('room_invites')
      .select('*')
      .eq('room_id', roomId)
      .eq('invitee_id', user.value.id)
      .eq('status', 'accepted')
      .single()

    hasAcceptedInvite.value = !!data
  } catch (error) {
    console.error('Failed to check accepted invite:', error)
    hasAcceptedInvite.value = false
  }
}

const fetchRoom = async () => {
  try {
    room.value = await getRoom(roomId)
    
    if (user.value) {
      isCreator.value = room.value.creator_id === user.value.id
    }

    // Initialize score with current room values
    if (room.value) {
      score.value = {
        home: room.value.result_home || 0,
        away: room.value.result_away || 0
      }
    }
  } catch (error) {
    console.error('Failed to fetch room:', error)
  }
}

const fetchParticipants = async () => {
  try {
    const data = await getRoomParticipants(roomId)
    participants.value = data

    // Check if current user has joined
    if (user.value) {
      hasJoined.value = data.some((p: any) => p.user_id === user.value?.id)
    }
  } catch (error) {
    console.error('Failed to fetch participants:', error)
  }
}

const fetchUserPoints = async () => {
  if (!user.value) return

  try {
    const { data } = await supabase
      .from('users')
      .select('total_points')
      .eq('id', user.value.id)
      .single()

    if (data) {
      userPoints.value = data.total_points || 100
    }
  } catch (error) {
    console.error('Failed to fetch user points:', error)
  }
}

onMounted(async () => {
  await Promise.all([
    fetchRoom(),
    fetchParticipants(),
    fetchUserPoints(),
    fetchInvitedUsers(),
    checkAcceptedInvite()
  ])
  
  // Subscribe to real-time updates
  if (room.value) {
    realtimeChannel.value = subscribeToRoomUpdates(roomId, async (payload) => {
      if (payload.eventType === 'UPDATE') {
        await fetchRoom()
        await fetchParticipants()
        // Refresh user points when scores are updated
        if (payload.new.status === 'finished') {
          await fetchUserPoints()
        }
      }
    })

    // Subscribe to score updates specifically
    const scoreChannel = subscribeToScoreUpdates(roomId, (payload) => {
      // Update local score display immediately
      if (payload.new.result_home !== null && payload.new.result_away !== null) {
        score.value = {
          home: payload.new.result_home,
          away: payload.new.result_away
        }
        room.value = { ...room.value, ...payload.new }
      }
    })
    
    // Subscribe to participant updates
    const participantsChannel = supabase
      .channel(`room-participants-${roomId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'room_participants', 
          filter: `room_id=eq.${roomId}` 
        },
        async () => {
          await fetchParticipants()
        }
      )
      .subscribe()
    
    // Store all channels for cleanup
    realtimeChannel.value = [realtimeChannel.value, scoreChannel, participantsChannel]
  }
  
  loading.value = false
})

onUnmounted(() => {
  if (realtimeChannel.value) {
    if (Array.isArray(realtimeChannel.value)) {
      realtimeChannel.value.forEach(channel => unsubscribe(channel))
    } else {
      unsubscribe(realtimeChannel.value)
    }
  }
})
</script>

<style scoped>
.invite-section {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  margin-bottom: 16px;
}

.invite-section .form__input {
  flex: 1;
}

.form__success {
  background-color: #d1fae5;
  color: #065f46;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 14px;
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

.invited-user__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.invited-user__name {
  font-weight: 500;
  color: #111827;
}

.invited-user__status {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.invited-user__status.pending {
  background-color: #fef3c7;
  color: #92400e;
}

.invited-user__status.accepted {
  background-color: #d1fae5;
  color: #065f46;
}

.invited-user__status.declined {
  background-color: #fee2e2;
  color: #991b1b;
}

.invite-message {
  padding: 16px;
  background-color: #d1fae5;
  color: #065f46;
  border-radius: 6px;
  margin: 0;
  font-size: 14px;
}

.access-denied-message {
  padding: 16px;
  background-color: #fee2e2;
  color: #991b1b;
  border-radius: 6px;
  margin: 0;
  font-size: 14px;
}

.actions-cell {
  text-align: center;
  white-space: nowrap;
}

.btn--small {
  padding: 4px 8px;
  font-size: 12px;
  min-height: auto;
}

.btn--danger {
  background-color: #dc2626;
  color: white;
  border: 1px solid #dc2626;
}

.btn--danger:hover:not(:disabled) {
  background-color: #b91c1c;
  border-color: #b91c1c;
}

.btn--danger:disabled {
  background-color: #9ca3af;
  border-color: #9ca3af;
  cursor: not-allowed;
}
</style>

