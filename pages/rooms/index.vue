<template>
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <div class="px-4 py-5 sm:px-6">
      <div class="flex justify-between items-center">
        <h1 class="text-3xl font-bold text-gray-900">Rooms</h1>
        <NuxtLink to="/rooms/create">
          <button class="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">
            Create Room
          </button>
        </NuxtLink>
      </div>

      <!-- Filters -->
      <div class="mt-4 flex space-x-4">
        <select v-model="filterType" class="border border-gray-300 rounded-md px-3 py-2 text-sm">
          <option value="">All Types</option>
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
        
        <select v-model="filterStatus" class="border border-gray-300 rounded-md px-3 py-2 text-sm">
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="locked">Locked</option>
          <option value="finished">Finished</option>
        </select>
      </div>
    </div>

    <!-- Rooms List -->
    <div v-if="loading" class="text-center py-12">
      Loading rooms...
    </div>

    <div v-else-if="rooms.length === 0" class="text-center py-12 text-gray-500">
      No rooms found. Create the first one!
    </div>

    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="room in filteredRooms"
        :key="room.id"
        class="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
        @click="navigateTo(`/rooms/${room.id}`)"
      >
        <div class="flex justify-between items-start">
          <h3 class="text-lg font-semibold text-gray-900">{{ room.name }}</h3>
          <span :class="getStatusBadgeClass(room.status)" class="px-2 py-1 text-xs rounded-full">
            {{ room.status }}
          </span>
        </div>
        <p class="text-sm text-gray-600 mt-2">{{ room.team_home }} vs {{ room.team_away }}</p>
        <p class="text-xs text-gray-400 mt-2">Starts: {{ formatDate(room.match_date) }}</p>
        <p class="text-xs text-gray-400">Deadline: {{ formatDate(room.deadline_date) }}</p>
        <div class="mt-4 flex justify-between items-center">
          <span class="text-sm font-medium text-indigo-600">{{ room.participants || 0 }} participants</span>
          <span class="text-sm text-gray-500">Entry: {{ room.entry_fee }} pts</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { getRooms } = useRooms()

const filterType = ref('')
const filterStatus = ref('')
const loading = ref(true)
const rooms = ref<any[]>([])

const filteredRooms = computed(() => {
  let filtered = rooms.value

  if (filterType.value) {
    filtered = filtered.filter(room => room.type === filterType.value)
  }

  if (filterStatus.value) {
    filtered = filtered.filter(room => room.status === filterStatus.value)
  }

  return filtered
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

onMounted(async () => {
  try {
    rooms.value = await getRooms()
  } catch (error) {
    console.error('Failed to fetch rooms:', error)
  } finally {
    loading.value = false
  }
})
</script>

