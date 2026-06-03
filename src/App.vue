<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'

const auth = useAuthStore()

onMounted(() => {
  if (auth.token) {
    auth.fetchMe()
  }
})
</script>

<template>
  <RouterView />
</template>

<style>
@import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  min-height: 100vh;
  background: #0a0f0d;
  color: #f0fdf4;
  -webkit-font-smoothing: antialiased;
}

#app { min-height: 100vh; }
</style>
