<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '../composables/useApi'
import { useClima } from '../composables/useClima'

const { clima, fetchClima } = useClima()
const fazendas = ref<any[]>([])
const loading = ref(true)
const showModal = ref(false)
const showDetalhes = ref(false)
const showEditar = ref(false)
const fazendaSelecionada = ref<any>(null)
const criando = ref(false)
const salvando = ref(false)

const newFazenda = ref({ nome: '', localizacao: '', area: '', cultura: '' })
const editForm = ref({ nome: '', localizacao: '', area: '', cultura: '' })

async function fetchFazendas() {
  loading.value = true
  try { fazendas.value = await api.get('/fazendas') }
  finally { loading.value = false }
}

async function criarFazenda() {
  if (!newFazenda.value.nome) return
  criando.value = true
  try {
    await api.post('/fazendas', {
      nome: newFazenda.value.nome,
      localizacao: newFazenda.value.localizacao,
      area: Number(newFazenda.value.area) || 0,
      cultura: newFazenda.value.cultura
    })
    showModal.value = false
    newFazenda.value = { nome: '', localizacao: '', area: '', cultura: '' }
    await fetchFazendas()
  } finally { criando.value = false }
}

async function salvarEdicao() {
  salvando.value = true
  try {
    await api.put(`/fazendas/${fazendaSelecionada.value.id}`, {
      nome: editForm.value.nome,
      localizacao: editForm.value.localizacao,
      area: Number(editForm.value.area),
      cultura: editForm.value.cultura
    })
    showEditar.value = false
    await fetchFazendas()
  } finally { salvando.value = false }
}

async function deletarFazenda(id: number) {
  if (!confirm('Deletar esta fazenda? Todos os sensores e alertas serão removidos.')) return
  await api.delete(`/fazendas/${id}`)
  await fetchFazendas()
}

async function abrirDetalhes(f: any) {
  fazendaSelecionada.value = f
  showDetalhes.value = true
  await fetchClima(f.id)
}

function abrirEditar(f: any) {
  fazendaSelecionada.value = f
  editForm.value = { nome: f.nome, localizacao: f.localizacao, area: String(f.area), cultura: f.cultura }
  showEditar.value = true
}

function saudeColor(sensores: any[]) {
  if (!sensores?.length) return '#6b7280'
  const online = sensores.filter(s => s.status === 'online').length
  const pct = (online / sensores.length) * 100
  if (pct >= 80) return '#4ade80'
  if (pct >= 50) return '#facc15'
  return '#f87171'
}

onMounted(fetchFazendas)
</script>

<template>
  <div class="page">
    <div class="header">
      <div>
        <h1 class="page-title">Fazendas</h1>
        <p class="page-sub">{{ fazendas.length }} cadastradas</p>
      </div>
      <button class="btn-primary" @click="showModal = true">
        <i class="ti ti-plus"></i> Nova Fazenda
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <i class="ti ti-loader-2 spin"></i> Carregando fazendas...
    </div>

    <div v-else-if="fazendas.length === 0" class="empty-state">
      <div class="empty-icon"><i class="ti ti-map-pin-off"></i></div>
      <h3>Nenhuma fazenda cadastrada</h3>
      <p>Adicione sua primeira fazenda para começar o monitoramento.</p>
      <button class="btn-primary" @click="showModal = true"><i class="ti ti-plus"></i> Adicionar fazenda</button>
    </div>

    <div v-else class="farms-grid">
      <div v-for="f in fazendas" :key="f.id" class="farm-card">
        <div class="farm-header">
          <div class="farm-icon"><i class="ti ti-map-pin"></i></div>
          <span class="farm-status" :class="f.status">{{ f.status }}</span>
        </div>
        <h3 class="farm-name">{{ f.nome }}</h3>
        <p class="farm-loc"><i class="ti ti-location"></i> {{ f.localizacao }}</p>
        <div class="farm-meta">
          <div class="meta-item"><i class="ti ti-ruler-2"></i> {{ f.area }} ha</div>
          <div class="meta-item"><i class="ti ti-seeding"></i> {{ f.cultura }}</div>
          <div class="meta-item"><i class="ti ti-activity"></i> {{ f._count?.sensores || f.sensores?.length || 0 }} sensores</div>
        </div>
        <div class="farm-health">
          <div class="health-header"><span>Sensores</span>
            <span :style="`color:${saudeColor(f.sensores)}`">
              {{ f.sensores?.filter((s:any)=>s.status==='online').length || 0 }}/{{ f.sensores?.length || 0 }} online
            </span>
          </div>
          <div class="prog-track">
            <div class="prog-fill" :style="`width:${f.sensores?.length ? (f.sensores.filter((s:any)=>s.status==='online').length/f.sensores.length*100) : 0}%;background:${saudeColor(f.sensores)}`"></div>
          </div>
        </div>
        <div class="farm-actions">
          <button class="btn-outline" @click="abrirDetalhes(f)"><i class="ti ti-eye"></i> Ver</button>
          <button class="btn-outline" @click="abrirEditar(f)"><i class="ti ti-edit"></i> Editar</button>
          <button class="btn-outline danger" @click="deletarFazenda(f.id)"><i class="ti ti-trash"></i></button>
        </div>
      </div>
    </div>

    <!-- MODAL NOVA FAZENDA -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>Nova Fazenda</h3>
          <button class="modal-close" @click="showModal = false"><i class="ti ti-x"></i></button>
        </div>
        <div class="field"><label>Nome *</label><input v-model="newFazenda.nome" type="text" placeholder="Ex: Fazenda São João" /></div>
        <div class="field">
          <label>Cidade, Estado *</label>
          <input v-model="newFazenda.localizacao" type="text" placeholder="Ex: Sorriso, MT" />
          <span class="field-hint"><i class="ti ti-cloud"></i> Usado para previsão do tempo</span>
        </div>
        <div class="field-row">
          <div class="field"><label>Área (ha)</label><input v-model="newFazenda.area" type="number" placeholder="0" /></div>
          <div class="field"><label>Cultura</label><input v-model="newFazenda.cultura" type="text" placeholder="Ex: Soja" /></div>
        </div>
        <div class="modal-actions">
          <button class="btn-outline-lg" @click="showModal = false">Cancelar</button>
          <button class="btn-primary-lg" @click="criarFazenda" :disabled="criando">
            <i v-if="criando" class="ti ti-loader-2 spin"></i><span v-else>Criar</span>
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL DETALHES -->
    <div v-if="showDetalhes && fazendaSelecionada" class="modal-overlay" @click.self="showDetalhes = false">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3>{{ fazendaSelecionada.nome }}</h3>
          <button class="modal-close" @click="showDetalhes = false"><i class="ti ti-x"></i></button>
        </div>
        <div class="detalhes-grid">
          <div class="detalhe-item"><span class="detalhe-label"><i class="ti ti-location"></i> Localização</span><span>{{ fazendaSelecionada.localizacao }}</span></div>
          <div class="detalhe-item"><span class="detalhe-label"><i class="ti ti-ruler-2"></i> Área</span><span>{{ fazendaSelecionada.area }} ha</span></div>
          <div class="detalhe-item"><span class="detalhe-label"><i class="ti ti-seeding"></i> Cultura</span><span>{{ fazendaSelecionada.cultura }}</span></div>
          <div class="detalhe-item"><span class="detalhe-label"><i class="ti ti-activity"></i> Sensores</span><span>{{ fazendaSelecionada.sensores?.length || 0 }}</span></div>
        </div>
        <div v-if="clima" class="clima-section">
          <div class="clima-header"><i class="ti ti-cloud"></i> Clima atual</div>
          <div class="clima-row">
            <img :src="`https://openweathermap.org/img/wn/${clima.atual.icone}@2x.png`" width="48" />
            <div class="clima-info">
              <div class="clima-temp">{{ clima.atual.temp.toFixed(1) }}°C</div>
              <div class="clima-desc">{{ clima.atual.descricao }}</div>
            </div>
            <div class="clima-extras">
              <div><i class="ti ti-droplet" style="color:#22d3ee"></i> {{ clima.atual.umidade }}%</div>
              <div><i class="ti ti-wind" style="color:#a78bfa"></i> {{ clima.atual.vento.toFixed(1) }} m/s</div>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-outline-lg" @click="showDetalhes = false">Fechar</button>
          <button class="btn-primary-lg" @click="showDetalhes = false; abrirEditar(fazendaSelecionada)">Editar</button>
        </div>
      </div>
    </div>

    <!-- MODAL EDITAR -->
    <div v-if="showEditar && fazendaSelecionada" class="modal-overlay" @click.self="showEditar = false">
      <div class="modal">
        <div class="modal-header">
          <h3>Editar Fazenda</h3>
          <button class="modal-close" @click="showEditar = false"><i class="ti ti-x"></i></button>
        </div>
        <div class="field"><label>Nome</label><input v-model="editForm.nome" type="text" /></div>
        <div class="field"><label>Localização</label><input v-model="editForm.localizacao" type="text" /></div>
        <div class="field-row">
          <div class="field"><label>Área (ha)</label><input v-model="editForm.area" type="number" /></div>
          <div class="field"><label>Cultura</label><input v-model="editForm.cultura" type="text" /></div>
        </div>
        <div class="modal-actions">
          <button class="btn-outline-lg" @click="showEditar = false">Cancelar</button>
          <button class="btn-primary-lg" @click="salvarEdicao" :disabled="salvando">
            <i v-if="salvando" class="ti ti-loader-2 spin"></i><span v-else>Salvar</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { padding: 2rem; background: var(--bg); min-height: 100vh; color: var(--text); font-family: var(--font-body); }
.header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
.page-title { font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; letter-spacing: -0.03em; }
.page-sub { color: var(--text3); font-size: 0.9rem; margin-top: 4px; }
.btn-primary { background: var(--green); color: #0a0f0d; border: none; padding: 10px 18px; border-radius: 30px; font-family: var(--font-body); font-weight: 700; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 6px; }
.loading-state { display: flex; align-items: center; gap: 8px; color: var(--text3); padding: 3rem; justify-content: center; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 4rem 2rem; text-align: center; background: var(--surface); border: 2px dashed var(--border); border-radius: 20px; }
.empty-icon { width: 64px; height: 64px; background: var(--surface2); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 28px; color: var(--text3); }
.empty-state h3 { font-family: var(--font-display); font-size: 1.2rem; font-weight: 800; }
.empty-state p { color: var(--text3); font-size: 0.88rem; max-width: 320px; line-height: 1.6; }
.farms-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px,1fr)); gap: 1.25rem; }
.farm-card { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: 1.5rem; transition: border-color 0.2s; }
.farm-card:hover { border-color: var(--green); }
.farm-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.farm-icon { width: 40px; height: 40px; background: var(--surface2); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--green); font-size: 18px; }
.farm-status { font-size: 0.72rem; padding: 3px 10px; border-radius: 20px; font-weight: 500; text-transform: capitalize; background: var(--surface2); color: var(--text3); }
.farm-status.ativa { background: #1a2e1a; color: var(--green); }
.farm-status.alerta { background: #2a2200; color: var(--yellow); }
.farm-name { font-family: var(--font-display); font-size: 1.1rem; font-weight: 800; margin-bottom: 4px; }
.farm-loc { font-size: 0.82rem; color: var(--text3); display: flex; align-items: center; gap: 4px; margin-bottom: 1rem; }
.farm-meta { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 1.25rem; }
.meta-item { display: flex; align-items: center; gap: 4px; font-size: 0.75rem; color: var(--text2); background: var(--surface2); padding: 4px 9px; border-radius: 8px; }
.farm-health { margin-bottom: 1.25rem; }
.health-header { display: flex; justify-content: space-between; font-size: 0.78rem; color: var(--text3); margin-bottom: 6px; }
.prog-track { background: var(--surface2); height: 6px; border-radius: 4px; overflow: hidden; }
.prog-fill { height: 100%; border-radius: 4px; transition: width 1s; }
.farm-actions { display: flex; gap: 6px; }
.btn-outline { flex: 1; background: transparent; border: 1px solid var(--border); color: var(--text2); padding: 8px; border-radius: 10px; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px; font-family: var(--font-body); transition: all 0.2s; }
.btn-outline:hover { border-color: var(--green); color: var(--green); }
.btn-outline.danger { flex: 0; padding: 8px 12px; }
.btn-outline.danger:hover { border-color: var(--red); color: var(--red); }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 1rem; }
.modal { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 1.75rem; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; }
.modal-lg { max-width: 560px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
.modal-header h3 { font-family: var(--font-display); font-size: 1.2rem; font-weight: 800; }
.modal-close { background: none; border: none; color: var(--text3); font-size: 20px; cursor: pointer; }
.field { margin-bottom: 1rem; }
.field label { display: block; font-size: 0.82rem; color: var(--text2); margin-bottom: 5px; }
.field input { width: 100%; background: var(--surface2); border: 1px solid var(--border); color: var(--text); padding: 10px 14px; border-radius: 10px; font-size: 0.9rem; font-family: var(--font-body); outline: none; }
.field input:focus { border-color: var(--green); }
.field-hint { font-size: 0.75rem; color: var(--text3); margin-top: 4px; display: flex; align-items: center; gap: 3px; }
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.modal-actions { display: flex; gap: 10px; margin-top: 1.5rem; }
.btn-outline-lg { flex: 1; background: transparent; border: 1px solid var(--border); color: var(--text2); padding: 11px; border-radius: 10px; font-size: 0.9rem; cursor: pointer; font-family: var(--font-body); }
.btn-primary-lg { flex: 1; background: var(--green); color: #0a0f0d; border: none; padding: 11px; border-radius: 10px; font-size: 0.9rem; font-weight: 700; cursor: pointer; font-family: var(--font-body); display: flex; align-items: center; justify-content: center; gap: 6px; }
.detalhes-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem; }
.detalhe-item { background: var(--surface2); border-radius: 12px; padding: 12px 14px; }
.detalhe-label { font-size: 0.75rem; color: var(--text3); display: flex; align-items: center; gap: 4px; margin-bottom: 4px; }
.clima-section { background: var(--surface2); border-radius: 14px; padding: 1rem; margin-bottom: 1.25rem; }
.clima-header { font-size: 0.82rem; color: var(--text3); display: flex; align-items: center; gap: 5px; margin-bottom: 0.75rem; }
.clima-row { display: flex; align-items: center; gap: 1rem; }
.clima-temp { font-family: var(--font-display); font-size: 1.6rem; font-weight: 800; }
.clima-desc { font-size: 0.8rem; color: var(--text3); text-transform: capitalize; }
.clima-extras { display: flex; flex-direction: column; gap: 4px; font-size: 0.82rem; color: var(--text2); margin-left: auto; }
.spin { animation: spin 1s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 640px) { .page { padding: 1rem; } .detalhes-grid { grid-template-columns: 1fr; } }
</style>
