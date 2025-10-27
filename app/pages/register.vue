<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-header">
        <h2 class="auth-title">
          Create your Prysm account
        </h2>
      </div>
      
      <form class="auth-form" @submit.prevent="handleRegister">
        <div class="form__group">
          <label for="email-address" class="form__label">Email address</label>
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
          <label for="password" class="form__label">Password</label>
          <input
            id="password"
            v-model="password"
            name="password"
            type="password"
            autocomplete="new-password"
            required
            class="form__input"
            placeholder="Password"
          />
        </div>
        
        <div class="form__group">
          <label for="confirm-password" class="form__label">Confirm Password</label>
          <input
            id="confirm-password"
            v-model="confirmPassword"
            name="confirm-password"
            type="password"
            autocomplete="new-password"
            required
            class="form__input"
            placeholder="Confirm Password"
          />
        </div>

        <div v-if="error" class="form__error">{{ error }}</div>
        <div v-if="success" class="form__error" style="color: #10b981;">{{ success }}</div>

        <button type="submit" class="btn btn--primary btn--full">
          Create account
        </button>
      </form>

      <div class="auth-footer">
        <NuxtLink to="/login" class="auth-link">
          Already have an account? Sign in
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

const { signUp } = useAuth()
const router = useRouter()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const success = ref('')

const handleRegister = async () => {
  error.value = ''
  success.value = ''

  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }

  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters'
    return
  }

  try {
    const result = await signUp(email.value, password.value)
    
    // Check if user is already authenticated (auto-confirmed)
    if (result.session) {
      success.value = 'Account created successfully!'
      setTimeout(() => {
        router.push('/')
      }, 1000)
    } else {
      success.value = 'Account created! Redirecting to login...'
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    }
  } catch (err: any) {
    error.value = err.message
  }
}
</script>

<style lang="scss">
// Register uses the same auth styles from main.scss
</style>
