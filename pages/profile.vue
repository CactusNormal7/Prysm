<template>
  <div class="max-w-2xl mx-auto py-6 sm:px-6 lg:px-8">
    <div v-if="loading" class="text-center py-12">
      Loading profile...
    </div>

    <div v-else>
      <div class="bg-white shadow sm:rounded-lg mb-6">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 mb-6">Your Profile</h3>

          <div class="grid grid-cols-2 gap-4 mb-6">
            <div class="bg-gray-50 p-4 rounded-lg">
              <p class="text-sm text-gray-500">Total Points</p>
              <p class="text-2xl font-bold text-indigo-600">{{ user?.total_points || 100 }}</p>
            </div>
            <div class="bg-gray-50 p-4 rounded-lg">
              <p class="text-sm text-gray-500">Rooms Joined</p>
              <p class="text-2xl font-bold text-indigo-600">{{ stats.roomsJoined }}</p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Email</label>
            <p class="mt-1 text-sm text-gray-900">{{ user?.email }}</p>
          </div>

          <div class="mt-4">
            <label class="block text-sm font-medium text-gray-700">Username</label>
            <p class="mt-1 text-sm text-gray-900">{{ user?.username || 'Not set' }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white shadow sm:rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Activity</h3>
          <p class="text-gray-500 text-sm">Activity history coming soon...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { user } = useAuth()
const supabase = useSupabaseClient()

const loading = ref(true)
const stats = ref({ roomsJoined: 0 })

onMounted(async () => {
  // TODO: Fetch user stats
  loading.value = false
})
</script>

