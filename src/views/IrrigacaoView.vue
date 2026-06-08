<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '../composables/useApi'

const zones = ref<any[]>([])
const fazendas = ref<any[]>([])
const loading = ref(true)
const showModal = ref(false)
const criando = ref(false)
const form = ref({ zona: '', duracao: 30, fazendaId: '' })

async function fetchDados() {
  loading.value = true
  try {
    const [z, f] = await Promise.all([api.get('/irrigacao'), api.get('/fazendas')])
    zones.value = z
    fazendas.value = f
    if (f.length > 0 && !form.value.fazendaId) form.value.fazendaId = f[0].id
  } finally { loading.value = false }
}

async function toggle(zone: any) {
  const updated = await api.patch(`/irrigacao/${zone.id}/toggle`, {})
  zone.ativa = updated.ativa
  zone.fluxo = updated.fluxo
}

async function criarZona() {
  if (!form.value.zona || !form.value.fazendaId) return
  criando.value = true
  try {
    await api.post('/irrigacao', {
      zona: form.value.zona,
      duracao: Number(form.value.duracao),
      fazendaId: Number(form.value.fazendaId)
    })
    showModal.value = false
    form.value = { zona: '', duracao: 30, fazendaId: fazendas.value[0]?.id || '' }
    await fetchDados()
  } finally { criando.value = false }
}

async function deletarZona(id: number) {
  if (!confirm('Deletar esta zona de irrigação?')) return
  await api.delete(`/irrigacao/${id}`)
  await fetchDados()
}

const totalFluxo = () => zones.value.filter(z => z.ativa).reduce((acc, z) => acc + z.fluxo, 0)
const zonasAtivas = () => zones.value.filter(z => z.ativa).length

onMounted(fetchDados)
</script>

<template>
  <div class="page">
    <div class="header">
      <div>
        <h1 class="page-title">Irrigação</h1>
        <p class="page-sub">{{ zonasAtivas() }} zonas ativas agora</p>
      </div>
      <button class="btn-primary" @click="showModal = true" :disabled="fazendas.length === 0">
        <i class="ti ti-plus"></i> Nova Zona
      </button>
    </div>

    <div v-if="!loading && fazendas.length === 0" class="alert-info">
      <i class="ti ti-info-circle"></i> Cadastre uma fazenda antes de adicionar zonas de irrigação.
    </div>

    <div v-if="zones.length > 0" class="summary">
      <div class="sum-card">
        <i class="ti ti-droplets" style="color:#22d3ee;font-size:22px"></i>
        <div><strong>{{ totalFluxo().toFixed(1) }} L/min</strong><span>Fluxo total</span></div>
      </div>
      <div class="sum-card">
        <i class="ti ti-check" style="color:#4ade80;font-size:22px"></i>
        <div><strong>{{ zonasAtivas() }}</strong><span>Zonas ativas</span></div>
      </div>
      <div class="sum-card">
        <i class="ti ti-layout-grid" style="color:#a78bfa;font-size:22px"></i>
        <div><strong>{{ zones.length }}</strong><span>Total de zonas</span></div>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <i class="ti ti-loader-2 spin"></i> Carregando...
    </div>

    <div v-else-if="zones.length === 0 && fazendas.length > 0" class="empty-state">
      <div class="empty-icon"><i class="ti ti-droplets"></i></div>
      <h3>Nenhuma zona de irrigação</h3>
      <p>Adicione zonas para controlar a irrigação da sua fazenda.</p>
      <button class="btn-primary" @click="showModal = true"><i class="ti ti-plus"></i> Adicionar zona</button>
    </div>

    <div v-else class="zones-grid">
      <div v-for="z in zones" :key="z.id" class="zone-card" :class="{ active: z.ativa }">
        <div class="zone-top">
          <div class="zone-info">
            <h3>{{ z.zona }}</h3>
            <span class="zone-fazenda">{{ z.fazenda?.nome }}</span>
            <span class="zone-status" :class="z.ativa ? 'on' : 'off'">
              Válvula {{ z.ativa ? 'aberta' : 'fechada' }}
            </span>
          </div>
          <button class="toggle" :class="{ on: z.ativa }" @click="toggle(z)">
            <span class="toggle-knob"></span>
          </button>
        </div>
        <div class="zone-meta">
          <div class="meta"><i class="ti ti-droplet"></i> {{ z.ativa ? `${z.fluxo} L/min` : 'Inativo' }}</div>
          <div class="meta"><i class="ti ti-timer"></i> {{ z.duracao }} min</div>
          <div v-if="z.proxima" class="meta"><i class="ti ti-clock"></i> {{ new Date(z.proxima).toLocaleString('pt-BR') }}</div>
        </div>
        <button class="btn-danger-sm" @click="deletarZona(z.id)"><i class="ti ti-trash"></i> Remover</button>
      </div>
    </div>

    <!-- MODAL NOVA ZONA -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>Nova Zona de Irrigação</h3>
          <button class="modal-close" @click="showModal = false"><i class="ti ti-x"></i></button>
        </div>
        <div class="field"><label>Nome da zona *</label><input v-model="form.zona" type="text" placeholder="Ex: Setor A - Soja Norte" /></div>
        <div class="field"><label>Duração padrão (minutos)</label><input v-model="form.duracao" type="number" min="1" /></div>
        <div class="field">
          <label>Fazenda</label>
          <select v-model="form.fazendaId" class="select-input">
            <option v-for="f in fazendas" :key="f.id" :value="f.id">{{ f.nome }}</option>
          </select>
        </div>
        <div class="modal-actions">
          <button class="btn-outline-lg" @click="showModal = false">Cancelar</button>
          <button class="btn-primary-lg" @click="criarZona" :disabled="criando">
            <i v-if="criando" class="ti ti-loader-2 spin"></i><span v-else>Criar Zona</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { padding: 2rem; background: var(--bg); min-height: 100vh; color: var(--text); font-family: var(--font-body); }
.header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
.page-title { font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; letter-spacing: -0.03em; }
.page-sub { color: var(--text3); font-size: 0.9rem; margin-top: 4px; }
.btn-primary { background: var(--green); color: #0a0f0d; border: none; padding: 10px 18px; border-radius: 30px; font-family: var(--font-body); font-weight: 700; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 6px; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.alert-info { background: #0e2a2e; border: 1px solid #0e4a5e; color: #22d3ee; padding: 12px 16px; border-radius: 12px; font-size: 0.88rem; display: flex; align-items: center; gap: 8px; margin-bottom: 1rem; }
.summary { display: grid; grid-template-columns: repeat(3,1fr); gap: 1rem; margin-bottom: 1.5rem; }
.sum-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 1.25rem 1.5rem; display: flex; align-items: center; gap: 1rem; }
.sum-card strong { display: block; font-family: var(--font-display); font-size: 1.4rem; font-weight: 800; }
.sum-card span { font-size: 0.78rem; color: var(--text3); }
.loading-state { display: flex; align-items: center; gap: 8px; color: var(--text3); padding: 3rem; justify-content: center; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 4rem 2rem; text-align: center; background: var(--surface); border: 2px dashed var(--border); border-radius: 20px; }
.empty-icon { width: 64px; height: 64px; background: var(--surface2); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 28px; color: var(--text3); }
.empty-state h3 { font-family: var(--font-display); font-size: 1.2rem; font-weight: 800; }
.empty-state p { color: var(--text3); font-size: 0.88rem; max-width: 300px; line-height: 1.6; }
.zones-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px,1fr)); gap: 1.25rem; }
.zone-card { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: 1.5rem; transition: border-color 0.2s; }
.zone-card.active { border-color: var(--green); }
.zone-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; }
.zone-info h3 { font-family: var(--font-display); font-size: 1rem; font-weight: 800; margin-bottom: 3px; }
.zone-fazenda { font-size: 0.75rem; color: var(--text3); display: block; margin-bottom: 5px; }
.zone-status { font-size: 0.72rem; padding: 2px 8px; border-radius: 20px; }
.zone-status.on { background: #1a2e1a; color: var(--green); }
.zone-status.off { background: var(--surface2); color: var(--text3); }
.toggle { width: 48px; height: 26px; background: var(--border); border: none; border-radius: 13px; cursor: pointer; position: relative; transition: background 0.2s; flex-shrink: 0; }
.toggle.on { background: var(--green); }
.toggle-knob { position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; background: white; border-radius: 50%; transition: transform 0.2s; display: block; }
.toggle.on .toggle-knob { transform: translateX(22px); background: #0a0f0d; }
.zone-meta { display: flex; flex-direction: column; gap: 6px; margin-bottom: 1rem; }
.meta { display: flex; align-items: center; gap: 7px; font-size: 0.82rem; color: var(--text2); }
.btn-danger-sm { background: none; border: 1px solid #3b1515; color: var(--red); padding: 6px 12px; border-radius: 8px; font-size: 0.78rem; cursor: pointer; display: flex; align-items: center; gap: 4px; font-family: var(--font-body); }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 1rem; }
.modal { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 1.75rem; width: 100%; max-width: 440px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
.modal-header h3 { font-family: var(--font-display); font-size: 1.2rem; font-weight: 800; }
.modal-close { background: none; border: none; color: var(--text3); font-size: 20px; cursor: pointer; }
.field { margin-bottom: 1rem; }
.field label { display: block; font-size: 0.82rem; color: var(--text2); margin-bottom: 5px; }
.field input, .select-input { width: 100%; background: var(--surface2); border: 1px solid var(--border); color: var(--text); padding: 10px 14px; border-radius: 10px; font-size: 0.9rem; font-family: var(--font-body); outline: none; }
.field input:focus, .select-input:focus { border-color: var(--green); }
.modal-actions { display: flex; gap: 10px; margin-top: 1.5rem; }
.btn-outline-lg { flex: 1; background: transparent; border: 1px solid var(--border); color: var(--text2); padding: 11px; border-radius: 10px; font-size: 0.9rem; cursor: pointer; font-family: var(--font-body); }
.btn-primary-lg { flex: 1; background: var(--green); color: #0a0f0d; border: none; padding: 11px; border-radius: 10px; font-size: 0.9rem; font-weight: 700; cursor: pointer; font-family: var(--font-body); display: flex; align-items: center; justify-content: center; gap: 6px; }
.spin { animation: spin 1s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 640px) { .page { padding: 1rem; } .summary { grid-template-columns: 1fr 1fr; } }
</style>
