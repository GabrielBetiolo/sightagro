<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '../composables/useApi'
import { useThemeStore } from '../stores/theme'

const theme = useThemeStore()
const email = ref('')
const loading = ref(false)
const sent = ref(false)
const error = ref('')

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    await api.post('/auth/forgot-password', { email: email.value })
    sent.value = true
  } catch (e: any) {
    error.value = e.message || 'Erro ao enviar e-mail'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page" :class="{ light: !theme.dark }">
    <button class="theme-toggle" @click="theme.toggle()">
      <i :class="['ti', theme.dark ? 'ti-sun' : 'ti-moon']"></i>
    </button>

    <div class="card">
      <RouterLink to="/login" class="back-link">
        <i class="ti ti-arrow-left"></i> Voltar ao login
      </RouterLink>

      <div v-if="!sent">
        <div class="icon-wrap"><i class="ti ti-lock-open"></i></div>
        <h2>Esqueceu a senha?</h2>
        <p class="sub">Digite seu e-mail e enviaremos um link para redefinir sua senha.</p>

        <div v-if="error" class="error-box">
          <i class="ti ti-alert-circle"></i> {{ error }}
        </div>

        <form @submit.prevent="handleSubmit">
          <div class="field">
            <label>E-mail</label>
            <div class="input-wrap">
              <i class="ti ti-mail"></i>
              <input v-model="email" type="email" placeholder="seu@email.com" required />
            </div>
          </div>
          <button type="submit" class="btn-submit" :disabled="loading">
            <span v-if="!loading">Enviar link de redefinição</span>
            <span v-else><i class="ti ti-loader-2 spin"></i> Enviando...</span>
          </button>
        </form>
      </div>

      <div v-else class="success">
        <div class="icon-wrap success-icon"><i class="ti ti-mail-check"></i></div>
        <h2>E-mail enviado!</h2>
        <p class="sub">Enviamos um link de redefinição para <strong>{{ email }}</strong>. Verifique sua caixa de entrada e spam.</p>
        <RouterLink to="/login" class="btn-submit" style="display:block;text-align:center;text-decoration:none;margin-top:1.5rem">
          Voltar ao login
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { min-height: 100vh; background: var(--bg); display: flex; align-items: center; justify-content: center; padding: 2rem; position: relative; font-family: var(--font-body); color: var(--text); }
.theme-toggle { position: absolute; top: 1.25rem; right: 1.25rem; background: var(--surface); border: 1px solid var(--border); color: var(--text); width: 38px; height: 38px; border-radius: 10px; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; }
.card { background: var(--surface); border: 1px solid var(--border); border-radius: 24px; padding: 2.5rem; width: 100%; max-width: 420px; }
.back-link { display: inline-flex; align-items: center; gap: 6px; color: var(--text3); font-size: 0.85rem; text-decoration: none; margin-bottom: 2rem; transition: color 0.2s; }
.back-link:hover { color: var(--green); }
.icon-wrap { width: 56px; height: 56px; background: var(--surface2); border: 1px solid var(--border); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 24px; color: var(--green); margin-bottom: 1.25rem; }
.success-icon { background: #1a2e1a; border-color: var(--green); }
h2 { font-family: var(--font-display); font-size: 1.6rem; font-weight: 800; margin-bottom: 0.5rem; }
.sub { color: var(--text3); font-size: 0.9rem; line-height: 1.6; margin-bottom: 1.75rem; }
.error-box { background: #1a0a0a; border: 1px solid #7f1d1d; color: var(--red); padding: 12px 16px; border-radius: 12px; font-size: 0.85rem; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 8px; }
.field { margin-bottom: 1.25rem; }
.field label { display: block; font-size: 0.82rem; color: var(--text2); margin-bottom: 6px; }
.input-wrap { position: relative; }
.input-wrap .ti { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--muted); font-size: 16px; pointer-events: none; }
.input-wrap input { width: 100%; padding: 12px 14px 12px 42px; border-radius: 12px; font-size: 0.9rem; background: var(--surface2); border: 1px solid var(--border); color: var(--text); font-family: var(--font-body); outline: none; }
.input-wrap input:focus { border-color: var(--green); }
.btn-submit { width: 100%; background: var(--green); color: #0a0f0d; border: none; padding: 13px; border-radius: 12px; font-family: var(--font-body); font-weight: 700; font-size: 0.95rem; cursor: pointer; transition: all 0.2s; }
.btn-submit:hover:not(:disabled) { background: var(--green2); }
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
.success { text-align: center; }
.spin { animation: spin 1s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
