<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const name = ref('')
const email = ref('')
const password = ref('')
const confirm = ref('')
const loading = ref(false)
const error = ref('')

async function handleRegister() {
  error.value = ''
  if (password.value !== confirm.value) {
    error.value = 'As senhas não coincidem'
    return
  }
  if (password.value.length < 6) {
    error.value = 'Senha deve ter no mínimo 6 caracteres'
    return
  }
  loading.value = true
  try {
    await auth.register(name.value, email.value, password.value)
  } catch (e: any) {
    error.value = e.message || 'Erro ao criar conta'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-left">
      <div class="brand">
        <i class="ti ti-leaf"></i>
        <span>AgroSmart</span>
      </div>
      <div class="tagline">
        <h1>Comece sua jornada no agro inteligente</h1>
        <p>Cadastre-se gratuitamente e conecte sua primeira fazenda em minutos.</p>
      </div>
      <div class="features">
        <div class="feat"><i class="ti ti-check"></i> Sensores em tempo real</div>
        <div class="feat"><i class="ti ti-check"></i> Alertas automáticos</div>
        <div class="feat"><i class="ti ti-check"></i> Relatórios detalhados</div>
        <div class="feat"><i class="ti ti-check"></i> Controle de irrigação</div>
      </div>
    </div>

    <div class="auth-right">
      <div class="auth-card">
        <h2>Criar conta</h2>
        <p class="auth-sub">Preencha os dados para criar sua conta</p>

        <div v-if="error" class="error-box">
          <i class="ti ti-alert-circle"></i> {{ error }}
        </div>

        <form @submit.prevent="handleRegister">
          <div class="field">
            <label>Nome completo</label>
            <div class="input-wrap">
              <i class="ti ti-user"></i>
              <input v-model="name" type="text" placeholder="Seu nome" required />
            </div>
          </div>

          <div class="field">
            <label>E-mail</label>
            <div class="input-wrap">
              <i class="ti ti-mail"></i>
              <input v-model="email" type="email" placeholder="seu@email.com" required />
            </div>
          </div>

          <div class="field">
            <label>Senha</label>
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
            <span v-if="!loading">Criar conta</span>
            <span v-else><i class="ti ti-loader-2 spin"></i> Criando...</span>
          </button>
        </form>

        <p class="auth-link">
          Já tem conta? <RouterLink to="/login">Entrar</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@400;500&display=swap');
@import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css');

.auth-page { display: grid; grid-template-columns: 1fr 1fr; min-height: 100vh; background: #0a0f0d; color: #f0fdf4; font-family: 'DM Sans', sans-serif; }
.auth-left { background: linear-gradient(135deg, #14532d 0%, #166534 50%, #15803d 100%); padding: 3rem; display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; }
.auth-left::before { content: ''; position: absolute; right: -80px; top: -80px; width: 320px; height: 320px; background: rgba(255,255,255,0.06); border-radius: 50%; }
.brand { display: flex; align-items: center; gap: 10px; font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.3rem; }
.brand .ti { font-size: 26px; }
.tagline h1 { font-family: 'Syne', sans-serif; font-size: 2.2rem; font-weight: 800; line-height: 1.1; letter-spacing: -0.03em; max-width: 400px; }
.tagline p { margin-top: 1rem; color: rgba(255,255,255,0.7); font-size: 0.95rem; max-width: 340px; line-height: 1.6; }
.features { display: flex; flex-direction: column; gap: 12px; }
.feat { display: flex; align-items: center; gap: 10px; font-size: 0.9rem; color: rgba(255,255,255,0.85); }
.feat .ti { color: #4ade80; font-size: 16px; }
.auth-right { display: flex; align-items: center; justify-content: center; padding: 2rem; }
.auth-card { width: 100%; max-width: 420px; }
.auth-card h2 { font-family: 'Syne', sans-serif; font-size: 1.8rem; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 0.5rem; }
.auth-sub { color: #6b7280; font-size: 0.9rem; margin-bottom: 1.75rem; }
.error-box { background: #1a0a0a; border: 1px solid #7f1d1d; color: #f87171; padding: 12px 16px; border-radius: 12px; font-size: 0.85rem; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 8px; }
.field { margin-bottom: 1rem; }
.field label { display: block; font-size: 0.82rem; font-weight: 500; color: #9ca3af; margin-bottom: 6px; }
.input-wrap { position: relative; }
.input-wrap .ti { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #4b5563; font-size: 16px; }
.input-wrap input { width: 100%; background: #111a14; border: 1px solid #1e3020; color: #f0fdf4; padding: 11px 14px 11px 42px; border-radius: 12px; font-size: 0.9rem; font-family: 'DM Sans', sans-serif; transition: border-color 0.2s; outline: none; }
.input-wrap input:focus { border-color: #4ade80; }
.input-wrap input::placeholder { color: #374151; }
.btn-submit { width: 100%; background: #4ade80; color: #0a0f0d; border: none; padding: 13px; border-radius: 12px; font-family: 'DM Sans', sans-serif; font-weight: 700; font-size: 0.95rem; cursor: pointer; transition: all 0.2s; margin-top: 0.5rem; }
.btn-submit:hover:not(:disabled) { background: #22c55e; transform: translateY(-1px); }
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
.auth-link { text-align: center; margin-top: 1.5rem; font-size: 0.85rem; color: #6b7280; }
.auth-link a { color: #4ade80; text-decoration: none; font-weight: 500; }
.spin { animation: spin 1s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 768px) { .auth-page { grid-template-columns: 1fr; } .auth-left { display: none; } }
</style>
