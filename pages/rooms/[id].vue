<template>
  <div class="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
    <div v-if="loading" class="text-center py-12">
      Loading room...
    </div>

    <div v-else-if="!room" class="text-center py-12 text-gray-500">
      Room not found
    </div>

    <div v-else>
      <!-- Room Header -->
      <div class="bg-white shadow sm:rounded-lg mb-6">
        <div class="px-4 py-5 sm:p-6">
          <div class="flex justify-between items-start">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">{{ room.name }}</h1>
              <p class="text-sm text-gray-600 mt-1">{{ room.description }}</p>
            </div>
            <span :class="getStatusBadgeClass(room.status)" class="px-3 py-1 text-sm rounded-full">
              {{ room.status }}
            </span>
          </div>

          <div class="mt-6 grid grid-cols-2 gap-4">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">{{ room.team_home }} vs {{ room.team_away }}</h3>
              <p class="text-sm text-gray-600 mt-1">Match Date: {{ formatDate(room.match_date) }}</p>
              <p class="text-sm text-gray-600">Deadline: {{ formatDate(room.deadline_date) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Entry Fee: <span class="font-semibold">{{ room.entry_fee }} points</span></p>
              <p class="text-sm text-gray-600">Participants: <span class="font-semibold">{{ participants.length }}</span></p>
            </div>
          </div>
        </div>
      </div>

      <!-- Prediction Form (if room is open and user hasn't joined) -->
      <div v-if="room.status === 'open' && !hasJoined" class="bg-white shadow sm:rounded-lg mb-6">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Make Your Prediction</h3>
          
          <form @submit.prevent="handleJoin">
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label :for="room.team_home" class="block text-sm font-medium text-gray-700">{{ room.team_home }}</label>
                <input
                  :id="room.team_home"
                  v-model.number="prediction.home"
                  type="number"
                  min="0"
                  required
                  class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label :for="room.team_away" class="block text-sm font-medium text-gray-700">{{ room.team_away }}</label>
                <input
                  :id="room.team_away"
                  v-model.number="prediction.away"
                  type="number"
                  min="0"
                  required
                  class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div class="mb-4">
              <label for="bet" class="block text-sm font-medium text-gray-700">Points to Bet</label>
              <input
                id="bet"
                v-model.number="pointsBet"
                type="number"
                :min="Math.min(room.entry_fee, 10)"
                :max="userPoints"
                required
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              <p class="mt-1 text-sm text-gray-500">Available: {{ userPoints }} points</p>
            </div>

            <div v-if="joinError" class="text-red-600 text-sm mb-4">{{ joinError }}</div>

            <button
              type="submit"
              :disabled="joinLoading"
              class="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              {{ joinLoading ? 'Joining...' : 'Join Room' }}
            </button>
          </form>
        </div>
      </div>

      <!-- Results Submission (for creator) -->
      <div v-if="isCreator && room.status !== 'finished' && hasParticipants" class="bg-white shadow sm:rounded-lg mb-6">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Submit Match Results</h3>
          
          <form @submit.prevent="handleSubmitResults">
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label :for="`result-${room.team_home}`" class="block text-sm font-medium text-gray-700">{{ room.team_home }}</label>
                <input
                  :id="`result-${room.team_home}`"
                  v-model.number="result.home"
                  type="number"
                  min="0"
                  required
                  class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label :for="`result-${room.team_away}`" class="block text-sm font-medium text-gray-700">{{ room.team_away }}</label>
                <input
                  :id="`result-${room.team_away}`"
                  v-model.number="result.away"
                  type="number"
                  min="0"
                  required
                  class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div v-if="submitError" class="text-red-600 text-sm mb-4">{{ submitError }}</div>

            <button
              type="submit"
              :disabled="submitLoading"
              class="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              {{ submitLoading ? 'Submitting...' : 'Submit Results' }}
            </button>
          </form>
        </div>
      </div>

      <!-- Participants / Leaderboard -->
      <div class="bg-white shadow sm:rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">
            {{ room.status === 'finished' ? 'Final Leaderboard' : 'Participants' }}
          </h3>

          <div v-if="participants.length === 0" class="text-center py-8 text-gray-500">
            No participants yet
          </div>

          <div v-else>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prediction</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bet</th>
                    <th v-if="room.status === 'finished'" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="participant in sortedParticipants" :key="participant.id">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {{ participant.rank || '-' }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {{ participant.user?.username || participant.user?.email }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {{ participant.prediction_home }} - {{ participant.prediction_away }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {{ participant.points_bet }}
                    </td>
                    <td v-if="room.status === 'finished'" class="px-6 py-4 whitespace-nowrap text-sm" :class="participant.points_earned >= 0 ? 'text-green-600' : 'text-red-600'">
                      {{ participant.points_earned > 0 ? '+' : '' }}{{ participant.points_earned }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
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

const getStatusBadgeClass = (status: string) => {
  const classes = {
    open: 'bg-green-100 text-green-800',
    locked: 'bg-yellow-100 text-yellow-800',
    finished: 'bg-gray-100 text-gray-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
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

