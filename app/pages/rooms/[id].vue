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

      <!-- Prediction Form (if room is open and user hasn't joined and is not creator) -->
      <div v-if="room.status === 'open' && !hasJoined && !isCreator" class="card">
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

      <!-- Close Match (for creator) -->
      <div v-if="isCreator && room.status !== 'finished' && room.result_home !== null && room.result_away !== null" class="card">
        <div class="card__header">
          <h2 class="card__title">Close Match</h2>
        </div>
        
        <p class="card__description">
          Once you close the match, points will be distributed to participants based on their predictions.
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
const { getRoom, getRoomParticipants, joinRoom } = useRooms()
const { subscribeToRoomUpdates, unsubscribe } = useRealtime()
const supabase = useSupabaseClient()

const roomId = route.params.id as string
const loading = ref(true)
const room = ref<any>(null)
const participants = ref<any[]>([])
const hasJoined = ref(false)
const isCreator = ref(false)

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

let scoreUpdateTimeout: any = null

const handleScoreChange = () => {
  if (!user.value) return
  
  // Clear existing timeout
  if (scoreUpdateTimeout) {
    clearTimeout(scoreUpdateTimeout)
  }

  // Debounce the update (wait 1 second after user stops typing)
  scoreUpdateTimeout = setTimeout(async () => {
    await handleUpdateScore()
  }, 1000)
}

const handleUpdateScore = async () => {
  if (!user.value) return
  
  scoreLoading.value = true
  scoreError.value = ''

  try {
    const response = await $fetch(`/api/rooms/${roomId}/score`, {
      method: 'PATCH',
      body: {
        result_home: score.value.home,
        result_away: score.value.away,
        user_id: user.value.id
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
    fetchUserPoints()
  ])
  
  // Subscribe to real-time updates
  if (room.value) {
    realtimeChannel.value = subscribeToRoomUpdates(roomId, (payload) => {
      if (payload.eventType === 'UPDATE') {
        fetchRoom()
        fetchParticipants()
      }
    })
  }
  
  loading.value = false
})

onUnmounted(() => {
  if (realtimeChannel.value) {
    unsubscribe(realtimeChannel.value)
  }
  if (scoreUpdateTimeout) {
    clearTimeout(scoreUpdateTimeout)
  }
})
</script>

