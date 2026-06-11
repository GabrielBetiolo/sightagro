<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '../composables/useApi'

const periodo = ref('mes')
const fazendas = ref<any[]>([])
const sensores = ref<any[]>([])
const alertas = ref<any[]>([])
const loading = ref(true)
const showPreview = ref(false)
const relatorioAtual = ref<any>(null)
const gerando = ref(false)

async function fetchDados() {
  loading.value = true
  try {
    const [f, s, a] = await Promise.all([
      api.get('/fazendas'),
      api.get('/sensores'),
      api.get('/alertas')
    ])
    fazendas.value = f
    sensores.value = s
    alertas.value = a
  } finally { loading.value = false }
}

function gerarRelatorio(tipo: string) {
  const now = new Date()
  const periodoLabel = periodo.value === 'semana' ? 'Esta semana' : periodo.value === 'mes' ? 'Este mês' : 'Este ano'

  if (tipo === 'fazendas') {
    return {
      titulo: 'Relatório de Fazendas',
      periodo: periodoLabel,
      dados: fazendas.value.map(f => ({
        label: f.nome,
        valor: `${f.area} ha · ${f.cultura} · ${f.localizacao}`
      }))
    }
  }
  if (tipo === 'sensores') {
    const online = sensores.value.filter(s => s.status === 'online').length
    const offline = sensores.value.filter(s => s.status === 'offline').length
    return {
      titulo: 'Relatório de Sensores',
      periodo: periodoLabel,
      dados: [
        { label: 'Total de sensores', valor: String(sensores.value.length) },
        { label: 'Online', valor: String(online) },
        { label: 'Offline', valor: String(offline) },
        { label: 'Disponibilidade', valor: sensores.value.length ? `${((online / sensores.value.length) * 100).toFixed(0)}%` : '—' },
        ...sensores.value.map(s => ({ label: `Sensor ${s.codigo} (${s.tipo})`, valor: s.leituras?.[0] ? `${s.leituras[0].valor} ${s.leituras[0].unidade}` : 'Sem leitura' }))
      ]
    }
  }
  if (tipo === 'alertas') {
    const criticos = alertas.value.filter(a => a.tipo === 'danger').length
    const avisos = alertas.value.filter(a => a.tipo === 'warning').length
    const naoLidos = alertas.value.filter(a => !a.lido).length
    return {
      titulo: 'Relatório de Alertas',
      periodo: periodoLabel,
      dados: [
        { label: 'Total de alertas', valor: String(alertas.value.length) },
        { label: 'Críticos', valor: String(criticos) },
        { label: 'Avisos', valor: String(avisos) },
        { label: 'Não lidos', valor: String(naoLidos) },
        ...alertas.value.slice(0, 10).map(a => ({ label: a.titulo, valor: `${a.fazenda?.nome} · ${new Date(a.createdAt).toLocaleDateString('pt-BR')}` }))
      ]
    }
  }
  if (tipo === 'irrigacao') {
    return {
      titulo: 'Relatório de Irrigação',
      periodo: periodoLabel,
      dados: fazendas.value.map(f => ({
        label: f.nome,
        valor: `${f.irrigacoes?.filter((i:any) => i.ativa).length || 0} zonas ativas`
      }))
    }
  }
  return null
}

function abrirPreview(tipo: string) {
  relatorioAtual.value = gerarRelatorio(tipo)
  showPreview.value = true
}

function baixarCSV(rel: any) {
  gerando.value = true
  setTimeout(() => {
    const linhas = ['Indicador,Valor', ...rel.dados.map((d: any) => `"${d.label}","${d.valor}"`)]
    const csv = '\ufeff' + linhas.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${rel.titulo.replace(/ /g,'_')}_${periodo.value}.csv`
    a.click()
    URL.revokeObjectURL(url)
    gerando.value = false
  }, 400)
}

const relatorios = [
  { id: 'fazendas', titulo: 'Fazendas', desc: 'Resumo de todas as propriedades cadastradas', icon: 'ti-map', color: '#4ade80' },
  { id: 'sensores', titulo: 'Sensores & Telemetria', desc: 'Status, disponibilidade e últimas leituras', icon: 'ti-activity', color: '#22d3ee' },
  { id: 'alertas', titulo: 'Alertas', desc: 'Histórico de alertas por fazenda e tipo', icon: 'ti-bell', color: '#facc15' },
  { id: 'irrigacao', titulo: 'Irrigação', desc: 'Zonas ativas e consumo de água', icon: 'ti-droplets', color: '#a78bfa' },
]

onMounted(fetchDados)
</script>

<template>
  <div class="page">
    <div class="header">
      <div>
        <h1 class="page-title">Relatórios</h1>
        <p class="page-sub">Análises e exportações</p>
      </div>
      <div class="periodo-select">
        <button v-for="p in [{k:'semana',l:'Semana'},{k:'mes',l:'Mês'},{k:'ano',l:'Ano'}]" :key="p.k"
          class="periodo-btn" :class="{ active: periodo === p.k }" @click="periodo = p.k">
          {{ p.l }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <i class="ti ti-loader-2 spin"></i> Carregando dados...
    </div>

    <div v-else-if="fazendas.length === 0" class="empty-state">
      <div class="empty-icon"><i class="ti ti-chart-bar-off"></i></div>
      <h3>Nenhum dado para gerar relatórios</h3>
      <p>Cadastre fazendas e sensores para começar a gerar relatórios.</p>
    </div>

    <div v-else class="reports-grid">
      <div v-for="r in relatorios" :key="r.id" class="report-card" :style="`--c:${r.color}`">
        <div class="report-icon" :style="`background:${r.color}22;color:${r.color}`">
          <i :class="['ti', r.icon]"></i>
        </div>
        <div class="report-info">
          <h3>{{ r.titulo }}</h3>
          <p>{{ r.desc }}</p>
        </div>
        <div class="report-actions">
          <button class="btn-view" @click="abrirPreview(r.id)"><i class="ti ti-eye"></i> Visualizar</button>
          <button class="btn-export" @click="baixarCSV(gerarRelatorio(r.id))" :disabled="gerando" title="Baixar CSV">
            <i class="ti ti-download"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL PREVIEW -->
    <div v-if="showPreview && relatorioAtual" class="modal-overlay" @click.self="showPreview = false">
      <div class="modal">
        <div class="modal-header">
          <div>
            <h3>{{ relatorioAtual.titulo }}</h3>
            <p style="font-size:0.78rem;color:var(--text3);margin-top:2px">{{ relatorioAtual.periodo }}</p>
          </div>
          <button class="modal-close" @click="showPreview = false"><i class="ti ti-x"></i></button>
        </div>

        <div v-if="relatorioAtual.dados.length === 0" class="empty-preview">
          <p>Nenhum dado disponível para este período.</p>
        </div>
        <div v-else class="preview-dados">
          <div v-for="d in relatorioAtual.dados" :key="d.label" class="dado-row">
            <span class="dado-label">{{ d.label }}</span>
            <span class="dado-val">{{ d.valor }}</span>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-outline-lg" @click="showPreview = false">Fechar</button>
          <button class="btn-primary-lg" @click="baixarCSV(relatorioAtual); showPreview = false" :disabled="gerando">
            <i class="ti ti-download"></i> Baixar CSV
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
.periodo-select { display: flex; gap: 4px; background: var(--surface); border: 1px solid var(--border); padding: 4px; border-radius: 12px; }
.periodo-btn { background: none; border: none; color: var(--text3); padding: 7px 16px; border-radius: 8px; font-size: 0.85rem; cursor: pointer; font-family: var(--font-body); transition: all 0.2s; }
.periodo-btn.active { background: var(--green); color: #0a0f0d; font-weight: 700; }
.loading-state { display: flex; align-items: center; gap: 8px; color: var(--text3); padding: 3rem; justify-content: center; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 4rem 2rem; text-align: center; background: var(--surface); border: 2px dashed var(--border); border-radius: 20px; }
.empty-icon { width: 64px; height: 64px; background: var(--surface2); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 28px; color: var(--text3); }
.empty-state h3 { font-family: var(--font-display); font-size: 1.2rem; font-weight: 800; }
.empty-state p { color: var(--text3); font-size: 0.88rem; max-width: 320px; line-height: 1.6; }
.reports-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px,1fr)); gap: 1rem; }
.report-card { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: 1.5rem; display: flex; align-items: center; gap: 1rem; transition: border-color 0.2s; }
.report-card:hover { border-color: var(--c); }
.report-icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
.report-info { flex: 1; }
.report-info h3 { font-family: var(--font-display); font-size: 0.95rem; font-weight: 800; margin-bottom: 3px; }
.report-info p { font-size: 0.8rem; color: var(--text3); line-height: 1.4; }
.report-actions { display: flex; gap: 6px; }
.btn-view { background: var(--surface2); border: 1px solid var(--border); color: var(--text2); padding: 7px 12px; border-radius: 10px; font-size: 0.78rem; cursor: pointer; display: flex; align-items: center; gap: 5px; font-family: var(--font-body); white-space: nowrap; transition: all 0.2s; }
.btn-view:hover { border-color: var(--c); color: var(--c); }
.btn-export { background: var(--surface2); border: 1px solid var(--border); color: var(--text2); padding: 7px 10px; border-radius: 10px; font-size: 16px; cursor: pointer; transition: all 0.2s; }
.btn-export:hover:not(:disabled) { border-color: var(--green); color: var(--green); }
.btn-export:disabled { opacity: 0.5; cursor: not-allowed; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 1rem; }
.modal { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 1.75rem; width: 100%; max-width: 480px; max-height: 85vh; display: flex; flex-direction: column; }
.modal-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; }
.modal-header h3 { font-family: var(--font-display); font-size: 1.2rem; font-weight: 800; }
.modal-close { background: none; border: none; color: var(--text3); font-size: 20px; cursor: pointer; }
.empty-preview { padding: 2rem; text-align: center; color: var(--text3); }
.preview-dados { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
.dado-row { display: flex; justify-content: space-between; align-items: flex-start; background: var(--surface2); border-radius: 10px; padding: 10px 14px; gap: 1rem; }
.dado-label { font-size: 0.82rem; color: var(--text3); }
.dado-val { font-size: 0.88rem; font-weight: 500; text-align: right; }
.modal-actions { display: flex; gap: 10px; margin-top: 1.25rem; }
.btn-outline-lg { flex: 1; background: transparent; border: 1px solid var(--border); color: var(--text2); padding: 11px; border-radius: 10px; font-size: 0.9rem; cursor: pointer; font-family: var(--font-body); }
.btn-primary-lg { flex: 1; background: var(--green); color: #0a0f0d; border: none; padding: 11px; border-radius: 10px; font-size: 0.9rem; font-weight: 700; cursor: pointer; font-family: var(--font-body); display: flex; align-items: center; justify-content: center; gap: 6px; }
.spin { animation: spin 1s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 640px) { .page { padding: 1rem; } .report-card { flex-wrap: wrap; } }
</style>
