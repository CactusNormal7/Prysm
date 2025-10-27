<template>
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <!-- Welcome Message for Non-authenticated users -->
    <div v-if="!user" class="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
      <div class="px-4 py-5 sm:p-6 text-center">
        <h1 class="text-3xl font-bold text-gray-900 mb-4">Welcome to Prysm</h1>
        <p class="text-gray-600 mb-6">A football prediction platform based on points</p>
        <div class="flex justify-center space-x-4">
          <NuxtLink to="/login">
            <button class="bg-indigo-600 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-indigo-700">
              Sign In
            </button>
          </NuxtLink>
          <NuxtLink to="/register">
            <button class="bg-gray-200 text-gray-700 px-6 py-3 rounded-md text-sm font-medium hover:bg-gray-300">
              Register
            </button>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- User Stats -->
    <div v-else class="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
      <div class="px-4 py-5 sm:p-6">
        <h3 class="text-lg leading-6 font-medium text-gray-900">Your Stats</h3>
        <div class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div class="bg-gray-50 overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="text-2xl font-bold text-indigo-600">{{ user.total_points || 100 }}</div>
                </div>
              </div>
              <div class="mt-2">
                <p class="text-sm font-medium text-gray-500">Total Points</p>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="text-2xl font-bold text-indigo-600">{{ userStats.roomsJoined }}</div>
                </div>
              </div>
              <div class="mt-2">
                <p class="text-sm font-medium text-gray-500">Rooms Joined</p>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="text-2xl font-bold text-indigo-600">{{ userStats.winRate }}%</div>
                </div>
              </div>
              <div class="mt-2">
                <p class="text-sm font-medium text-gray-500">Win Rate</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Active Rooms -->
    <div v-if="user" class="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
      <div class="px-4 py-5 sm:p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg leading-6 font-medium text-gray-900">Active Rooms</h3>
          <NuxtLink to="/rooms/create">
            <button class="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">
              Create Room
            </button>
          </NuxtLink>
        </div>
        
        <div v-if="activeRooms.length === 0" class="text-center py-8 text-gray-500">
          No active rooms. Be the first to create one!
        </div>
        
        <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="room in activeRooms"
            :key="room.id"
            class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            @click="navigateTo(`/rooms/${room.id}`)"
          >
            <h4 class="font-semibold text-gray-900">{{ room.name }}</h4>
            <p class="text-sm text-gray-500 mt-1">{{ room.team_home }} vs {{ room.team_away }}</p>
            <p class="text-xs text-gray-400 mt-2">{{ formatDate(room.deadline_date) }}</p>
            <p class="text-xs text-indigo-600 mt-2">{{ room.participants || 0 }} participants</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { user } = useAuth()
const supabase = useSupabaseClient()

const activeRooms = ref<any[]>([])
const configError = ref(false)

const userStats = computed(() => {
  return {
    roomsJoined: 0, // TODO: Calculate from database
    winRate: 0 // TODO: Calculate from database
  }
})

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

onMounted(async () => {
  try {
    // Fetch active rooms
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(6)

    if (!error && data) {
      activeRooms.value = data
    }
  } catch (err: any) {
    console.error('Database error:', err)
    configError.value = true
  }
})
</script>

