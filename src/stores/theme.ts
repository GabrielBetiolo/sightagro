import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const dark = ref<boolean>(localStorage.getItem('agro_theme') !== 'light')

  function toggle() {
    dark.value = !dark.value
    localStorage.setItem('agro_theme', dark.value ? 'dark' : 'light')
    applyTheme()
  }

  function applyTheme() {
    document.documentElement.setAttribute('data-theme', dark.value ? 'dark' : 'light')
  }

  applyTheme()

  return { dark, toggle, applyTheme }
})
