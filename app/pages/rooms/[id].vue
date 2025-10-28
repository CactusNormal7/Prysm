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
            <p class="room__meta">Match Date: {{ formatDate(room.match_date) }}</p>
            <p class="room__meta">Deadline: {{ formatDate(room.deadline_date) }}</p>
          </div>
          <div class="room-detail__stats">
            <p class="room__meta">Entry Fee: <span class="room__fee">{{ room.entry_fee }} points</span></p>
            <p class="room__meta">Participants: <span class="room__participants">{{ participants.length }}</span></p>
          </div>
        </div>
      </div>

      <!-- Prediction Form (if room is open and user hasn't joined) -->
      <div v-if="room.status === 'open' && !hasJoined" class="card">
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

      <!-- Results Submission (for creator) -->
      <div v-if="isCreator && room.status !== 'finished' && hasParticipants" class="card">
        <div class="card__header">
          <h2 class="card__title">Submit Match Results</h2>
        </div>
        
        <form @submit.prevent="handleSubmitResults">
          <div class="teams-grid">
            <div class="form__group">
              <label :for="`result-${room.team_home}`" class="form__label">{{ room.team_home }}</label>
              <input
                :id="`result-${room.team_home}`"
                v-model.number="result.home"
                type="number"
                min="0"
                required
                class="form__input"
                placeholder="0"
              />
            </div>
            <div class="form__group">
              <label :for="`result-${room.team_away}`" class="form__label">{{ room.team_away }}</label>
              <input
                :id="`result-${room.team_away}`"
                v-model.number="result.away"
                type="number"
                min="0"
                required
                class="form__input"
                placeholder="0"
              />
            </div>
          </div>

          <div v-if="submitError" class="form__error">{{ submitError }}</div>

          <button
            type="submit"
            :disabled="submitLoading"
            class="btn btn--primary btn--full"
          >
            {{ submitLoading ? 'Submitting...' : 'Submit Results' }}
          </button>
        </form>
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
const { getRoom, getRoomParticipants, joinRoom, submitRoomResult } = useRooms()
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

const result = ref({ home: 0, away: 0 })
const submitLoading = ref(false)
const submitError = ref('')

const userPoints = ref(100)

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
  const classes: Record<'open' | 'locked' | 'finished', string> = {
    open: 'room__status--open',
    locked: 'room__status--locked',
    finished: 'room__status--finished'
  }
  return classes[status as keyof typeof classes] || ''
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

const handleSubmitResults = async () => {
  submitLoading.value = true
  submitError.value = ''

  try {
    await submitRoomResult(roomId, result.value)
    await fetchRoom()
    await fetchParticipants()
  } catch (err: any) {
    submitError.value = err.message
  } finally {
    submitLoading.value = false
  }
}

const fetchRoom = async () => {
  try {
    room.value = await getRoom(roomId)
    
    if (user.value) {
      isCreator.value = room.value.creator_id === user.value.id
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
  
  loading.value = false
})
</script>

