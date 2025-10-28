<template>
  <div class="container">
    <h1 class="page-title">Leaderboard</h1>

    <div class="card">
      <div v-if="loading" class="loading-state">
        <p>Loading leaderboard...</p>
      </div>

      <div v-else-if="leaderboard.length === 0" class="empty-state">
        <p>No rankings available yet</p>
      </div>

      <div v-else class="table-container">
        <table class="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>User</th>
              <th>Total Points</th>
              <th>Rooms Joined</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(entry, index) in leaderboard" :key="entry.id">
              <td class="rank-cell">{{ index + 1 }}</td>
              <td>{{ entry.username || entry.email }}</td>
              <td class="points-cell">{{ entry.total_points }}</td>
              <td class="rooms-cell">{{ entry.rooms_joined || 0 }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const supabase = useNuxtApp().$supabase

const loading = ref(true)
const leaderboard = ref<any[]>([])

onMounted(async () => {
  try {
    // Get all users ordered by total points
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('total_points', { ascending: false })
      .limit(100)

    if (!error && data) {
      leaderboard.value = data
    }
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error)
  } finally {
    loading.value = false
  }
})
</script>

