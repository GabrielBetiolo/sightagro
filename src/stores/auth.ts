import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../composables/useApi'
import router from '../router'

export interface User {
  id: number
  name: string
  email: string
  role: string
  avatar?: string
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('agro_token'))
  const user = ref<User | null>(JSON.parse(localStorage.getItem('agro_user') || 'null'))

  const isAuthenticated = computed(() => !!token.value)

  async function login(email: string, password: string) {
    const data = await api.post('/auth/login', { email, password })
    token.value = data.token
    user.value = data.user
    localStorage.setItem('agro_token', data.token)
    localStorage.setItem('agro_user', JSON.stringify(data.user))
    router.push('/dashboard')
  }

  async function register(name: string, email: string, password: string) {
    const data = await api.post('/auth/register', { name, email, password })
    token.value = data.token
    user.value = data.user
    localStorage.setItem('agro_token', data.token)
    localStorage.setItem('agro_user', JSON.stringify(data.user))
    router.push('/dashboard')
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('agro_token')
    localStorage.removeItem('agro_user')
    router.push('/login')
  }

  async function fetchMe() {
    if (!token.value) return
    try {
      const data = await api.get('/auth/me')
      user.value = data
      localStorage.setItem('agro_user', JSON.stringify(data))
    } catch {
      logout()
    }
  }

  return { token, user, isAuthenticated, login, register, logout, fetchMe }
})