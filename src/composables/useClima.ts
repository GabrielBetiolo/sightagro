import { ref } from 'vue'
import { api } from './useApi'

export function useClima() {
  const clima = ref<any>(null)
  const loading = ref(false)
  const error = ref('')

  async function fetchClima(fazendaId: number) {
    loading.value = true
    error.value = ''
    try {
      clima.value = await api.get(`/clima/fazenda/${fazendaId}`)
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  function iconeUrl(icon: string) {
    return `https://openweathermap.org/img/wn/${icon}@2x.png`
  }

  return { clima, loading, error, fetchClima, iconeUrl }
}
