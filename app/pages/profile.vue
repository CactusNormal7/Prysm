<template>
  <div class="container profile-container">
    <h1 class="page-title">Profile</h1>

    <div v-if="loading" class="loading-state">
      <p>Loading profile...</p>
    </div>

    <div v-else>
      <div class="card">
        <div class="card__header">
          <h2 class="card__title">Your Profile</h2>
        </div>

        <div class="stats__grid">
          <div class="stats__item">
            <p class="stats__label">Total Points</p>
            <p class="stats__value">{{ user?.total_points || 100 }}</p>
          </div>
          <div class="stats__item">
            <p class="stats__label">Rooms Joined</p>
            <p class="stats__value">{{ stats.roomsJoined }}</p>
          </div>
        </div>

        <div class="profile-info">
          <div class="form__group">
            <label class="form__label">Email</label>
            <p class="form__value">{{ user?.email }}</p>
          </div>

          <div class="form__group">
            <label class="form__label">Username</label>
            <p class="form__value">{{ user?.username || 'Not set' }}</p>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card__header">
          <h2 class="card__title">Recent Activity</h2>
        </div>
        <div class="coming-soon">
          <p>Activity history coming soon...</p>
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
const supabase = useNuxtApp().$supabase

const loading = ref(true)
const stats = ref({ roomsJoined: 0 })

onMounted(async () => {
  // TODO: Fetch user stats
  loading.value = false
})
</script>

