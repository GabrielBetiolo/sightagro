<script setup lang="ts">
import { ref } from 'vue'

const periodo = ref('mes')
const showPreview = ref(false)
const relatorioAtual = ref<any>(null)
const gerando = ref(false)

const relatorios = [
  {
    titulo: 'Produção Mensal',
    desc: 'Comparativo de produção por cultura e setor',
    icon: 'ti-chart-bar',
    color: '#4ade80',
    dados: [
      { label: 'Soja - Setor A', valor: '+14%' },
      { label: 'Soja - Setor B', valor: '+9%' },
      { label: 'Milho - Setor C', valor: '+11%' },
      { label: 'Trigo - Setor D', valor: '+6%' },
    ]
  },
  {
    titulo: 'Consumo de Água',
    desc: 'Uso de irrigação e índices pluviométricos',
    icon: 'ti-droplet',
    color: '#22d3ee',
    dados: [
      { label: 'Irrigação total', valor: '142 m³' },
      { label: 'Chuva acumulada', valor: '38 mm' },
      { label: 'Economia vs mês ant.', valor: '-8%' },
      { label: 'Eficiência hídrica', valor: '91%' },
    ]
  },
  {
    titulo: 'Energia Solar',
    desc: 'Geração e consumo de energia fotovoltaica',
    icon: 'ti-sun',
    color: '#facc15',
    dados: [
      { label: 'Energia gerada', valor: '1.840 kWh' },
      { label: 'Energia consumida', valor: '1.210 kWh' },
      { label: 'Excedente', valor: '630 kWh' },
      { label: 'Economia financeira', valor: 'R$ 480' },
    ]
  },
  {
    titulo: 'Saúde das Plantações',
    desc: 'Índice de saúde e alertas fitossanitários',
    icon: 'ti-seeding',
    color: '#a78bfa',
    dados: [
      { label: 'Índice médio de saúde', valor: '87%' },
      { label: 'Alertas ativos', valor: '2' },
      { label: 'Alertas resolvidos', valor: '7' },
      { label: 'Plantações críticas', valor: '1' },
    ]
  },
  {
    titulo: 'Sensores & Telemetria',
    desc: 'Histórico de leituras e disponibilidade',
    icon: 'ti-activity',
    color: '#f87171',
    dados: [
      { label: 'Sensores ativos', valor: '3/4' },
      { label: 'Leituras no período', valor: '8.640' },
      { label: 'Disponibilidade', valor: '94%' },
      { label: 'Alertas de sensor', valor: '1' },
    ]
  },
  {
    titulo: 'Financeiro',
    desc: 'Custos operacionais e projeção de receita',
    icon: 'ti-coin',
    color: '#fb923c',
    dados: [
      { label: 'Receita projetada', valor: 'R$ 142.000' },
      { label: 'Custos operacionais', valor: 'R$ 38.500' },
      { label: 'Margem estimada', valor: '73%' },
      { label: 'vs mês anterior', valor: '+5%' },
    ]
  },
]

function abrirPreview(r: any) {
  relatorioAtual.value = r
  showPreview.value = true
}

function baixarCSV(r: any) {
  gerando.value = true
  setTimeout(() => {
    const linhas = ['Indicador,Valor', ...r.dados.map((d: any) => `${d.label},${d.valor}`)]
    const csv = linhas.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${r.titulo.replace(/ /g, '_')}_${periodo.value}.csv`
    a.click()
    URL.revokeObjectURL(url)
    gerando.value = false
  }, 600)
}
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

    <div class="reports-grid">
      <div v-for="r in relatorios" :key="r.titulo" class="report-card" :style="`--c:${r.color}`">
        <div class="report-icon" :style="`background:${r.color}22;color:${r.color}`">
          <i :class="['ti', r.icon]"></i>
        </div>
        <div class="report-info">
          <h3>{{ r.titulo }}</h3>
          <p>{{ r.desc }}</p>
        </div>
        <div class="report-actions">
          <button class="btn-view" @click="abrirPreview(r)"><i class="ti ti-eye"></i> Visualizar</button>
          <button class="btn-export" @click="baixarCSV(r)" :disabled="gerando" title="Baixar CSV">
            <i class="ti ti-download"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL PREVIEW -->
    <div v-if="showPreview && relatorioAtual" class="modal-overlay" @click.self="showPreview = false">
      <div class="modal">
        <div class="modal-header">
          <div style="display:flex;align-items:center;gap:12px">
            <div class="preview-icon" :style="`background:${relatorioAtual.color}22;color:${relatorioAtual.color}`">
              <i :class="['ti', relatorioAtual.icon]"></i>
            </div>
            <div>
              <h3>{{ relatorioAtual.titulo }}</h3>
              <p style="font-size:0.8rem;color:#6b7280;margin-top:2px">Período: {{ periodo === 'semana' ? 'Esta semana' : periodo === 'mes' ? 'Este mês' : 'Este ano' }}</p>
            </div>
          </div>
          <button class="modal-close" @click="showPreview = false"><i class="ti ti-x"></i></button>
        </div>

        <div class="preview-dados">
          <div v-for="d in relatorioAtual.dados" :key="d.label" class="dado-row">
            <span class="dado-label">{{ d.label }}</span>
            <span class="dado-val" :style="`color:${relatorioAtual.color}`">{{ d.valor }}</span>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-outline-lg" @click="showPreview = false">Fechar</button>
          <button class="btn-primary-lg" @click="baixarCSV(relatorioAtual); showPreview = false">
            <i class="ti ti-download"></i> Baixar CSV
          </button>
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
.periodo-select { display: flex; gap: 4px; background: #111a14; border: 1px solid #1e3020; padding: 4px; border-radius: 12px; }
.periodo-btn { background: none; border: none; color: #6b7280; padding: 7px 16px; border-radius: 8px; font-size: 0.85rem; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s; }
.periodo-btn.active { background: #4ade80; color: #0a0f0d; font-weight: 700; }
.reports-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1rem; }
.report-card { background: #111a14; border: 1px solid #1e3020; border-radius: 18px; padding: 1.5rem; display: flex; align-items: center; gap: 1rem; transition: border-color 0.2s; }
.report-card:hover { border-color: var(--c); }
.report-icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
.report-info { flex: 1; }
.report-info h3 { font-family: 'Syne', sans-serif; font-size: 0.95rem; font-weight: 800; margin-bottom: 3px; }
.report-info p { font-size: 0.8rem; color: #6b7280; line-height: 1.4; }
.report-actions { display: flex; gap: 6px; }
.btn-view { background: #172110; border: 1px solid #1e3020; color: #9ca3af; padding: 7px 12px; border-radius: 10px; font-size: 0.78rem; cursor: pointer; display: flex; align-items: center; gap: 5px; font-family: 'DM Sans', sans-serif; white-space: nowrap; transition: all 0.2s; }
.btn-view:hover { border-color: var(--c); color: var(--c); }
.btn-export { background: #172110; border: 1px solid #1e3020; color: #9ca3af; padding: 7px 10px; border-radius: 10px; font-size: 16px; cursor: pointer; transition: all 0.2s; }
.btn-export:hover:not(:disabled) { border-color: #4ade80; color: #4ade80; }
.btn-export:disabled { opacity: 0.5; cursor: not-allowed; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal { background: #111a14; border: 1px solid #1e3020; border-radius: 24px; padding: 2rem; width: 100%; max-width: 460px; }
.modal-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
.modal-header h3 { font-family: 'Syne', sans-serif; font-size: 1.2rem; font-weight: 800; }
.modal-close { background: none; border: none; color: #6b7280; font-size: 20px; cursor: pointer; flex-shrink: 0; }
.preview-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
.preview-dados { display: flex; flex-direction: column; gap: 8px; }
.dado-row { display: flex; justify-content: space-between; align-items: center; background: #172110; border-radius: 10px; padding: 12px 14px; }
.dado-label { font-size: 0.85rem; color: #9ca3af; }
.dado-val { font-size: 0.95rem; font-weight: 700; }
.modal-actions { display: flex; gap: 10px; margin-top: 1.5rem; }
.btn-outline-lg { flex: 1; background: transparent; border: 1px solid #1e3020; color: #9ca3af; padding: 12px; border-radius: 12px; font-size: 0.9rem; cursor: pointer; font-family: 'DM Sans', sans-serif; }
.btn-primary-lg { flex: 1; background: #4ade80; color: #0a0f0d; border: none; padding: 12px; border-radius: 12px; font-size: 0.9rem; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; display: flex; align-items: center; justify-content: center; gap: 6px; }
</style>
