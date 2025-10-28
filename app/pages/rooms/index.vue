<template>
  <div class="container">
    <div class="page-header">
      <h1 class="page-title">Rooms</h1>
      <NuxtLink to="/rooms/create" class="btn btn--primary">
        Create Room
      </NuxtLink>
    </div>

    <div class="card">
      <!-- Filters -->
      <div class="filters">
        <select v-model="filterType" class="form__input form__input--small">
          <option value="">All Types</option>
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
        
        <select v-model="filterStatus" class="form__input form__input--small">
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="locked">Locked</option>
          <option value="finished">Finished</option>
        </select>
      </div>

      <!-- Rooms List -->
      <div v-if="loading" class="loading-state">
        <p>Loading rooms...</p>
      </div>

      <div v-else-if="filteredRooms.length === 0" class="empty-state">
        <p>No rooms found. Create the first one!</p>
      </div>

      <div v-else class="rooms-grid">
        <div
          v-for="room in filteredRooms"
          :key="room.id"
          class="room__card"
          @click="navigateTo(`/rooms/${room.id}`)"
        >
          <div class="room__header">
            <h3 class="room__title">{{ room.name }}</h3>
            <span :class="getStatusClass(room.status)" class="room__status">
              {{ room.status }}
            </span>
          </div>
          <p class="room__match">{{ room.team_home }} vs {{ room.team_away }}</p>
          <p class="room__meta">Starts: {{ formatDate(room.match_date) }}</p>
          <p class="room__meta">Deadline: {{ formatDate(room.deadline_date) }}</p>
          <div class="room__footer">
            <span class="room__participants">{{ room.participants || 0 }} participants</span>
            <span class="room__fee">Entry: {{ room.entry_fee }} pts</span>
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

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    open: 'room__status--open',
    locked: 'room__status--locked',
    finished: 'room__status--finished'
  }
  return classes[status] || ''
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

