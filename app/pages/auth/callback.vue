<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center">
      <p class="text-gray-600">Verifying your session...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

const supabase = useSupabaseClient()
const router = useRouter()
const { user, fetchUserProfile } = useAuth()

const verifying = ref(true)

onMounted(async () => {
  try {
    // Wait a bit to ensure the hash fragments are processed
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Session error:', error)
      throw error
    }
    
    if (data.session && data.session.user) {
      console.log('Session established successfully')
      // Update the user state
      user.value = data.session.user
      
      // Fetch user profile
      await fetchUserProfile()
      
      // Navigate to home
      router.push('/')
    } else {
      console.log('No session found')
      router.push('/login')
    }
  } catch (error) {
    console.error('Error verifying session:', error)
    router.push('/login')
  } finally {
    verifying.value = false
  }
})
</script>

