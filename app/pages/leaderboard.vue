<template>
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <div class="px-4 py-5 sm:px-6">
      <h1 class="text-3xl font-bold text-gray-900">Leaderboard</h1>
    </div>

    <div class="bg-white shadow sm:rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <div v-if="loading" class="text-center py-12">
          Loading leaderboard...
        </div>

        <div v-else-if="leaderboard.length === 0" class="text-center py-12 text-gray-500">
          No rankings available yet
        </div>

        <div v-else>
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Points</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rooms Joined</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="(entry, index) in leaderboard" :key="entry.id">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {{ index + 1 }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ entry.username || entry.email }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 font-semibold">
                  {{ entry.total_points }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ entry.rooms_joined || 0 }}
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

const supabase = useSupabaseClient()

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

