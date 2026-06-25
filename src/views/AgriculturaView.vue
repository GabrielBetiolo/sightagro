<!--
============================================================================
  AQUICULTURA E PISCICULTURA
============================================================================
  Módulo de gestão de tanques e viveiros com quatro abas:
    1. Tanques    — cadastro e visão geral dos tanques/viveiros
    2. Ciclos     — histórico de ciclos produtivos e despesca
    3. Água       — medições de qualidade (pH, O2, temperatura, amônia)
    4. Ração      — controle de alimentação e FCR
============================================================================
-->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '../composables/useApi'

// --------------------------------------------------------------------
// ESTADO GERAL
// --------------------------------------------------------------------
const abaAtiva = ref<'tanques' | 'ciclos' | 'agua' | 'racao'>('tanques')
const fazendas = ref<any[]>([])
const tanques = ref<any[]>([])
const resumo = ref<any>({ totalTanques: 0, tanquesEmProducao: 0, ciclosAtivos: 0 })
const loading = ref(true)
const filtroFazenda = ref<number | 'todas'>('todas')
const tanqueSelecionado = ref<any>(null)

// Dados do tanque selecionado
const ciclos = ref<any[]>([])
const medicoes = ref<any[]>([])
const racoes = ref<any[]>([])
const fcrData = ref<any>(null)

const especies = ['Tilápia', 'Tambaqui', 'Pacu', 'Pintado', 'Trutas', 'Camarão', 'Outro']

// Modais
const showModalTanque = ref(false)
const salvandoTanque = ref(false)
const editandoTanque = ref<any>(null)
const formTanque = ref({ nome: '', especie: especies[0], volumeM3: '', areaMt2: '', fazendaId: '' as number | '' })

const showModalCiclo = ref(false)
const salvandoCiclo = ref(false)
const formCiclo = ref({ especie: especies[0], quantidadeInicial: '', pesoMedioInicial: '', dataInicio: new Date().toISOString().slice(0, 10), observacao: '' })

const showModalDespesca = ref(false)
const salvandoDespesca = ref(false)
const cicloEncerrando = ref<any>(null)
const formDespesca = ref({ dataFim: new Date().toISOString().slice(0, 10), quantidadeDespescada: '', pesoTotalKg: '', valorVenda: '', observacao: '' })

const showModalMedicao = ref(false)
const salvandoMedicao = ref(false)
const formMedicao = ref({ ph: '', oxigenio: '', temperatura: '', amonia: '', turbidez: '', observacao: '' })

const showModalRacao = ref(false)
const salvandoRacao = ref(false)
const formRacao = ref({ tipoRacao: '', quantidadeKg: '', observacao: '' })

// --------------------------------------------------------------------
// CARREGAMENTO
// --------------------------------------------------------------------
async function fetchFazendas() {
  fazendas.value = await api.get('/fazendas')
  if (fazendas.value.length > 0 && !formTanque.value.fazendaId) {
    formTanque.value.fazendaId = fazendas.value[0].id
  }
}

async function fetchTanques() {
  const q = filtroFazenda.value !== 'todas' ? `?fazendaId=${filtroFazenda.value}` : ''
  tanques.value = await api.get(`/aquicultura/tanques${q}`)
}

async function fetchResumo() {
  const q = filtroFazenda.value !== 'todas' ? `?fazendaId=${filtroFazenda.value}` : ''
  resumo.value = await api.get(`/aquicultura/resumo${q}`)
}

async function fetchTanqueDetalhes() {
  if (!tanqueSelecionado.value) return
  const id = tanqueSelecionado.value.id
  const [c, m, r] = await Promise.all([
    api.get(`/aquicultura/tanques/${id}/ciclos`),
    api.get(`/aquicultura/tanques/${id}/medicoes`),
    api.get(`/aquicultura/tanques/${id}/racoes`)
  ])
  ciclos.value = c
  medicoes.value = m
  racoes.value = r

  // FCR do ciclo ativo
  const cicloAtivo = c.find((ci: any) => !ci.dataFim)
  if (cicloAtivo) {
    fcrData.value = await api.get(`/aquicultura/ciclos/${cicloAtivo.id}/fcr`)
  } else {
    fcrData.value = null
  }
}

async function fetchTudo() {
  loading.value = true
  try {
    await fetchFazendas()
    await Promise.all([fetchTanques(), fetchResumo()])
  } finally { loading.value = false }
}

// --------------------------------------------------------------------
// AÇÕES: TANQUES
// --------------------------------------------------------------------
function abrirNovoTanque() {
  editandoTanque.value = null
  formTanque.value = { nome: '', especie: especies[0], volumeM3: '', areaMt2: '', fazendaId: fazendas.value[0]?.id || '' }
  showModalTanque.value = true
}

function abrirEditarTanque(t: any) {
  editandoTanque.value = t
  formTanque.value = { nome: t.nome, especie: t.especie, volumeM3: t.volumeM3 ? String(t.volumeM3) : '', areaMt2: t.areaMt2 ? String(t.areaMt2) : '', fazendaId: t.fazendaId }
  showModalTanque.value = true
}

async function salvarTanque() {
  if (!formTanque.value.nome) return
  salvandoTanque.value = true
  try {
    const payload = { nome: formTanque.value.nome, especie: formTanque.value.especie as any, volumeM3: formTanque.value.volumeM3 ? Number(formTanque.value.volumeM3) : undefined, areaMt2: formTanque.value.areaMt2 ? Number(formTanque.value.areaMt2) : undefined, fazendaId: Number(formTanque.value.fazendaId) }
    if (editandoTanque.value) await api.put(`/aquicultura/tanques/${editandoTanque.value.id}`, payload)
    else await api.post('/aquicultura/tanques', payload)
    showModalTanque.value = false
    await Promise.all([fetchTanques(), fetchResumo()])
  } finally { salvandoTanque.value = false }
}

async function deletarTanque(id: number) {
  if (!confirm('Remover tanque e todo o histórico? Esta ação não pode ser desfeita.')) return
  await api.delete(`/aquicultura/tanques/${id}`)
  if (tanqueSelecionado.value?.id === id) tanqueSelecionado.value = null
  await Promise.all([fetchTanques(), fetchResumo()])
}

function selecionarTanque(t: any, aba: typeof abaAtiva.value) {
  tanqueSelecionado.value = t
  abaAtiva.value = aba
  fetchTanqueDetalhes()
}

// --------------------------------------------------------------------
// AÇÕES: CICLOS
// --------------------------------------------------------------------
async function salvarCiclo() {
  if (!tanqueSelecionado.value || !formCiclo.value.quantidadeInicial) return
  salvandoCiclo.value = true
  try {
    await api.post(`/aquicultura/tanques/${tanqueSelecionado.value.id}/ciclos`, {
      especie: formCiclo.value.especie as any,
      quantidadeInicial: Number(formCiclo.value.quantidadeInicial),
      pesoMedioInicial: formCiclo.value.pesoMedioInicial ? Number(formCiclo.value.pesoMedioInicial) : undefined,
      dataInicio: new Date(formCiclo.value.dataInicio).toISOString(),
      observacao: formCiclo.value.observacao || undefined
    })
    showModalCiclo.value = false
    formCiclo.value = { especie: especies[0], quantidadeInicial: '', pesoMedioInicial: '', dataInicio: new Date().toISOString().slice(0, 10), observacao: '' }
    await Promise.all([fetchTanqueDetalhes(), fetchTanques(), fetchResumo()])
  } catch (e: any) { alert(e.message || 'Erro ao iniciar ciclo') }
  finally { salvandoCiclo.value = false }
}

function abrirDespesca(c: any) {
  cicloEncerrando.value = c
  formDespesca.value = { dataFim: new Date().toISOString().slice(0, 10), quantidadeDespescada: '', pesoTotalKg: '', valorVenda: '', observacao: '' }
  showModalDespesca.value = true
}

async function salvarDespesca() {
  if (!cicloEncerrando.value) return
  salvandoDespesca.value = true
  try {
    await api.put(`/aquicultura/ciclos/${cicloEncerrando.value.id}/despesca`, {
      dataFim: new Date(formDespesca.value.dataFim).toISOString(),
      quantidadeDespescada: formDespesca.value.quantidadeDespescada ? Number(formDespesca.value.quantidadeDespescada) : undefined,
      pesoTotalKg: formDespesca.value.pesoTotalKg ? Number(formDespesca.value.pesoTotalKg) : undefined,
      valorVenda: formDespesca.value.valorVenda ? Number(formDespesca.value.valorVenda) : undefined,
      observacao: formDespesca.value.observacao || undefined
    })
    showModalDespesca.value = false
    await Promise.all([fetchTanqueDetalhes(), fetchTanques(), fetchResumo()])
  } finally { salvandoDespesca.value = false }
}

// --------------------------------------------------------------------
// AÇÕES: ÁGUA
// --------------------------------------------------------------------
async function salvarMedicao() {
  if (!tanqueSelecionado.value) return
  salvandoMedicao.value = true
  try {
    await api.post(`/aquicultura/tanques/${tanqueSelecionado.value.id}/medicoes`, {
      ph: formMedicao.value.ph ? Number(formMedicao.value.ph) : undefined,
      oxigenio: formMedicao.value.oxigenio ? Number(formMedicao.value.oxigenio) : undefined,
      temperatura: formMedicao.value.temperatura ? Number(formMedicao.value.temperatura) : undefined,
      amonia: formMedicao.value.amonia ? Number(formMedicao.value.amonia) : undefined,
      turbidez: formMedicao.value.turbidez ? Number(formMedicao.value.turbidez) : undefined,
      observacao: formMedicao.value.observacao || undefined
    })
    showModalMedicao.value = false
    formMedicao.value = { ph: '', oxigenio: '', temperatura: '', amonia: '', turbidez: '', observacao: '' }
    await fetchTanqueDetalhes()
  } finally { salvandoMedicao.value = false }
}

// --------------------------------------------------------------------
// AÇÕES: RAÇÃO
// --------------------------------------------------------------------
async function salvarRacao() {
  if (!tanqueSelecionado.value || !formRacao.value.tipoRacao || !formRacao.value.quantidadeKg) return
  salvandoRacao.value = true
  try {
    await api.post(`/aquicultura/tanques/${tanqueSelecionado.value.id}/racoes`, {
      tipoRacao: formRacao.value.tipoRacao,
      quantidadeKg: Number(formRacao.value.quantidadeKg),
      observacao: formRacao.value.observacao || undefined
    })
    showModalRacao.value = false
    formRacao.value = { tipoRacao: '', quantidadeKg: '', observacao: '' }
    await fetchTanqueDetalhes()
  } finally { salvandoRacao.value = false }
}

// --------------------------------------------------------------------
// HELPERS
// --------------------------------------------------------------------
const statusTanqueInfo: Record<string, { label: string; color: string }> = {
  vazio: { label: 'Vazio', color: '#6b7280' },
  em_preparo: { label: 'Em preparo', color: '#facc15' },
  em_producao: { label: 'Em produção', color: '#4ade80' },
  despescado: { label: 'Despescado', color: '#22d3ee' }
}

const especieCor: Record<string, string> = { Tilápia: '#4ade80', Tambaqui: '#fb923c', Camarão: '#facc15', Trutas: '#22d3ee', Pacu: '#a78bfa', Pintado: '#f87171', Outro: '#6b7280' }

function phStatus(ph: number | null) {
  if (!ph) return ''
  if (ph < 6.5 || ph > 8.5) return 'fora'
  return 'ok'
}

function o2Status(o2: number | null) {
  if (!o2) return ''
  if (o2 < 3) return 'critico'
  if (o2 < 5) return 'fora'
  return 'ok'
}

function formatarData(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR')
}

function formatarMoeda(v: number | null) {
  if (!v) return '—'
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const tanquesFiltrados = computed(() =>
  filtroFazenda.value === 'todas' ? tanques.value : tanques.value.filter(t => t.fazendaId === filtroFazenda.value)
)

const cicloAtivo = computed(() => ciclos.value.find(c => !c.dataFim))

onMounted(fetchTudo)
</script>

<template>
  <div class="page">
    <div class="header">
      <div>
        <h1 class="page-title">Aquicultura</h1>
        <p class="page-sub">Piscicultura, camarões e viveiros</p>
      </div>
      <div class="header-actions">
        <button v-if="abaAtiva === 'tanques'" class="btn-primary" @click="abrirNovoTanque" :disabled="fazendas.length === 0"><i class="ti ti-plus"></i> Novo Tanque</button>
        <button v-if="abaAtiva === 'ciclos' && tanqueSelecionado && !cicloAtivo" class="btn-primary" @click="showModalCiclo = true"><i class="ti ti-fish"></i> Iniciar Ciclo</button>
        <button v-if="abaAtiva === 'agua' && tanqueSelecionado" class="btn-primary" @click="showModalMedicao = true"><i class="ti ti-droplet"></i> Nova Medição</button>
        <button v-if="abaAtiva === 'racao' && tanqueSelecionado" class="btn-primary" @click="showModalRacao = true"><i class="ti ti-plus"></i> Registrar Ração</button>
      </div>
    </div>

    <!-- RESUMO -->
    <div v-if="!loading" class="resumo-grid">
      <div class="resumo-card"><i class="ti ti-layout-grid" style="color:#22d3ee"></i><div><strong>{{ resumo.totalTanques }}</strong><span>Tanques cadastrados</span></div></div>
      <div class="resumo-card"><i class="ti ti-fish" style="color:#4ade80"></i><div><strong>{{ resumo.tanquesEmProducao }}</strong><span>Em produção</span></div></div>
      <div class="resumo-card"><i class="ti ti-refresh" style="color:#a78bfa"></i><div><strong>{{ resumo.ciclosAtivos }}</strong><span>Ciclos ativos</span></div></div>
    </div>

    <!-- ABAS -->
    <div class="tabs">
      <button class="tab-btn" :class="{ active: abaAtiva === 'tanques' }" @click="abaAtiva = 'tanques'"><i class="ti ti-layout-grid"></i> Tanques</button>
      <button class="tab-btn" :class="{ active: abaAtiva === 'ciclos' }" @click="abaAtiva = 'ciclos'">
        <i class="ti ti-refresh"></i> Ciclos
        <span v-if="tanqueSelecionado" class="tab-badge">{{ tanqueSelecionado.nome }}</span>
      </button>
      <button class="tab-btn" :class="{ active: abaAtiva === 'agua' }" @click="abaAtiva = 'agua'"><i class="ti ti-droplet"></i> Qualidade da Água</button>
      <button class="tab-btn" :class="{ active: abaAtiva === 'racao' }" @click="abaAtiva = 'racao'"><i class="ti ti-fish-bone"></i> Ração</button>
    </div>

    <div v-if="loading" class="loading-state"><i class="ti ti-loader-2 spin"></i> Carregando...</div>

    <!-- ========== ABA TANQUES ========== -->
    <template v-else-if="abaAtiva === 'tanques'">
      <div class="filtros"><select v-model="filtroFazenda" class="select-filtro"><option value="todas">Todas as fazendas</option><option v-for="f in fazendas" :key="f.id" :value="f.id">{{ f.nome }}</option></select></div>

      <div v-if="tanquesFiltrados.length === 0" class="empty-state">
        <div class="empty-icon"><i class="ti ti-fish"></i></div>
        <h3>Nenhum tanque cadastrado</h3>
        <p>Cadastre tanques ou viveiros para monitorar a produção aquícola.</p>
        <button class="btn-primary" @click="abrirNovoTanque" :disabled="fazendas.length === 0"><i class="ti ti-plus"></i> Criar tanque</button>
      </div>

      <div v-else class="tanques-grid">
        <div v-for="t in tanquesFiltrados" :key="t.id" class="tanque-card" :style="`--c:${statusTanqueInfo[t.status].color}`">
          <div class="tanque-top">
            <span class="tanque-especie" :style="`background:${especieCor[t.especie]}22;color:${especieCor[t.especie]}`">{{ t.especie }}</span>
            <span class="tanque-status" :style="`color:${statusTanqueInfo[t.status].color}`">{{ statusTanqueInfo[t.status].label }}</span>
          </div>
          <h3 class="tanque-nome">{{ t.nome }}</h3>
          <div class="tanque-specs">
            <span v-if="t.volumeM3"><i class="ti ti-cube"></i> {{ t.volumeM3 }} m³</span>
            <span v-if="t.areaMt2"><i class="ti ti-ruler-2"></i> {{ t.areaMt2 }} m²</span>
          </div>

          <!-- Ciclo ativo no card -->
          <div v-if="t.ciclos?.[0]" class="ciclo-ativo-badge">
            <i class="ti ti-fish"></i>
            {{ t.ciclos[0].quantidadeInicial }} animais · {{ Math.round((Date.now() - new Date(t.ciclos[0].dataInicio).getTime()) / 86400000) }} dias
          </div>

          <!-- Última medição de água -->
          <div v-if="t.medicoeQualidade?.[0]" class="ultima-medicao">
            <span v-if="t.medicoeQualidade[0].ph" :class="['param', phStatus(t.medicoeQualidade[0].ph)]">pH {{ t.medicoeQualidade[0].ph }}</span>
            <span v-if="t.medicoeQualidade[0].oxigenio" :class="['param', o2Status(t.medicoeQualidade[0].oxigenio)]">O₂ {{ t.medicoeQualidade[0].oxigenio }}</span>
            <span v-if="t.medicoeQualidade[0].temperatura" class="param ok">{{ t.medicoeQualidade[0].temperatura }}°C</span>
          </div>

          <div class="tanque-actions">
            <button class="btn-sm" @click="selecionarTanque(t, 'ciclos')"><i class="ti ti-refresh"></i> Ciclos</button>
            <button class="btn-sm" @click="selecionarTanque(t, 'agua')"><i class="ti ti-droplet"></i> Água</button>
            <button class="btn-sm" @click="selecionarTanque(t, 'racao')"><i class="ti ti-fish-bone"></i> Ração</button>
            <button class="icon-btn" @click="abrirEditarTanque(t)"><i class="ti ti-edit"></i></button>
            <button class="icon-btn danger" @click="deletarTanque(t.id)"><i class="ti ti-trash"></i></button>
          </div>
        </div>
      </div>
    </template>

    <!-- ========== ABA CICLOS ========== -->
    <template v-else-if="abaAtiva === 'ciclos'">
      <div v-if="!tanqueSelecionado" class="empty-state"><div class="empty-icon"><i class="ti ti-refresh"></i></div><h3>Selecione um tanque</h3><p>Vá para a aba Tanques e clique em "Ciclos".</p><button class="btn-primary" @click="abaAtiva = 'tanques'">← Ir para Tanques</button></div>
      <template v-else>
        <div class="tanque-info-bar"><strong>Ciclos — {{ tanqueSelecionado.nome }}</strong><button class="btn-ghost" @click="tanqueSelecionado = null; abaAtiva = 'tanques'"><i class="ti ti-x"></i></button></div>

        <!-- FCR do ciclo ativo -->
        <div v-if="fcrData && cicloAtivo" class="fcr-card">
          <div class="fcr-item"><strong>{{ fcrData.totalRacaoKg.toFixed(1) }} kg</strong><span>Ração fornecida</span></div>
          <div class="fcr-item"><strong>{{ fcrData.fcr ?? '—' }}</strong><span>FCR (conversão)</span></div>
          <div class="fcr-item"><strong>{{ Math.round((Date.now() - new Date(cicloAtivo.dataInicio).getTime()) / 86400000) }}</strong><span>Dias no ciclo</span></div>
        </div>

        <div v-if="ciclos.length === 0" class="empty-state" style="border:none"><p style="color:var(--text3)">Nenhum ciclo neste tanque ainda.</p></div>
        <div v-else class="ciclos-list">
          <div v-for="c in ciclos" :key="c.id" class="ciclo-card" :class="{ ativo: !c.dataFim }">
            <div class="ciclo-top">
              <span class="ciclo-especie">{{ c.especie }}</span>
              <span class="ciclo-badge" :class="c.dataFim ? 'concluido' : 'ativo'">{{ c.dataFim ? 'Concluído' : 'Em andamento' }}</span>
            </div>
            <div class="ciclo-stats">
              <div><strong>{{ c.quantidadeInicial }}</strong><span>Alevinos</span></div>
              <div><strong>{{ c.diasCiclo }}</strong><span>Dias</span></div>
              <div v-if="c.pesoTotalKg"><strong>{{ c.pesoTotalKg }} kg</strong><span>Produzido</span></div>
              <div v-if="c.mortPercent"><strong>{{ c.mortPercent }}%</strong><span>Mortalidade</span></div>
              <div v-if="c.valorVenda"><strong>{{ formatarMoeda(c.valorVenda) }}</strong><span>Venda</span></div>
            </div>
            <div class="ciclo-datas">
              <span><i class="ti ti-calendar"></i> Início: {{ formatarData(c.dataInicio) }}</span>
              <span v-if="c.dataFim"><i class="ti ti-calendar-check"></i> Despesca: {{ formatarData(c.dataFim) }}</span>
            </div>
            <button v-if="!c.dataFim" class="btn-despesca" @click="abrirDespesca(c)"><i class="ti ti-fish"></i> Registrar Despesca</button>
          </div>
        </div>
      </template>
    </template>

    <!-- ========== ABA ÁGUA ========== -->
    <template v-else-if="abaAtiva === 'agua'">
      <div v-if="!tanqueSelecionado" class="empty-state"><div class="empty-icon"><i class="ti ti-droplet"></i></div><h3>Selecione um tanque</h3><button class="btn-primary" @click="abaAtiva = 'tanques'">← Ir para Tanques</button></div>
      <template v-else>
        <div class="tanque-info-bar"><strong>Qualidade da Água — {{ tanqueSelecionado.nome }}</strong><button class="btn-ghost" @click="tanqueSelecionado = null; abaAtiva = 'tanques'"><i class="ti ti-x"></i></button></div>

        <div class="limits-info">
          <span>pH ideal: 6.5–8.5</span>
          <span>O₂: &gt;5 mg/L</span>
          <span>Temp: 18–30°C</span>
          <span>Amônia: &lt;0.5 mg/L</span>
        </div>

        <div v-if="medicoes.length === 0" class="empty-state" style="border:none"><p style="color:var(--text3)">Nenhuma medição registrada ainda.</p></div>
        <div v-else class="table-wrap">
          <table>
            <thead><tr><th>Data/hora</th><th>pH</th><th>O₂ (mg/L)</th><th>Temp (°C)</th><th>Amônia (mg/L)</th><th>Obs.</th></tr></thead>
            <tbody>
              <tr v-for="m in medicoes" :key="m.id">
                <td class="muted">{{ new Date(m.createdAt).toLocaleString('pt-BR') }}</td>
                <td :class="['param-cell', phStatus(m.ph)]">{{ m.ph ?? '—' }}</td>
                <td :class="['param-cell', o2Status(m.oxigenio)]">{{ m.oxigenio ?? '—' }}</td>
                <td :class="['param-cell', m.temperatura && (m.temperatura < 18 || m.temperatura > 30) ? 'fora' : 'ok']">{{ m.temperatura ?? '—' }}</td>
                <td :class="['param-cell', m.amonia && m.amonia > 0.5 ? (m.amonia > 1 ? 'critico' : 'fora') : 'ok']">{{ m.amonia ?? '—' }}</td>
                <td class="muted">{{ m.observacao || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </template>

    <!-- ========== ABA RAÇÃO ========== -->
    <template v-else-if="abaAtiva === 'racao'">
      <div v-if="!tanqueSelecionado" class="empty-state"><div class="empty-icon"><i class="ti ti-fish-bone"></i></div><h3>Selecione um tanque</h3><button class="btn-primary" @click="abaAtiva = 'tanques'">← Ir para Tanques</button></div>
      <template v-else>
        <div class="tanque-info-bar"><strong>Ração — {{ tanqueSelecionado.nome }}</strong><button class="btn-ghost" @click="tanqueSelecionado = null; abaAtiva = 'tanques'"><i class="ti ti-x"></i></button></div>

        <div v-if="fcrData" class="fcr-card">
          <div class="fcr-item"><strong>{{ fcrData.totalRacaoKg.toFixed(1) }} kg</strong><span>Total fornecido no ciclo</span></div>
          <div class="fcr-item"><strong>{{ fcrData.registros }}</strong><span>Registros</span></div>
          <div class="fcr-item"><strong>{{ fcrData.fcr ?? '—' }}</strong><span>FCR atual</span></div>
        </div>

        <div v-if="racoes.length === 0" class="empty-state" style="border:none"><p style="color:var(--text3)">Nenhum registro de ração ainda.</p></div>
        <div v-else class="table-wrap">
          <table>
            <thead><tr><th>Data/hora</th><th>Tipo de ração</th><th>Quantidade (kg)</th><th>Obs.</th></tr></thead>
            <tbody>
              <tr v-for="r in racoes" :key="r.id">
                <td class="muted">{{ new Date(r.createdAt).toLocaleString('pt-BR') }}</td>
                <td>{{ r.tipoRacao }}</td>
                <td class="quantidade">{{ r.quantidadeKg }} kg</td>
                <td class="muted">{{ r.observacao || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </template>

    <!-- =================== MODAIS =================== -->

    <!-- Modal Tanque -->
    <div v-if="showModalTanque" class="modal-overlay" @click.self="showModalTanque = false">
      <div class="modal">
        <div class="modal-header"><h3>{{ editandoTanque ? 'Editar Tanque' : 'Novo Tanque/Viveiro' }}</h3><button class="modal-close" @click="showModalTanque = false"><i class="ti ti-x"></i></button></div>
        <div class="field"><label>Nome *</label><input v-model="formTanque.nome" type="text" placeholder="Ex: Tanque 1, Viveiro A" /></div>
        <div class="field"><label>Espécie principal *</label><select v-model="formTanque.especie" class="select-input"><option v-for="e in especies" :key="e">{{ e }}</option></select></div>
        <div class="field-row">
          <div class="field"><label>Volume (m³)</label><input v-model="formTanque.volumeM3" type="number" step="0.1" placeholder="Opcional" /></div>
          <div class="field"><label>Área (m²)</label><input v-model="formTanque.areaMt2" type="number" step="0.1" placeholder="Opcional" /></div>
        </div>
        <div v-if="!editandoTanque" class="field"><label>Fazenda *</label><select v-model="formTanque.fazendaId" class="select-input"><option v-for="f in fazendas" :key="f.id" :value="f.id">{{ f.nome }}</option></select></div>
        <div class="modal-actions">
          <button class="btn-outline-lg" @click="showModalTanque = false">Cancelar</button>
          <button class="btn-primary-lg" @click="salvarTanque" :disabled="salvandoTanque"><i v-if="salvandoTanque" class="ti ti-loader-2 spin"></i><span v-else>Salvar</span></button>
        </div>
      </div>
    </div>

    <!-- Modal Ciclo -->
    <div v-if="showModalCiclo" class="modal-overlay" @click.self="showModalCiclo = false">
      <div class="modal">
        <div class="modal-header"><h3>Iniciar Ciclo — {{ tanqueSelecionado?.nome }}</h3><button class="modal-close" @click="showModalCiclo = false"><i class="ti ti-x"></i></button></div>
        <div class="field"><label>Espécie *</label><select v-model="formCiclo.especie" class="select-input"><option v-for="e in especies" :key="e">{{ e }}</option></select></div>
        <div class="field-row">
          <div class="field"><label>Quantidade de alevinos *</label><input v-model="formCiclo.quantidadeInicial" type="number" /></div>
          <div class="field"><label>Peso médio (g)</label><input v-model="formCiclo.pesoMedioInicial" type="number" step="0.1" placeholder="Opcional" /></div>
        </div>
        <div class="field"><label>Data do povoamento *</label><input v-model="formCiclo.dataInicio" type="date" /></div>
        <div class="field"><label>Observações</label><input v-model="formCiclo.observacao" type="text" placeholder="Opcional" /></div>
        <div class="modal-actions">
          <button class="btn-outline-lg" @click="showModalCiclo = false">Cancelar</button>
          <button class="btn-primary-lg" @click="salvarCiclo" :disabled="salvandoCiclo"><i v-if="salvandoCiclo" class="ti ti-loader-2 spin"></i><span v-else>Iniciar</span></button>
        </div>
      </div>
    </div>

    <!-- Modal Despesca -->
    <div v-if="showModalDespesca" class="modal-overlay" @click.self="showModalDespesca = false">
      <div class="modal">
        <div class="modal-header"><h3>Registrar Despesca</h3><button class="modal-close" @click="showModalDespesca = false"><i class="ti ti-x"></i></button></div>
        <div class="field"><label>Data da despesca *</label><input v-model="formDespesca.dataFim" type="date" /></div>
        <div class="field-row">
          <div class="field"><label>Quantidade colhida</label><input v-model="formDespesca.quantidadeDespescada" type="number" /></div>
          <div class="field"><label>Peso total (kg)</label><input v-model="formDespesca.pesoTotalKg" type="number" step="0.1" /></div>
        </div>
        <div class="field"><label>Valor de venda (R$)</label><input v-model="formDespesca.valorVenda" type="number" step="0.01" /></div>
        <div class="field"><label>Observações</label><input v-model="formDespesca.observacao" type="text" /></div>
        <div class="modal-actions">
          <button class="btn-outline-lg" @click="showModalDespesca = false">Cancelar</button>
          <button class="btn-primary-lg" @click="salvarDespesca" :disabled="salvandoDespesca"><i v-if="salvandoDespesca" class="ti ti-loader-2 spin"></i><span v-else>Confirmar despesca</span></button>
        </div>
      </div>
    </div>

    <!-- Modal Medição -->
    <div v-if="showModalMedicao" class="modal-overlay" @click.self="showModalMedicao = false">
      <div class="modal">
        <div class="modal-header"><h3>Nova Medição — {{ tanqueSelecionado?.nome }}</h3><button class="modal-close" @click="showModalMedicao = false"><i class="ti ti-x"></i></button></div>
        <div class="field-row">
          <div class="field"><label>pH</label><input v-model="formMedicao.ph" type="number" step="0.1" placeholder="6.5 – 8.5" /></div>
          <div class="field"><label>O₂ dissolvido (mg/L)</label><input v-model="formMedicao.oxigenio" type="number" step="0.1" placeholder="&gt; 5.0" /></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Temperatura (°C)</label><input v-model="formMedicao.temperatura" type="number" step="0.1" placeholder="18 – 30" /></div>
          <div class="field"><label>Amônia (mg/L)</label><input v-model="formMedicao.amonia" type="number" step="0.01" placeholder="&lt; 0.5" /></div>
        </div>
        <div class="field"><label>Turbidez (NTU)</label><input v-model="formMedicao.turbidez" type="number" step="0.1" placeholder="Opcional" /></div>
        <div class="field"><label>Observações</label><input v-model="formMedicao.observacao" type="text" /></div>
        <div class="modal-actions">
          <button class="btn-outline-lg" @click="showModalMedicao = false">Cancelar</button>
          <button class="btn-primary-lg" @click="salvarMedicao" :disabled="salvandoMedicao"><i v-if="salvandoMedicao" class="ti ti-loader-2 spin"></i><span v-else>Salvar</span></button>
        </div>
      </div>
    </div>

    <!-- Modal Ração -->
    <div v-if="showModalRacao" class="modal-overlay" @click.self="showModalRacao = false">
      <div class="modal">
        <div class="modal-header"><h3>Registrar Ração — {{ tanqueSelecionado?.nome }}</h3><button class="modal-close" @click="showModalRacao = false"><i class="ti ti-x"></i></button></div>
        <div class="field"><label>Tipo de ração *</label><input v-model="formRacao.tipoRacao" type="text" placeholder="Ex: Extrusada 36% PB, Peletizada 28%" /></div>
        <div class="field"><label>Quantidade (kg) *</label><input v-model="formRacao.quantidadeKg" type="number" step="0.1" /></div>
        <div class="field"><label>Observações</label><input v-model="formRacao.observacao" type="text" /></div>
        <div class="modal-actions">
          <button class="btn-outline-lg" @click="showModalRacao = false">Cancelar</button>
          <button class="btn-primary-lg" @click="salvarRacao" :disabled="salvandoRacao"><i v-if="salvandoRacao" class="ti ti-loader-2 spin"></i><span v-else>Salvar</span></button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { padding: 2rem; background: var(--bg); min-height: 100vh; color: var(--text); font-family: var(--font-body); }
.header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 1rem; }
.page-title { font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; letter-spacing: -0.03em; }
.page-sub { color: var(--text3); font-size: 0.9rem; margin-top: 4px; }
.btn-primary { background: var(--green); color: #0a0f0d; border: none; padding: 10px 18px; border-radius: 30px; font-family: var(--font-body); font-weight: 700; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 6px; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.resumo-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 1rem; margin-bottom: 1.25rem; }
.resumo-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 1.25rem 1.5rem; display: flex; align-items: center; gap: 1rem; }
.resumo-card .ti { font-size: 26px; }
.resumo-card strong { display: block; font-family: var(--font-display); font-size: 1.4rem; font-weight: 800; }
.resumo-card span { font-size: 0.75rem; color: var(--text3); }
.tabs { display: flex; gap: 6px; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border); }
.tab-btn { background: none; border: none; color: var(--text3); padding: 10px 18px; font-size: 0.88rem; cursor: pointer; font-family: var(--font-body); display: flex; align-items: center; gap: 6px; border-bottom: 2px solid transparent; transition: all 0.2s; }
.tab-btn.active { color: var(--green); border-bottom-color: var(--green); }
.tab-badge { background: var(--green); color: #0a0f0d; font-size: 0.65rem; padding: 1px 7px; border-radius: 10px; font-weight: 700; max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.loading-state { display: flex; align-items: center; gap: 8px; color: var(--text3); padding: 3rem; justify-content: center; }
.filtros { margin-bottom: 1.25rem; }
.select-filtro { background: var(--surface); border: 1px solid var(--border); color: var(--text); padding: 9px 14px; border-radius: 10px; font-size: 0.85rem; font-family: var(--font-body); outline: none; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 4rem 2rem; text-align: center; background: var(--surface); border: 2px dashed var(--border); border-radius: 20px; }
.empty-icon { width: 64px; height: 64px; background: var(--surface2); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 28px; color: var(--text3); }
.empty-state h3 { font-family: var(--font-display); font-size: 1.2rem; font-weight: 800; }
.empty-state p { color: var(--text3); font-size: 0.88rem; }
.tanques-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px,1fr)); gap: 1.25rem; }
.tanque-card { background: var(--surface); border: 1px solid var(--border); border-top: 3px solid var(--c); border-radius: 18px; padding: 1.5rem; }
.tanque-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
.tanque-especie { font-size: 0.72rem; padding: 3px 10px; border-radius: 8px; font-weight: 500; }
.tanque-status { font-size: 0.78rem; font-weight: 600; }
.tanque-nome { font-family: var(--font-display); font-size: 1.1rem; font-weight: 800; margin-bottom: 6px; }
.tanque-specs { display: flex; gap: 10px; margin-bottom: 10px; font-size: 0.78rem; color: var(--text3); }
.tanque-specs span { display: flex; align-items: center; gap: 3px; }
.ciclo-ativo-badge { background: #1a2e1a; border: 1px solid var(--green); color: var(--green); font-size: 0.72rem; padding: 4px 10px; border-radius: 8px; display: flex; align-items: center; gap: 5px; margin-bottom: 8px; }
.ultima-medicao { display: flex; gap: 6px; margin-bottom: 1rem; flex-wrap: wrap; }
.param { font-size: 0.72rem; padding: 3px 8px; border-radius: 8px; }
.param.ok { background: #1a2e1a; color: var(--green); }
.param.fora { background: #2a2200; color: #facc15; }
.param.critico { background: #2e0f0f; color: var(--red); }
.tanque-actions { display: flex; gap: 5px; flex-wrap: wrap; }
.btn-sm { background: var(--surface2); border: 1px solid var(--border); color: var(--text2); padding: 6px 10px; border-radius: 8px; font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; gap: 4px; font-family: var(--font-body); transition: all 0.2s; }
.btn-sm:hover { border-color: var(--green); color: var(--green); }
.icon-btn { background: none; border: none; color: var(--text3); cursor: pointer; font-size: 16px; padding: 5px 7px; border-radius: 8px; transition: all 0.2s; }
.icon-btn:hover { background: var(--surface2); color: var(--text); }
.icon-btn.danger:hover { color: var(--red); background: #1a0a0a; }
.tanque-info-bar { display: flex; align-items: center; gap: 10px; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 10px 16px; margin-bottom: 1.25rem; }
.btn-ghost { background: none; border: 1px solid var(--border); color: var(--text3); padding: 6px 12px; border-radius: 8px; font-size: 0.82rem; cursor: pointer; margin-left: auto; display: flex; align-items: center; gap: 4px; font-family: var(--font-body); }
.fcr-card { display: grid; grid-template-columns: repeat(3,1fr); gap: 1rem; background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 1.25rem; margin-bottom: 1.25rem; }
.fcr-item { text-align: center; }
.fcr-item strong { display: block; font-family: var(--font-display); font-size: 1.6rem; font-weight: 800; color: var(--green); }
.fcr-item span { font-size: 0.75rem; color: var(--text3); }
.ciclos-list { display: flex; flex-direction: column; gap: 1rem; }
.ciclo-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 1.25rem; }
.ciclo-card.ativo { border-color: var(--green); }
.ciclo-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.ciclo-especie { font-size: 0.82rem; font-weight: 600; color: var(--green); }
.ciclo-badge { font-size: 0.72rem; padding: 3px 10px; border-radius: 20px; }
.ciclo-badge.ativo { background: #1a2e1a; color: var(--green); }
.ciclo-badge.concluido { background: var(--surface2); color: var(--text3); }
.ciclo-stats { display: flex; gap: 1.5rem; margin-bottom: 0.75rem; flex-wrap: wrap; }
.ciclo-stats div { text-align: center; }
.ciclo-stats strong { display: block; font-family: var(--font-display); font-size: 1.2rem; font-weight: 800; }
.ciclo-stats span { font-size: 0.72rem; color: var(--text3); }
.ciclo-datas { display: flex; gap: 1rem; font-size: 0.78rem; color: var(--text3); margin-bottom: 0.75rem; }
.ciclo-datas span { display: flex; align-items: center; gap: 4px; }
.btn-despesca { background: var(--green); color: #0a0f0d; border: none; padding: 8px 16px; border-radius: 10px; font-size: 0.85rem; font-weight: 700; cursor: pointer; font-family: var(--font-body); display: flex; align-items: center; gap: 6px; }
.limits-info { display: flex; gap: 12px; background: var(--surface2); border-radius: 10px; padding: 10px 16px; margin-bottom: 1.25rem; font-size: 0.78rem; color: var(--text3); flex-wrap: wrap; }
.table-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; overflow: auto; }
table { width: 100%; border-collapse: collapse; font-size: 0.88rem; min-width: 500px; }
thead tr { border-bottom: 1px solid var(--border); }
th { padding: 12px 16px; text-align: left; color: var(--text3); font-weight: 500; font-size: 0.78rem; }
td { padding: 12px 16px; border-bottom: 1px solid var(--surface2); }
tr:last-child td { border-bottom: none; }
.muted { color: var(--text3); font-size: 0.82rem; }
.param-cell { font-weight: 600; }
.param-cell.ok { color: var(--green); }
.param-cell.fora { color: #facc15; }
.param-cell.critico { color: var(--red); }
.quantidade { font-family: var(--font-display); font-weight: 700; color: var(--green); }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 1rem; }
.modal { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 1.75rem; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
.modal-header h3 { font-family: var(--font-display); font-size: 1.2rem; font-weight: 800; }
.modal-close { background: none; border: none; color: var(--text3); font-size: 20px; cursor: pointer; }
.field { margin-bottom: 1rem; }
.field label { display: block; font-size: 0.82rem; color: var(--text2); margin-bottom: 5px; }
.field input, .select-input { width: 100%; background: var(--surface2); border: 1px solid var(--border); color: var(--text); padding: 10px 14px; border-radius: 10px; font-size: 0.9rem; font-family: var(--font-body); outline: none; }
.field input:focus, .select-input:focus { border-color: var(--green); }
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.modal-actions { display: flex; gap: 10px; margin-top: 1.5rem; }
.btn-outline-lg { flex: 1; background: transparent; border: 1px solid var(--border); color: var(--text2); padding: 11px; border-radius: 10px; font-size: 0.9rem; cursor: pointer; font-family: var(--font-body); }
.btn-primary-lg { flex: 1; background: var(--green); color: #0a0f0d; border: none; padding: 11px; border-radius: 10px; font-size: 0.9rem; font-weight: 700; cursor: pointer; font-family: var(--font-body); display: flex; align-items: center; justify-content: center; gap: 6px; }
.btn-primary-lg:disabled { opacity: 0.6; cursor: not-allowed; }
.spin { animation: spin 1s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 768px) { .page { padding: 1rem; } .resumo-grid { grid-template-columns: 1fr; } .tanques-grid { grid-template-columns: 1fr; } .field-row { grid-template-columns: 1fr; } .fcr-card { grid-template-columns: 1fr; } }
</style>
