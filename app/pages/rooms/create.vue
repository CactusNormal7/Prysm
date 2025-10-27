<template>
  <div class="container">
    <div class="page-header">
      <h1 class="page-title">Create a Room</h1>
      <NuxtLink to="/rooms" class="btn btn--secondary">
        Back to Rooms
      </NuxtLink>
    </div>

    <div class="card">
      <form @submit.prevent="handleSubmit">
        <!-- Room Name -->
        <div class="form__group">
          <label for="name" class="form__label">Room Name</label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            required
            class="form__input"
            placeholder="Enter room name"
          />
        </div>

        <!-- Description -->
        <div class="form__group">
          <label for="description" class="form__label">Description</label>
          <textarea
            id="description"
            v-model="form.description"
            rows="3"
            class="form__input form__textarea"
            placeholder="Enter room description"
          />
        </div>

        <!-- Room Type -->
        <div class="form__group">
          <label for="type" class="form__label">Room Type</label>
          <select
            id="type"
            v-model="form.type"
            required
            class="form__input"
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>

        <!-- Entry Fee -->
        <div class="form__group">
          <label for="entry_fee" class="form__label">Entry Fee (points)</label>
          <input
            id="entry_fee"
            v-model.number="form.entry_fee"
            type="number"
            min="10"
            required
            class="form__input"
            placeholder="Minimum 10 points"
          />
        </div>

        <!-- Teams -->
        <div class="teams-grid">
          <div class="form__group">
            <label for="team_home" class="form__label">Home Team</label>
            <input
              id="team_home"
              v-model="form.team_home"
              type="text"
              required
              class="form__input"
              placeholder="Home team name"
            />
          </div>
          <div class="form__group">
            <label for="team_away" class="form__label">Away Team</label>
            <input
              id="team_away"
              v-model="form.team_away"
              type="text"
              required
              class="form__input"
              placeholder="Away team name"
            />
          </div>
        </div>

        <!-- Match Date -->
        <div class="form__group">
          <label for="match_date" class="form__label">Match Date & Time</label>
          <input
            id="match_date"
            v-model="form.match_date"
            type="datetime-local"
            required
            class="form__input"
          />
        </div>

        <div v-if="error" class="form__error">{{ error }}</div>

        <div class="form-actions">
          <NuxtLink to="/rooms" class="btn btn--secondary">
            Cancel
          </NuxtLink>
          <button
            type="submit"
            :disabled="loading"
            class="btn btn--primary"
          >
            {{ loading ? 'Creating...' : 'Create Room' }}
          </button>
        </div>
      </form>
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

