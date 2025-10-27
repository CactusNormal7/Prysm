<template>
  <div class="container">
    <!-- Welcome Message for Non-authenticated users -->
    <div v-if="!user" class="card welcome-card">
      <div class="card__content">
        <h1 class="welcome-title">Welcome to Prysm</h1>
        <p class="welcome-subtitle">A football prediction platform based on points</p>
        <div class="welcome-actions">
          <NuxtLink to="/login" class="btn btn--primary">Sign In</NuxtLink>
          <NuxtLink to="/register" class="btn btn--secondary">Register</NuxtLink>
        </div>
      </div>
    </div>

    <!-- User Stats -->
    <div v-else class="card stats-card">
      <div class="card__header">
        <h2 class="card__title">Your Stats</h2>
      </div>
      <div class="stats__grid">
        <div class="stats__item">
          <div class="stats__value">{{ user.total_points || 100 }}</div>
          <div class="stats__label">Total Points</div>
        </div>
        <div class="stats__item">
          <div class="stats__value">{{ userStats.roomsJoined }}</div>
          <div class="stats__label">Rooms Joined</div>
        </div>
        <div class="stats__item">
          <div class="stats__value">{{ userStats.winRate }}%</div>
          <div class="stats__label">Win Rate</div>
        </div>
      </div>
    </div>

    <!-- Active Rooms -->
    <div v-if="user" class="card">
      <div class="card__header">
        <h2 class="card__title">Active Rooms</h2>
        <NuxtLink to="/rooms/create" class="btn btn--primary">
          Create Room
        </NuxtLink>
      </div>
      
      <div v-if="activeRooms.length === 0" class="empty-state">
        <p>No active rooms. Be the first to create one!</p>
      </div>
      
      <div v-else class="rooms-grid">
        <div
          v-for="room in activeRooms"
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
          <p class="room__meta">{{ formatDate(room.deadline_date) }}</p>
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

const getStatusClass = (status: string) => {
  const classes = {
    open: 'room__status--open',
    locked: 'room__status--locked',
    finished: 'room__status--finished'
  }
  return classes[status] || ''
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

