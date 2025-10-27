<template>
  <div class="container">
    <h1 class="page-title">Friends</h1>

    <div class="card">
      <div class="coming-soon">
        <h2>Coming Soon</h2>
        <p>The friends feature will allow you to connect with other players, see their stats, and invite them to private rooms.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})
</script>

