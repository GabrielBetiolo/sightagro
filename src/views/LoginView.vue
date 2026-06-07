<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useThemeStore } from '../stores/theme'

const auth = useAuthStore()
const theme = useThemeStore()
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const showPassword = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(email.value, password.value)
  } catch (e: any) {
    error.value = e.message || 'Credenciais inválidas'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page" :class="{ light: !theme.dark }">
    <button class="theme-toggle" @click="theme.toggle()">
      <i :class="['ti', theme.dark ? 'ti-sun' : 'ti-moon']"></i>
    </button>

    <div class="auth-left">
      <div class="brand"><i class="ti ti-leaf"></i> AgroSmart</div>
      <div class="tagline">
        <h1>Bem-vindo de volta</h1>
        <p>Acesse o painel de monitoramento da sua fazenda.</p>
      </div>
      <div class="stats-row">
        <div class="stat"><strong>+12%</strong><span>Produção média</span></div>
        <div class="stat"><strong>98%</strong><span>Uptime sensores</span></div>
        <div class="stat"><strong>340+</strong><span>Fazendas ativas</span></div>
      </div>
    </div>

    <div class="auth-right">
      <div class="auth-card">
        <h2>Entrar na conta</h2>
        <p class="auth-sub">Entre com suas credenciais para continuar</p>

        <div v-if="error" class="error-box">
          <i class="ti ti-alert-circle"></i> {{ error }}
        </div>

        <form @submit.prevent="handleLogin">
          <div class="field">
            <label>E-mail</label>
            <div class="input-wrap">
              <i class="ti ti-mail"></i>
              <input v-model="email" type="email" placeholder="seu@email.com" required />
            </div>
          </div>

          <div class="field">
            <div class="field-header">
              <label>Senha</label>
              <RouterLink to="/forgot-password" class="forgot-link">Esqueceu a senha?</RouterLink>
            </div>
            <div class="input-wrap">
              <i class="ti ti-lock"></i>
              <input v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="••••••••" required />
              <button type="button" class="eye-btn" @click="showPassword = !showPassword">
                <i :class="['ti', showPassword ? 'ti-eye-off' : 'ti-eye']"></i>
              </button>
            </div>
          </div>

          <button type="submit" class="btn-submit" :disabled="loading">
            <span v-if="!loading">Entrar</span>
            <span v-else><i class="ti ti-loader-2 spin"></i> Entrando...</span>
          </button>
        </form>

        <p class="auth-link">Não tem conta? <RouterLink to="/register">Criar conta grátis</RouterLink></p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page { display: grid; grid-template-columns: 1fr 1fr; min-height: 100vh; background: var(--bg); color: var(--text); font-family: var(--font-body); position: relative; }
.theme-toggle { position: absolute; top: 1.25rem; right: 1.25rem; background: var(--surface); border: 1px solid var(--border); color: var(--text); width: 38px; height: 38px; border-radius: 10px; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; z-index: 10; transition: all 0.2s; }
.theme-toggle:hover { border-color: var(--green); color: var(--green); }
.auth-left { background: linear-gradient(135deg, #14532d, #166534, #15803d); padding: 3rem; display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; }
.auth-left::before { content: ''; position: absolute; right: -80px; top: -80px; width: 320px; height: 320px; background: rgba(255,255,255,0.06); border-radius: 50%; }
.brand { display: flex; align-items: center; gap: 10px; font-family: var(--font-display); font-weight: 800; font-size: 1.3rem; color: white; position: relative; z-index: 1; }
.brand .ti { font-size: 26px; }
.tagline { position: relative; z-index: 1; }
.tagline h1 { font-family: var(--font-display); font-size: 2.4rem; font-weight: 800; line-height: 1.1; letter-spacing: -0.03em; color: white; }
.tagline p { margin-top: 1rem; color: rgba(255,255,255,0.7); font-size: 0.95rem; line-height: 1.6; }
.stats-row { display: flex; gap: 2rem; position: relative; z-index: 1; }
.stat strong { display: block; font-family: var(--font-display); font-size: 1.8rem; font-weight: 800; color: white; }
.stat span { font-size: 0.78rem; color: rgba(255,255,255,0.6); }
.auth-right { display: flex; align-items: center; justify-content: center; padding: 2rem; }
.auth-card { width: 100%; max-width: 400px; }
.auth-card h2 { font-family: var(--font-display); font-size: 1.8rem; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 0.5rem; }
.auth-sub { color: var(--text3); font-size: 0.9rem; margin-bottom: 2rem; }
.error-box { background: #1a0a0a; border: 1px solid #7f1d1d; color: var(--red); padding: 12px 16px; border-radius: 12px; font-size: 0.85rem; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 8px; }
.field { margin-bottom: 1.25rem; }
.field-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.field label { font-size: 0.82rem; font-weight: 500; color: var(--text2); }
.forgot-link { font-size: 0.8rem; color: var(--green); text-decoration: none; }
.forgot-link:hover { text-decoration: underline; }
.input-wrap { position: relative; }
.input-wrap .ti { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--muted); font-size: 16px; pointer-events: none; }
.input-wrap input { width: 100%; padding: 12px 42px; border-radius: 12px; font-size: 0.9rem; background: var(--surface2); border: 1px solid var(--border); color: var(--text); }
.eye-btn { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--muted); cursor: pointer; font-size: 16px; }
.btn-submit { width: 100%; background: var(--green); color: #0a0f0d; border: none; padding: 13px; border-radius: 12px; font-family: var(--font-body); font-weight: 700; font-size: 0.95rem; cursor: pointer; transition: all 0.2s; margin-top: 0.5rem; }
.btn-submit:hover:not(:disabled) { background: var(--green2); transform: translateY(-1px); }
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
.auth-link { text-align: center; margin-top: 1.5rem; font-size: 0.85rem; color: var(--text3); }
.auth-link a { color: var(--green); text-decoration: none; font-weight: 500; }
.spin { animation: spin 1s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 768px) { .auth-page { grid-template-columns: 1fr; } .auth-left { display: none; } }
</style>
