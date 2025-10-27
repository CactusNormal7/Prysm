<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navigation -->
    <nav class="bg-white shadow-lg">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <NuxtLink to="/" class="flex items-center">
              <h1 class="text-2xl font-bold text-indigo-600">Prysm</h1>
            </NuxtLink>
            <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
              <NuxtLink
                to="/"
                class="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-indigo-600"
              >
                Home
              </NuxtLink>
              <NuxtLink
                to="/rooms"
                class="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
              >
                Rooms
              </NuxtLink>
              <NuxtLink
                to="/friends"
                class="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
              >
                Friends
              </NuxtLink>
              <NuxtLink
                to="/leaderboard"
                class="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
              >
                Leaderboard
              </NuxtLink>
            </div>
          </div>
          <div class="flex items-center">
            <div v-if="user" class="flex items-center space-x-4">
              <span class="text-sm font-medium text-gray-700">
                Points: {{ user.total_points || 100 }}
              </span>
              <NuxtLink
                to="/profile"
                class="text-sm font-medium text-gray-500 hover:text-gray-900"
              >
                Profile
              </NuxtLink>
              <button
                @click="handleSignOut"
                class="text-sm font-medium text-gray-500 hover:text-gray-900"
              >
                Sign out
              </button>
            </div>
            <div v-else>
              <NuxtLink
                to="/login"
                class="text-sm font-medium text-gray-500 hover:text-gray-900"
              >
                Sign in
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main>
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const { user, signOut } = useAuth()
const router = useRouter()

const handleSignOut = async () => {
  await signOut()
  router.push('/login')
}
</script>

