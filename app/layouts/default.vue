<template>
  <div class="page-wrapper">
    <!-- Navigation -->
    <nav class="nav">
      <div class="nav__content">
        <NuxtLink to="/" class="nav__brand">Prysm</NuxtLink>
        <div class="nav__links">
          <NuxtLink to="/">Home</NuxtLink>
          <NuxtLink to="/rooms">Rooms</NuxtLink>
          <NuxtLink to="/friends">Friends</NuxtLink>
          <NuxtLink to="/leaderboard">Leaderboard</NuxtLink>
        </div>
        <div class="nav__user">
          <NuxtLink v-if="user" to="/profile" class="btn btn--link">
            <span class="username">{{ displayName || 'Profile' }}</span>
          </NuxtLink>
          <NuxtLink v-else to="/login" class="btn btn--secondary">
            Sign in
          </NuxtLink>
          <button v-if="user" @click="handleSignOut" class="btn btn--link">
            Sign out
          </button>
        </div>
      </div>
    </nav>

    <main class="main-content">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
const { user, signOut } = useAuth()
const router = useRouter()

const displayName = computed(() => {
  const u = user?.value ?? null
  if (!u) return null
  return (u.username as string) || (u.user_metadata?.full_name as string) || (u.email as string) || null
})

const handleSignOut = async () => {
  await signOut()
  router.push('/login')
}
</script>
