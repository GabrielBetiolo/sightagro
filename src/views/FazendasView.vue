<script setup lang="ts">
import { ref } from 'vue'

const showModal = ref(false)
const showDetalhes = ref(false)
const showEditar = ref(false)
const fazendaSelecionada = ref<any>(null)
const newFazenda = ref({ nome: '', localizacao: '', area: '', cultura: '' })

const fazendas = ref([
  { id: 1, nome: 'Fazenda São João', localizacao: 'Mato Grosso, BR', area: '1.200 ha', cultura: 'Soja', saude: 92, sensores: 12, status: 'ativa', irrigacao: 'Ativa', energia: '81%', agua: '67%' },
  { id: 2, nome: 'Fazenda Aurora', localizacao: 'Goiás, BR', area: '840 ha', cultura: 'Milho', saude: 78, sensores: 8, status: 'ativa', irrigacao: 'Inativa', energia: '65%', agua: '54%' },
  { id: 3, nome: 'Fazenda Boa Esperança', localizacao: 'Paraná, BR', area: '560 ha', cultura: 'Trigo', saude: 65, sensores: 6, status: 'alerta', irrigacao: 'Ativa', energia: '42%', agua: '88%' },
])

const editForm = ref({ nome: '', localizacao: '', area: '', cultura: '' })

function saudeColor(val: number) {
  if (val >= 85) return '#4ade80'
  if (val >= 65) return '#facc15'
  return '#f87171'
}

function abrirDetalhes(f: any) {
  fazendaSelecionada.value = f
  showDetalhes.value = true
}

function abrirEditar(f: any) {
  fazendaSelecionada.value = f
  editForm.value = { nome: f.nome, localizacao: f.localizacao, area: f.area, cultura: f.cultura }
  showEditar.value = true
}

function salvarEdicao() {
  const idx = fazendas.value.findIndex(f => f.id === fazendaSelecionada.value.id)
  if (idx !== -1) {
    fazendas.value[idx] = { ...fazendas.value[idx], ...editForm.value }
  }
  showEditar.value = false
}

function criarFazenda() {
  fazendas.value.push({
    id: Date.now(),
    nome: newFazenda.value.nome,
    localizacao: newFazenda.value.localizacao,
    area: newFazenda.value.area + ' ha',
    cultura: newFazenda.value.cultura,
    saude: 100,
    sensores: 0,
    status: 'ativa',
    irrigacao: 'Inativa',
    energia: '0%',
    agua: '0%'
  })
  showModal.value = false
  newFazenda.value = { nome: '', localizacao: '', area: '', cultura: '' }
}
</script>

<template>
  <div class="page">
    <div class="header">
      <div>
        <h1 class="page-title">Fazendas</h1>
        <p class="page-sub">{{ fazendas.length }} fazendas cadastradas</p>
      </div>
      <button class="btn-primary" @click="showModal = true">
        <i class="ti ti-plus"></i> Nova Fazenda
      </button>
    </div>

    <div class="farms-grid">
      <div v-for="f in fazendas" :key="f.id" class="farm-card">
        <div class="farm-header">
          <div class="farm-icon"><i class="ti ti-map-pin"></i></div>
          <span class="farm-status" :class="f.status">{{ f.status }}</span>
        </div>
        <h3 class="farm-name">{{ f.nome }}</h3>
        <p class="farm-loc"><i class="ti ti-location"></i> {{ f.localizacao }}</p>

        <div class="farm-meta">
          <div class="meta-item"><i class="ti ti-ruler-2"></i> {{ f.area }}</div>
          <div class="meta-item"><i class="ti ti-seeding"></i> {{ f.cultura }}</div>
          <div class="meta-item"><i class="ti ti-activity"></i> {{ f.sensores }} sensores</div>
        </div>

        <div class="farm-health">
          <div class="health-header">
            <span>Saúde</span>
            <span :style="`color:${saudeColor(f.saude)}`">{{ f.saude }}%</span>
          </div>
          <div class="prog-track">
            <div class="prog-fill" :style="`width:${f.saude}%;background:${saudeColor(f.saude)}`"></div>
          </div>
        </div>

        <div class="farm-actions">
          <button class="btn-outline" @click="abrirDetalhes(f)"><i class="ti ti-eye"></i> Ver</button>
          <button class="btn-outline" @click="abrirEditar(f)"><i class="ti ti-edit"></i> Editar</button>
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
        <div class="field">
          <label>Nome da fazenda</label>
          <input v-model="newFazenda.nome" type="text" placeholder="Ex: Fazenda São João" />
        </div>
        <div class="field">
          <label>Localização</label>
          <input v-model="newFazenda.localizacao" type="text" placeholder="Cidade, Estado" />
        </div>
        <div class="field-row">
          <div class="field">
            <label>Área (ha)</label>
            <input v-model="newFazenda.area" type="number" placeholder="0" />
          </div>
          <div class="field">
            <label>Cultura principal</label>
            <input v-model="newFazenda.cultura" type="text" placeholder="Ex: Soja" />
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-outline-lg" @click="showModal = false">Cancelar</button>
          <button class="btn-primary-lg" @click="criarFazenda">Criar Fazenda</button>
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
          <div class="detalhe-item">
            <span class="detalhe-label"><i class="ti ti-location"></i> Localização</span>
            <span class="detalhe-val">{{ fazendaSelecionada.localizacao }}</span>
          </div>
          <div class="detalhe-item">
            <span class="detalhe-label"><i class="ti ti-ruler-2"></i> Área</span>
            <span class="detalhe-val">{{ fazendaSelecionada.area }}</span>
          </div>
          <div class="detalhe-item">
            <span class="detalhe-label"><i class="ti ti-seeding"></i> Cultura</span>
            <span class="detalhe-val">{{ fazendaSelecionada.cultura }}</span>
          </div>
          <div class="detalhe-item">
            <span class="detalhe-label"><i class="ti ti-activity"></i> Sensores</span>
            <span class="detalhe-val">{{ fazendaSelecionada.sensores }}</span>
          </div>
          <div class="detalhe-item">
            <span class="detalhe-label"><i class="ti ti-droplets"></i> Irrigação</span>
            <span class="detalhe-val">{{ fazendaSelecionada.irrigacao }}</span>
          </div>
          <div class="detalhe-item">
            <span class="detalhe-label"><i class="ti ti-sun"></i> Energia Solar</span>
            <span class="detalhe-val">{{ fazendaSelecionada.energia }}</span>
          </div>
        </div>

        <div style="margin-top:1.5rem">
          <div class="detalhe-label" style="margin-bottom:8px"><i class="ti ti-heart-rate-monitor"></i> Saúde da Plantação</div>
          <div class="prog-track-lg">
            <div class="prog-fill-lg" :style="`width:${fazendaSelecionada.saude}%;background:${saudeColor(fazendaSelecionada.saude)}`"></div>
          </div>
          <span :style="`color:${saudeColor(fazendaSelecionada.saude)};font-size:0.85rem`">{{ fazendaSelecionada.saude }}%</span>
        </div>

        <div class="modal-actions" style="margin-top:1.5rem">
          <button class="btn-outline-lg" @click="showDetalhes = false">Fechar</button>
          <button class="btn-primary-lg" @click="showDetalhes = false; abrirEditar(fazendaSelecionada)">Editar Fazenda</button>
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
        <div class="field">
          <label>Nome da fazenda</label>
          <input v-model="editForm.nome" type="text" />
        </div>
        <div class="field">
          <label>Localização</label>
          <input v-model="editForm.localizacao" type="text" />
        </div>
        <div class="field-row">
          <div class="field">
            <label>Área</label>
            <input v-model="editForm.area" type="text" />
          </div>
          <div class="field">
            <label>Cultura principal</label>
            <input v-model="editForm.cultura" type="text" />
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-outline-lg" @click="showEditar = false">Cancelar</button>
          <button class="btn-primary-lg" @click="salvarEdicao">Salvar Alterações</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@400;500&display=swap');
@import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css');
.page { padding: 2.5rem; background: #0a0f0d; min-height: 100vh; color: #f0fdf4; font-family: 'DM Sans', sans-serif; }
.header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
.page-title { font-family: 'Syne', sans-serif; font-size: 2.5rem; font-weight: 800; letter-spacing: -0.03em; }
.page-sub { color: #6b7280; font-size: 0.9rem; margin-top: 4px; }
.btn-primary { background: #4ade80; color: #0a0f0d; border: none; padding: 10px 20px; border-radius: 30px; font-family: 'DM Sans', sans-serif; font-weight: 700; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s; }
.btn-primary:hover { background: #22c55e; }
.farms-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.25rem; }
.farm-card { background: #111a14; border: 1px solid #1e3020; border-radius: 20px; padding: 1.5rem; transition: border-color 0.2s; }
.farm-card:hover { border-color: #4ade80; }
.farm-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.farm-icon { width: 42px; height: 42px; background: #172110; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #4ade80; font-size: 20px; }
.farm-status { font-size: 0.72rem; padding: 4px 10px; border-radius: 20px; font-weight: 500; text-transform: capitalize; }
.farm-status.ativa { background: #1a2e1a; color: #4ade80; }
.farm-status.alerta { background: #2a2200; color: #facc15; }
.farm-name { font-family: 'Syne', sans-serif; font-size: 1.1rem; font-weight: 800; margin-bottom: 4px; }
.farm-loc { font-size: 0.82rem; color: #6b7280; display: flex; align-items: center; gap: 4px; margin-bottom: 1rem; }
.farm-meta { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 1.25rem; }
.meta-item { display: flex; align-items: center; gap: 5px; font-size: 0.78rem; color: #9ca3af; background: #172110; padding: 5px 10px; border-radius: 8px; }
.farm-health { margin-bottom: 1.25rem; }
.health-header { display: flex; justify-content: space-between; font-size: 0.82rem; color: #9ca3af; margin-bottom: 6px; }
.prog-track { background: #1a2e1a; height: 6px; border-radius: 4px; overflow: hidden; }
.prog-fill { height: 100%; border-radius: 4px; transition: width 1s; }
.prog-track-lg { background: #1a2e1a; height: 10px; border-radius: 6px; overflow: hidden; margin-bottom: 6px; }
.prog-fill-lg { height: 100%; border-radius: 6px; transition: width 1s; }
.farm-actions { display: flex; gap: 8px; }
.btn-outline { flex: 1; background: transparent; border: 1px solid #1e3020; color: #9ca3af; padding: 8px; border-radius: 10px; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px; font-family: 'DM Sans', sans-serif; transition: all 0.2s; }
.btn-outline:hover { border-color: #4ade80; color: #4ade80; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal { background: #111a14; border: 1px solid #1e3020; border-radius: 24px; padding: 2rem; width: 100%; max-width: 480px; }
.modal-lg { max-width: 560px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.modal-header h3 { font-family: 'Syne', sans-serif; font-size: 1.3rem; font-weight: 800; }
.modal-close { background: none; border: none; color: #6b7280; font-size: 20px; cursor: pointer; }
.field { margin-bottom: 1rem; }
.field label { display: block; font-size: 0.82rem; color: #9ca3af; margin-bottom: 6px; }
.field input { width: 100%; background: #172110; border: 1px solid #1e3020; color: #f0fdf4; padding: 10px 14px; border-radius: 10px; font-size: 0.9rem; font-family: 'DM Sans', sans-serif; outline: none; }
.field input:focus { border-color: #4ade80; }
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.modal-actions { display: flex; gap: 10px; margin-top: 1.5rem; }
.btn-outline-lg { flex: 1; background: transparent; border: 1px solid #1e3020; color: #9ca3af; padding: 12px; border-radius: 12px; font-size: 0.9rem; cursor: pointer; font-family: 'DM Sans', sans-serif; }
.btn-primary-lg { flex: 1; background: #4ade80; color: #0a0f0d; border: none; padding: 12px; border-radius: 12px; font-size: 0.9rem; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; }
.detalhes-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.detalhe-item { background: #172110; border-radius: 12px; padding: 12px 14px; }
.detalhe-label { font-size: 0.78rem; color: #6b7280; display: flex; align-items: center; gap: 5px; margin-bottom: 4px; }
.detalhe-val { font-size: 0.95rem; font-weight: 500; }
</style>
