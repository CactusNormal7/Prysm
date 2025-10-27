<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-header">
        <h2 class="auth-title">
          Sign in to Prysm
        </h2>
      </div>
      
      <form class="auth-form" @submit.prevent="handleLogin">
        <div class="form__group">
          <label for="email-address" class="form__label sr-only">Email address</label>
          <input
            id="email-address"
            v-model="email"
            name="email"
            type="email"
            autocomplete="email"
            required
            class="form__input"
            placeholder="Email address"
          />
        </div>
        
        <div class="form__group">
          <label for="password" class="form__label sr-only">Password</label>
          <input
            id="password"
            v-model="password"
            name="password"
            type="password"
            autocomplete="current-password"
            required
            class="form__input"
            placeholder="Password"
          />
        </div>

        <div v-if="error" class="form__error">{{ error }}</div>

        <button type="submit" class="btn btn--primary btn--full">
          Sign in
        </button>
      </form>

      <div class="auth-footer">
        <button type="button" @click="handleMagicLink" class="btn btn--secondary btn--full btn--link">
          Sign in with magic link
        </button>

        <NuxtLink to="/register" class="auth-link">
          Don't have an account? Register
        </NuxtLink>
      </div>
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

<style lang="scss">
// Login uses the same auth styles from main.scss
</style>
