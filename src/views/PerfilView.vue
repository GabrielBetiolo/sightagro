<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const saving = ref(false)
const saved = ref(false)
const form = ref({ name: auth.user?.name || '', email: auth.user?.email || '' })
const pwForm = ref({ atual: '', nova: '', confirmar: '' })

async function saveProfile() {
  saving.value = true
  await new Promise(r => setTimeout(r, 800))
  saving.value = false
  saved.value = true
  setTimeout(() => saved.value = false, 2000)
}
</script>

<template>
  <div class="page">
    <div class="header">
      <h1 class="page-title">Perfil</h1>
    </div>

    <div class="profile-grid">
      <div class="panel avatar-panel">
        <div class="avatar">{{ (auth.user?.name || 'U').charAt(0).toUpperCase() }}</div>
        <h3>{{ auth.user?.name }}</h3>
        <p>{{ auth.user?.email }}</p>
        <span class="role-badge">{{ auth.user?.role || 'Admin' }}</span>
      </div>

      <div class="panel">
        <h3 class="section-title">Informações pessoais</h3>
        <div class="field">
          <label>Nome completo</label>
          <input v-model="form.name" type="text" />
        </div>
        <div class="field">
          <label>E-mail</label>
          <input v-model="form.email" type="email" />
        </div>
        <button class="btn-save" @click="saveProfile" :disabled="saving">
          <span v-if="saved"><i class="ti ti-check"></i> Salvo!</span>
          <span v-else-if="saving"><i class="ti ti-loader-2 spin"></i> Salvando...</span>
          <span v-else>Salvar alterações</span>
        </button>
      </div>

      <div class="panel">
        <h3 class="section-title">Alterar senha</h3>
        <div class="field">
          <label>Senha atual</label>
          <input v-model="pwForm.atual" type="password" placeholder="••••••••" />
        </div>
        <div class="field">
          <label>Nova senha</label>
          <input v-model="pwForm.nova" type="password" placeholder="••••••••" />
        </div>
        <div class="field">
          <label>Confirmar nova senha</label>
          <input v-model="pwForm.confirmar" type="password" placeholder="••••••••" />
        </div>
        <button class="btn-save">Alterar senha</button>
      </div>

      <div class="panel danger-panel">
        <h3 class="section-title danger">Zona de perigo</h3>
        <p class="danger-desc">Ações irreversíveis. Tenha cuidado.</p>
        <div class="danger-actions">
          <button class="btn-danger-outline">Exportar dados</button>
          <button class="btn-danger">Excluir conta</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@400;500&display=swap');
@import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css');
.page { padding: 2.5rem; background: #0a0f0d; min-height: 100vh; color: #f0fdf4; font-family: 'DM Sans', sans-serif; }
.header { margin-bottom: 2rem; }
.page-title { font-family: 'Syne', sans-serif; font-size: 2.5rem; font-weight: 800; letter-spacing: -0.03em; }
.profile-grid { display: grid; grid-template-columns: 240px 1fr; gap: 1rem; }
.panel { background: #111a14; border: 1px solid #1e3020; border-radius: 20px; padding: 1.75rem; }
.avatar-panel { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 0.75rem; grid-row: 1 / 3; }
.avatar { width: 80px; height: 80px; background: #1a2e1a; border: 2px solid #4ade80; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-size: 2rem; font-weight: 800; color: #4ade80; }
.avatar-panel h3 { font-family: 'Syne', sans-serif; font-size: 1.1rem; font-weight: 800; }
.avatar-panel p { font-size: 0.82rem; color: #6b7280; }
.role-badge { background: #1a2e1a; color: #4ade80; font-size: 0.72rem; padding: 4px 12px; border-radius: 20px; }
.section-title { font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 800; margin-bottom: 1.25rem; }
.section-title.danger { color: #f87171; }
.field { margin-bottom: 1rem; }
.field label { display: block; font-size: 0.82rem; color: #9ca3af; margin-bottom: 6px; }
.field input { width: 100%; background: #172110; border: 1px solid #1e3020; color: #f0fdf4; padding: 10px 14px; border-radius: 10px; font-size: 0.9rem; font-family: 'DM Sans', sans-serif; outline: none; }
.field input:focus { border-color: #4ade80; }
.btn-save { background: #4ade80; color: #0a0f0d; border: none; padding: 11px 22px; border-radius: 12px; font-family: 'DM Sans', sans-serif; font-weight: 700; font-size: 0.88rem; cursor: pointer; transition: all 0.2s; }
.btn-save:hover:not(:disabled) { background: #22c55e; }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
.danger-panel { border-color: #3b1515; }
.danger-desc { font-size: 0.85rem; color: #6b7280; margin-bottom: 1.25rem; }
.danger-actions { display: flex; gap: 10px; }
.btn-danger-outline { background: none; border: 1px solid #3b1515; color: #f87171; padding: 10px 18px; border-radius: 10px; font-size: 0.85rem; cursor: pointer; font-family: 'DM Sans', sans-serif; }
.btn-danger { background: #7f1d1d; border: none; color: #fca5a5; padding: 10px 18px; border-radius: 10px; font-size: 0.85rem; cursor: pointer; font-family: 'DM Sans', sans-serif; }
.spin { animation: spin 1s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
