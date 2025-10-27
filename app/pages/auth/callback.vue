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

onMounted(async () => {
  try {
    const { data, error } = await supabase.auth.getSession()
    
    if (error) throw error
    
    if (data.session) {
      router.push('/')
    } else {
      router.push('/login')
    }
  } catch (error) {
    console.error('Error verifying session:', error)
    router.push('/login')
  }
})
</script>

