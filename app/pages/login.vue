<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="max-w-md w-full space-y-8 p-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to Prysm
        </h2>
      </div>
      <form class="mt-8 space-y-6" @submit.prevent="handleLogin">
        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="email-address" class="sr-only">Email address</label>
            <input
              id="email-address"
              v-model="email"
              name="email"
              type="email"
              autocomplete="email"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Email address"
            />
          </div>
          <div>
            <label for="password" class="sr-only">Password</label>
            <input
              id="password"
              v-model="password"
              name="password"
              type="password"
              autocomplete="current-password"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Password"
            />
          </div>
        </div>

        <div v-if="error" class="text-red-600 text-sm">{{ error }}</div>

        <div>
          <button
            type="submit"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Sign in
          </button>
        </div>

        <div class="text-center">
          <button
            type="button"
            @click="handleMagicLink"
            class="text-sm text-indigo-600 hover:text-indigo-500"
          >
            Sign in with magic link
          </button>
        </div>

        <div class="text-center">
          <NuxtLink
            to="/register"
            class="text-sm text-indigo-600 hover:text-indigo-500"
          >
            Don't have an account? Register
          </NuxtLink>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

const { signIn, signInWithMagicLink } = useAuth()
const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref('')
const magicLinkSent = ref(false)

const handleLogin = async () => {
  error.value = ''
  try {
    await signIn(email.value, password.value)
    router.push('/')
  } catch (err: any) {
    error.value = err.message
  }
}

const handleMagicLink = async () => {
  if (!email.value) {
    error.value = 'Please enter your email address'
    return
  }
  
  error.value = ''
  try {
    await signInWithMagicLink(email.value)
    magicLinkSent.value = true
  } catch (err: any) {
    error.value = err.message
  }
}
</script>

