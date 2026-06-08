import { ref } from 'vue'
import { api } from './useApi'

export function usePush() {
  const subscribed = ref(false)
  const loading = ref(false)

  async function getVapidKey(): Promise<string> {
    const data = await api.get('/notificacoes/vapid-public-key')
    return data.key
  }

  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
  }

  async function subscribe() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Seu navegador não suporta notificações push.')
      return false
    }
    loading.value = true
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return false

      const vapidKey = await getVapidKey()
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
      })

      const subJson = sub.toJSON() as any
      await api.post('/notificacoes/subscribe', {
        endpoint: subJson.endpoint,
        keys: { p256dh: subJson.keys.p256dh, auth: subJson.keys.auth }
      })

      subscribed.value = true
      return true
    } catch (err) {
      console.error('Push subscribe error:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  async function unsubscribe() {
    await api.delete('/notificacoes/subscribe')
    subscribed.value = false
  }

  return { subscribed, loading, subscribe, unsubscribe }
}
