<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../composables/useApi'
import { useThemeStore } from '../stores/theme'

const theme = useThemeStore()
const route = useRoute()
const router = useRouter()
const password = ref('')
const confirm = ref('')
const loading = ref(false)
const done = ref(false)
const error = ref('')

async function handleReset() {
  error.value = ''
  if (password.value !== confirm.value) { error.value = 'As senhas não coincidem'; return }
  if (password.value.length < 6) { error.value = 'Mínimo 6 caracteres'; return }
  loading.value = true
  try {
    await api.post('/auth/reset-password', { token: route.query.token, password: password.value })
    done.value = true
    setTimeout(() => router.push('/login'), 3000)
  } catch (e: any) {
    error.value = e.message || 'Link inválido ou expirado'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page" :class="{ light: !theme.dark }">
    <div class="card">
      <div class="icon-wrap"><i class="ti ti-lock-cog"></i></div>
      <h2>Nova senha</h2>
      <p class="sub" v-if="!done">Escolha uma senha segura para sua conta.</p>

      <div v-if="done" class="success">
        <div class="icon-wrap" style="background:#1a2e1a;color:#4ade80;margin:0 auto 1rem"><i class="ti ti-check"></i></div>
        <h2>Senha redefinida!</h2>
        <p class="sub">Você será redirecionado para o login em instantes...</p>
      </div>

      <form v-else @submit.prevent="handleReset">
        <div v-if="error" class="error-box"><i class="ti ti-alert-circle"></i> {{ error }}</div>
        <div class="field">
          <label>Nova senha</label>
          <div class="input-wrap">
            <i class="ti ti-lock"></i>
            <input v-model="password" type="password" placeholder="Mínimo 6 caracteres" required />
          </div>
        </div>
        <div class="field">
          <label>Confirmar senha</label>
          <div class="input-wrap">
            <i class="ti ti-lock-check"></i>
            <input v-model="confirm" type="password" placeholder="Repita a senha" required />
          </div>
        </div>
        <button type="submit" class="btn-submit" :disabled="loading">
          <span v-if="!loading">Redefinir senha</span>
          <span v-else><i class="ti ti-loader-2 spin"></i></span>
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.page { min-height: 100vh; background: var(--bg); display: flex; align-items: center; justify-content: center; padding: 2rem; font-family: var(--font-body); color: var(--text); }
.card { background: var(--surface); border: 1px solid var(--border); border-radius: 24px; padding: 2.5rem; width: 100%; max-width: 420px; }
.icon-wrap { width: 56px; height: 56px; background: var(--surface2); border: 1px solid var(--border); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 24px; color: var(--green); margin-bottom: 1.25rem; }
h2 { font-family: var(--font-display); font-size: 1.6rem; font-weight: 800; margin-bottom: 0.5rem; }
.sub { color: var(--text3); font-size: 0.9rem; margin-bottom: 1.75rem; }
.error-box { background: #1a0a0a; border: 1px solid #7f1d1d; color: var(--red); padding: 12px; border-radius: 12px; font-size: 0.85rem; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 8px; }
.field { margin-bottom: 1rem; }
.field label { display: block; font-size: 0.82rem; color: var(--text2); margin-bottom: 6px; }
.input-wrap { position: relative; }
.input-wrap .ti { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--muted); font-size: 16px; pointer-events: none; }
.input-wrap input { width: 100%; padding: 12px 14px 12px 42px; border-radius: 12px; font-size: 0.9rem; background: var(--surface2); border: 1px solid var(--border); color: var(--text); font-family: var(--font-body); outline: none; }
.input-wrap input:focus { border-color: var(--green); }
.btn-submit { width: 100%; background: var(--green); color: #0a0f0d; border: none; padding: 13px; border-radius: 12px; font-family: var(--font-body); font-weight: 700; font-size: 0.95rem; cursor: pointer; transition: all 0.2s; margin-top: 0.5rem; }
.btn-submit:hover:not(:disabled) { background: var(--green2); }
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
.success { text-align: center; }
.spin { animation: spin 1s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
