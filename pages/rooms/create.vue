<template>
  <div class="max-w-2xl mx-auto py-6 sm:px-6 lg:px-8">
    <div class="bg-white shadow sm:rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <h3 class="text-lg leading-6 font-medium text-gray-900 mb-6">Create a Room</h3>

        <form @submit.prevent="handleSubmit">
          <div class="space-y-6">
            <!-- Room Name -->
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700">Room Name</label>
              <input
                id="name"
                v-model="form.name"
                type="text"
                required
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <!-- Description -->
            <div>
              <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                id="description"
                v-model="form.description"
                rows="3"
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <!-- Room Type -->
            <div>
              <label for="type" class="block text-sm font-medium text-gray-700">Room Type</label>
              <select
                id="type"
                v-model="form.type"
                required
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>

            <!-- Entry Fee -->
            <div>
              <label for="entry_fee" class="block text-sm font-medium text-gray-700">Entry Fee (points)</label>
              <input
                id="entry_fee"
                v-model="form.entry_fee"
                type="number"
                min="10"
                required
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <!-- Teams -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="team_home" class="block text-sm font-medium text-gray-700">Home Team</label>
                <input
                  id="team_home"
                  v-model="form.team_home"
                  type="text"
                  required
                  class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label for="team_away" class="block text-sm font-medium text-gray-700">Away Team</label>
                <input
                  id="team_away"
                  v-model="form.team_away"
                  type="text"
                  required
                  class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <!-- Match Date -->
            <div>
              <label for="match_date" class="block text-sm font-medium text-gray-700">Match Date & Time</label>
              <input
                id="match_date"
                v-model="form.match_date"
                type="datetime-local"
                required
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div v-if="error" class="mt-4 text-red-600 text-sm">{{ error }}</div>

          <div class="mt-6 flex justify-end space-x-3">
            <NuxtLink to="/rooms">
              <button type="button" class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
            </NuxtLink>
            <button
              type="submit"
              :disabled="loading"
              class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              {{ loading ? 'Creating...' : 'Create Room' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { createRoom } = useRooms()
const router = useRouter()

const loading = ref(false)
const error = ref('')

const form = ref({
  name: '',
  description: '',
  type: 'public',
  entry_fee: 10,
  team_home: '',
  team_away: '',
  match_date: ''
})

const handleSubmit = async () => {
  loading.value = true
  error.value = ''

  try {
    // Calculate deadline (same as match date for now)
    const roomData = {
      ...form.value,
      deadline_date: form.value.match_date,
      status: 'open'
    }

    const room = await createRoom(roomData)
    router.push(`/rooms/${room.id}`)
  } catch (err: any) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

