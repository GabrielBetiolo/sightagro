<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useThemeStore } from '../stores/theme'
import { useI18n } from '../composables/useI18n'

const auth = useAuthStore()
const theme = useThemeStore()
const { t, currentLang, setLang } = useI18n()

const saving = ref(false)
const saved = ref(false)
const savingPw = ref(false)
const savedPw = ref(false)
const uploadingAvatar = ref(false)
const activeTab = ref<'perfil'|'seguranca'|'notificacoes'|'aparencia'>('perfil')

const form = reactive({
  name: auth.user?.name || '',
  email: auth.user?.email || '',
  phone: auth.user?.phone || '',
  timezone: auth.user?.timezone || 'America/Sao_Paulo',
  language: auth.user?.language || 'pt-BR',
})

const pwForm = reactive({ atual: '', nova: '', confirmar: '' })
const pwError = ref('')

const notifications = reactive({
  email_alertas: true,
  email_relatorios: true,
  email_novidades: false,
  push_alertas: true,
  push_producao: false,
})

const timezones = ['America/Sao_Paulo','America/Manaus','America/Belem','America/Fortaleza','America/Recife','America/Noronha']
const languages = [
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'es-ES', label: 'Español' },
]

async function saveProfile() {
  saving.value = true
  try {
    await auth.updateProfile({
      name: form.name,
      email: form.email,
      phone: form.phone,
      timezone: form.timezone,
      language: form.language
    })
    // Aplica o idioma imediatamente
    setLang(form.language)
    saved.value = true
    setTimeout(() => saved.value = false, 2500)
  } finally { saving.value = false }
}

async function savePassword() {
  pwError.value = ''
  if (pwForm.nova !== pwForm.confirmar) { pwError.value = 'As senhas não coincidem'; return }
  if (pwForm.nova.length < 6) { pwError.value = 'Mínimo 6 caracteres'; return }
  savingPw.value = true
  try {
    await new Promise(r => setTimeout(r, 800))
    savedPw.value = true
    pwForm.atual = ''; pwForm.nova = ''; pwForm.confirmar = ''
    setTimeout(() => savedPw.value = false, 2500)
  } finally { savingPw.value = false }
}

async function handleAvatarUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploadingAvatar.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', 'sightagro_avatars')
    const res = await fetch(`https://api.cloudinary.com/v1_1/dkrpjfanu/image/upload`, { method: 'POST', body: formData })
    const data = await res.json()
    if (data.secure_url) await auth.updateProfile({ avatar: data.secure_url })
  } catch (err) { console.error('Avatar upload error:', err) }
  finally { uploadingAvatar.value = false }
}

const tabs = [
  { key: 'perfil', icon: 'ti-user', label: 'Perfil' },
  { key: 'seguranca', icon: 'ti-lock', label: 'Segurança' },
  { key: 'notificacoes', icon: 'ti-bell', label: 'Notificações' },
  { key: 'aparencia', icon: 'ti-palette', label: 'Aparência' },
]
</script>

<template>
  <div class="page">
    <div class="header">
      <h1 class="page-title">{{ t('perfil') }}</h1>
      <p class="page-sub">Gerencie sua conta e preferências</p>
    </div>

    <div class="settings-layout">
      <div class="tabs-sidebar">
        <button v-for="tab in tabs" :key="tab.key"
          class="tab-btn" :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key as any">
          <i :class="['ti', tab.icon]"></i> {{ tab.label }}
        </button>
      </div>

      <div class="content-area">

        <!-- PERFIL -->
        <div v-if="activeTab === 'perfil'" class="panel">
          <h3 class="panel-title">Informações pessoais</h3>
          <div class="avatar-section">
            <div class="avatar-wrap">
              <img v-if="auth.user?.avatar" :src="auth.user.avatar" alt="avatar" class="avatar-img" />
              <div v-else class="avatar-placeholder">{{ (auth.user?.name || 'U').charAt(0).toUpperCase() }}</div>
              <label class="avatar-upload-btn" :class="{ loading: uploadingAvatar }">
                <i v-if="!uploadingAvatar" class="ti ti-camera"></i>
                <i v-else class="ti ti-loader-2 spin"></i>
                <input type="file" accept="image/*" @change="handleAvatarUpload" style="display:none" />
              </label>
            </div>
            <div>
              <div class="avatar-name">{{ auth.user?.name }}</div>
              <div class="avatar-email">{{ auth.user?.email }}</div>
              <div class="avatar-role">{{ auth.user?.role || 'Admin' }}</div>
            </div>
          </div>

          <div class="fields-grid">
            <div class="field">
              <label>Nome completo</label>
              <div class="input-wrap"><i class="ti ti-user"></i><input v-model="form.name" type="text" /></div>
            </div>
            <div class="field">
              <label>E-mail</label>
              <div class="input-wrap"><i class="ti ti-mail"></i><input v-model="form.email" type="email" /></div>
            </div>
            <div class="field">
              <label>Telefone</label>
              <div class="input-wrap"><i class="ti ti-phone"></i><input v-model="form.phone" type="tel" placeholder="(00) 00000-0000" /></div>
            </div>
            <div class="field">
              <label>Fuso horário</label>
              <div class="input-wrap">
                <i class="ti ti-clock"></i>
                <select v-model="form.timezone">
                  <option v-for="tz in timezones" :key="tz" :value="tz">{{ tz }}</option>
                </select>
              </div>
            </div>
            <div class="field">
              <label>Idioma</label>
              <div class="input-wrap">
                <i class="ti ti-language"></i>
                <select v-model="form.language">
                  <option v-for="l in languages" :key="l.value" :value="l.value">{{ l.label }}</option>
                </select>
              </div>
            </div>
          </div>
          <button class="btn-save" @click="saveProfile" :disabled="saving">
            <span v-if="saved"><i class="ti ti-check"></i> Salvo!</span>
            <span v-else-if="saving"><i class="ti ti-loader-2 spin"></i> Salvando...</span>
            <span v-else>{{ t('salvar') }}</span>
          </button>
        </div>

        <!-- SEGURANÇA -->
        <div v-if="activeTab === 'seguranca'" class="panel">
          <h3 class="panel-title">Alterar senha</h3>
          <div v-if="pwError" class="error-box"><i class="ti ti-alert-circle"></i> {{ pwError }}</div>
          <div v-if="savedPw" class="success-box"><i class="ti ti-check"></i> Senha alterada com sucesso!</div>
          <div class="field"><label>Senha atual</label><div class="input-wrap"><i class="ti ti-lock"></i><input v-model="pwForm.atual" type="password" placeholder="••••••••" /></div></div>
          <div class="field"><label>Nova senha</label><div class="input-wrap"><i class="ti ti-lock"></i><input v-model="pwForm.nova" type="password" placeholder="Mínimo 6 caracteres" /></div></div>
          <div class="field"><label>Confirmar nova senha</label><div class="input-wrap"><i class="ti ti-lock-check"></i><input v-model="pwForm.confirmar" type="password" placeholder="Repita a senha" /></div></div>
          <button class="btn-save" @click="savePassword" :disabled="savingPw">
            <span v-if="savingPw"><i class="ti ti-loader-2 spin"></i></span>
            <span v-else>Alterar senha</span>
          </button>
          <div class="danger-section">
            <h3 class="panel-title danger">Zona de perigo</h3>
            <p class="danger-desc">Ações irreversíveis. Tenha cuidado.</p>
            <div class="danger-actions">
              <button class="btn-danger-outline">Exportar meus dados</button>
              <button class="btn-danger">Excluir conta</button>
            </div>
          </div>
        </div>

        <!-- NOTIFICAÇÕES -->
        <div v-if="activeTab === 'notificacoes'" class="panel">
          <h3 class="panel-title">Notificações por e-mail</h3>
          <div class="toggle-list">
            <div class="toggle-item" v-for="item in [
              {key:'email_alertas', label:'Alertas críticos', desc:'Sensor offline, umidade crítica, etc.'},
              {key:'email_relatorios', label:'Relatórios semanais', desc:'Resumo semanal da sua fazenda'},
              {key:'email_novidades', label:'Novidades do produto', desc:'Novas funcionalidades e melhorias'},
            ]" :key="item.key">
              <div><div class="toggle-label">{{ item.label }}</div><div class="toggle-desc">{{ item.desc }}</div></div>
              <button class="toggle-btn" :class="{ on: (notifications as any)[item.key] }" @click="(notifications as any)[item.key] = !(notifications as any)[item.key]">
                <span class="toggle-knob"></span>
              </button>
            </div>
          </div>
          <h3 class="panel-title" style="margin-top:2rem">Notificações push</h3>
          <div class="toggle-list">
            <div class="toggle-item" v-for="item in [
              {key:'push_alertas', label:'Alertas em tempo real', desc:'Receba alertas instantâneos no navegador'},
              {key:'push_producao', label:'Atualização de produção', desc:'Notificação quando a produção mudar'},
            ]" :key="item.key">
              <div><div class="toggle-label">{{ item.label }}</div><div class="toggle-desc">{{ item.desc }}</div></div>
              <button class="toggle-btn" :class="{ on: (notifications as any)[item.key] }" @click="(notifications as any)[item.key] = !(notifications as any)[item.key]">
                <span class="toggle-knob"></span>
              </button>
            </div>
          </div>
          <button class="btn-save" style="margin-top:1.5rem">Salvar preferências</button>
        </div>

        <!-- APARÊNCIA -->
        <div v-if="activeTab === 'aparencia'" class="panel">
          <h3 class="panel-title">Tema</h3>
          <div class="theme-options">
            <button class="theme-option" :class="{ active: theme.dark }" @click="!theme.dark && theme.toggle()">
              <div class="theme-preview dark-preview"><div class="tp-bar"></div><div class="tp-bar short"></div></div>
              <div class="theme-option-label"><i class="ti ti-moon"></i> Modo escuro<span v-if="theme.dark" class="active-badge">Ativo</span></div>
            </button>
            <button class="theme-option" :class="{ active: !theme.dark }" @click="theme.dark && theme.toggle()">
              <div class="theme-preview light-preview"><div class="tp-bar"></div><div class="tp-bar short"></div></div>
              <div class="theme-option-label"><i class="ti ti-sun"></i> Modo claro<span v-if="!theme.dark" class="active-badge">Ativo</span></div>
            </button>
          </div>

          <h3 class="panel-title" style="margin-top:2rem">Idioma atual</h3>
          <div class="lang-options">
            <button v-for="l in languages" :key="l.value"
              class="lang-option" :class="{ active: currentLang === l.value }"
              @click="setLang(l.value); form.language = l.value">
              {{ l.label }}
              <span v-if="currentLang === l.value" class="active-badge">Ativo</span>
            </button>
          </div>
          <p style="font-size:0.78rem;color:var(--text3);margin-top:0.75rem">
            <i class="ti ti-info-circle"></i> Para salvar permanentemente, vá em Perfil e salve.
          </p>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.page { padding: 2rem; background: var(--bg); min-height: 100vh; color: var(--text); font-family: var(--font-body); }
.header { margin-bottom: 2rem; }
.page-title { font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; letter-spacing: -0.03em; }
.page-sub { color: var(--text3); font-size: 0.9rem; margin-top: 4px; }
.settings-layout { display: grid; grid-template-columns: 200px 1fr; gap: 1.5rem; }
.tabs-sidebar { display: flex; flex-direction: column; gap: 4px; }
.tab-btn { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 10px; background: none; border: none; color: var(--text3); font-size: 0.88rem; cursor: pointer; font-family: var(--font-body); transition: all 0.2s; text-align: left; width: 100%; }
.tab-btn:hover { background: var(--surface2); color: var(--text); }
.tab-btn.active { background: var(--surface2); color: var(--green); border-left: 2px solid var(--green); }
.panel { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 2rem; }
.panel-title { font-family: var(--font-display); font-size: 1.1rem; font-weight: 800; margin-bottom: 1.5rem; }
.panel-title.danger { color: var(--red); margin-top: 2rem; }
.avatar-section { display: flex; align-items: center; gap: 1.25rem; margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px solid var(--border); }
.avatar-wrap { position: relative; flex-shrink: 0; }
.avatar-img { width: 72px; height: 72px; border-radius: 50%; object-fit: cover; border: 2px solid var(--green); }
.avatar-placeholder { width: 72px; height: 72px; border-radius: 50%; background: var(--surface2); border: 2px solid var(--green); display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-size: 1.8rem; font-weight: 800; color: var(--green); }
.avatar-upload-btn { position: absolute; bottom: 0; right: 0; width: 26px; height: 26px; background: var(--green); border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 13px; color: #0a0f0d; }
.avatar-name { font-family: var(--font-display); font-weight: 800; font-size: 1rem; }
.avatar-email { font-size: 0.82rem; color: var(--text3); margin-top: 2px; }
.avatar-role { display: inline-block; background: var(--surface2); border: 1px solid var(--border); color: var(--green); font-size: 0.7rem; padding: 2px 10px; border-radius: 20px; margin-top: 6px; }
.fields-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field label { font-size: 0.82rem; color: var(--text2); }
.input-wrap { position: relative; }
.input-wrap .ti { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--muted); font-size: 15px; pointer-events: none; }
.input-wrap input, .input-wrap select { width: 100%; padding: 10px 12px 10px 38px; border-radius: 10px; font-size: 0.88rem; background: var(--surface2); border: 1px solid var(--border); color: var(--text); font-family: var(--font-body); outline: none; }
.input-wrap input:focus, .input-wrap select:focus { border-color: var(--green); }
.btn-save { background: var(--green); color: #0a0f0d; border: none; padding: 11px 22px; border-radius: 12px; font-family: var(--font-body); font-weight: 700; font-size: 0.88rem; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px; }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
.error-box { background: #1a0a0a; border: 1px solid #7f1d1d; color: var(--red); padding: 12px; border-radius: 10px; font-size: 0.85rem; margin-bottom: 1rem; display: flex; align-items: center; gap: 8px; }
.success-box { background: #0f2e17; border: 1px solid var(--green); color: var(--green); padding: 12px; border-radius: 10px; font-size: 0.85rem; margin-bottom: 1rem; display: flex; align-items: center; gap: 8px; }
.danger-section { margin-top: 2rem; padding-top: 2rem; border-top: 1px solid #3b1515; }
.danger-desc { font-size: 0.85rem; color: var(--text3); margin-bottom: 1rem; }
.danger-actions { display: flex; gap: 10px; }
.btn-danger-outline { background: none; border: 1px solid #3b1515; color: var(--red); padding: 10px 18px; border-radius: 10px; font-size: 0.85rem; cursor: pointer; font-family: var(--font-body); }
.btn-danger { background: #7f1d1d; border: none; color: #fca5a5; padding: 10px 18px; border-radius: 10px; font-size: 0.85rem; cursor: pointer; font-family: var(--font-body); }
.toggle-list { display: flex; flex-direction: column; gap: 10px; }
.toggle-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; background: var(--surface2); border-radius: 12px; }
.toggle-label { font-size: 0.88rem; font-weight: 500; margin-bottom: 2px; }
.toggle-desc { font-size: 0.78rem; color: var(--text3); }
.toggle-btn { width: 48px; height: 26px; background: var(--border); border: none; border-radius: 13px; cursor: pointer; position: relative; transition: background 0.2s; flex-shrink: 0; }
.toggle-btn.on { background: var(--green); }
.toggle-knob { position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; background: white; border-radius: 50%; transition: transform 0.2s; display: block; }
.toggle-btn.on .toggle-knob { transform: translateX(22px); background: #0a0f0d; }
.theme-options { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.theme-option { background: var(--surface2); border: 2px solid var(--border); border-radius: 16px; padding: 1.25rem; cursor: pointer; transition: all 0.2s; text-align: left; }
.theme-option.active { border-color: var(--green); }
.theme-preview { border-radius: 10px; padding: 12px; margin-bottom: 1rem; display: flex; flex-direction: column; gap: 6px; }
.dark-preview { background: #0a0f0d; }
.light-preview { background: #f0fdf4; }
.tp-bar { height: 8px; border-radius: 4px; background: #4ade8044; width: 100%; }
.tp-bar.short { width: 60%; }
.theme-option-label { display: flex; align-items: center; gap: 6px; font-size: 0.88rem; color: var(--text); }
.active-badge { margin-left: auto; background: var(--green); color: #0a0f0d; font-size: 0.7rem; padding: 2px 8px; border-radius: 20px; font-weight: 700; }
.lang-options { display: flex; flex-direction: column; gap: 8px; }
.lang-option { background: var(--surface2); border: 1.5px solid var(--border); color: var(--text); padding: 12px 16px; border-radius: 12px; cursor: pointer; font-family: var(--font-body); font-size: 0.9rem; text-align: left; display: flex; align-items: center; justify-content: space-between; transition: all 0.2s; }
.lang-option.active { border-color: var(--green); color: var(--green); }
.lang-option:hover { border-color: var(--green); }
.spin { animation: spin 1s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 768px) {
  .settings-layout { grid-template-columns: 1fr; }
  .tabs-sidebar { flex-direction: row; overflow-x: auto; padding-bottom: 4px; }
  .tab-btn { white-space: nowrap; border-left: none !important; border-bottom: 2px solid transparent; }
  .tab-btn.active { border-bottom-color: var(--green); border-left: none; }
  .fields-grid { grid-template-columns: 1fr; }
  .theme-options { grid-template-columns: 1fr; }
}
</style>
