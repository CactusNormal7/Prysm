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
            <p class="stats__value">{{ profile.total_points ?? 100 }}</p>
          </div>
          <div class="stats__item">
            <p class="stats__label">Rooms Joined</p>
            <p class="stats__value">{{ stats.roomsJoined }}</p>
          </div>
        </div>

        <form class="profile-info" @submit.prevent="saveProfile">
          <div class="form__group">
            <label class="form__label">Email</label>
            <p class="form__value">{{ user?.email || '—' }}</p>
          </div>

          <div class="form__group">
            <label class="form__label" for="username">Username</label>
            <input
              id="username"
              v-model="form.username"
              class="form__input"
              type="text"
              placeholder="Choose a username"
            />
            <p class="form__help" v-if="errors.username">{{ errors.username }}</p>
          </div>

          <div class="form__actions">
            <button type="submit" :disabled="saving" class="btn btn-primary">
              {{ saving ? 'Saving...' : 'Save changes' }}
            </button>
            <button type="button" class="btn" @click="resetForm" :disabled="saving">Reset</button>
            <p class="form__status" v-if="saveMessage">{{ saveMessage }}</p>
            <p class="form__error" v-if="saveError">{{ saveError }}</p>
          </div>
        </form>
      </div>

      <div class="card">
        <div class="card__header">
          <h2 class="card__title">Recent Activity</h2>
        </div>

        <div v-if="activitiesLoading" class="coming-soon">
          <p>Loading activity...</p>
        </div>

        <div v-else>
          <ul class="activity-list" v-if="activities.length">
            <li v-for="act in activities" :key="act.id" class="activity-item">
              <div class="activity-main">
                <p class="activity-text">{{ act.description }}</p>
                <p class="activity-meta">{{ formatDate(act.created_at) }}</p>
              </div>
            </li>
          </ul>

          <div v-else class="coming-soon">
            <p>No recent activity yet.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
definePageMeta({
  middleware: 'auth'
})

const { user } = useAuth()
const supabase = useSupabaseClient()

const loading = ref(true)
const saving = ref(false)
const activitiesLoading = ref(false)

const profile = reactive<{ username?: string; total_points?: number }>({
  username: undefined,
  total_points: undefined
})

const stats = reactive({ roomsJoined: 0 })
const activities = ref<Array<{ id: any; description: string; created_at: string }>>([])

const form = reactive({ username: '' })
const errors = reactive<{ username?: string }>({})
const saveMessage = ref('')
const saveError = ref('')

function validateForm() {
  errors.username = undefined
  if (!form.username || form.username.trim().length < 2) {
    errors.username = 'Username must be at least 2 characters.'
    return false
  }
  return true
}

function formatDate(ts: string | null) {
  if (!ts) return ''
  try {
    return new Date(ts).toLocaleString()
  } catch {
    return ts
  }
}

async function fetchProfile() {
  if (!user?.value?.id) return
  const { data, error } = await supabase
    .from('users')
    .select('username, total_points')
    .eq('id', user.value.id)
    .single()

  if (!error && data) {
    profile.username = data.username ?? ''
    profile.total_points = data.total_points ?? 0
    form.username = profile.username ?? ''
  } else if (error) {
    console.warn('fetchProfile error:', error)
  }
}

async function fetchStats() {
  if (!user?.value?.id) return
  const { count, error } = await supabase
    .from('room_participants')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.value.id)

  stats.roomsJoined = Number(count ?? 0)
  if (error) {
    console.warn('Failed to fetch stats', error)
  }
}

async function fetchActivities() {
  activitiesLoading.value = true
  activities.value = []
  if (!user?.value?.id) {
    activitiesLoading.value = false
    return
  }

  try {
    const { data, error } = await supabase
      .from('activities')
      .select('id, description, created_at')
      .eq('user_id', user.value.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (!error && data) {
      activities.value = data as any
      activitiesLoading.value = false
      return
    }
  } catch (err) {
  }

  try {
    const { data, error } = await supabase
      .from('room_participants')
      .select('id, room_id, prediction_home, prediction_away, joined_at')
      .eq('user_id', user.value.id)
      .order('joined_at', { ascending: false })
      .limit(10)

    if (!error && data) {
      activities.value = (data as any).map((p: any) => ({
        id: p.id,
        description: `Prediction ${p.prediction_home}-${p.prediction_away} in room ${p.room_id}`,
        created_at: p.joined_at
      }))
    } else if (error) {
      console.warn('Failed to fetch fallback activities:', error)
    }
  } catch (err) {
    console.warn('Failed to fetch activities or fallback:', err)
  } finally {
    activitiesLoading.value = false
  }
}

async function saveProfile() {
  saveMessage.value = ''
  saveError.value = ''

  if (!user?.value?.id) {
    saveError.value = 'Not authenticated.'
    return
  }
  if (!validateForm()) return

  if (!supabase) {
    saveError.value = 'Supabase client not initialized.'
    console.error('Supabase client is null')
    return
  }

  saving.value = true
  const payload = {
    id: user.value.id,
    username: form.username.trim(),
    updated_at: new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('users')
    .upsert(payload)
    .select()
    .single()

  if (error) {
    saveError.value = error.message || 'Failed to save profile.'
    console.error('Failed to upsert users:', error)
  } else {
    profile.username = data?.username ?? form.username
    saveMessage.value = 'Profile saved.'
  }
  saving.value = false
}

function resetForm() {
  form.username = profile.username ?? ''
  errors.username = undefined
  saveMessage.value = ''
  saveError.value = ''
}

onMounted(async () => {
  loading.value = true
  await fetchProfile()
  await fetchStats()
  await fetchActivities()
  loading.value = false
})
</script>

<style scoped>
/* ...existing styles... */
.profile-info {
  display: grid;
  gap: 1rem;
}
.form__input {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.form__actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.activity-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.activity-item {
  padding: 0.75rem 0;
  border-bottom: 1px solid #eee;
}
.activity-meta {
  color: #666;
  font-size: 0.85rem;
}
.form__error { color: #c00; }
.form__help { color: #c00; font-size: 0.85rem; }
</style>
