<!--
============================================================================
  PECUÁRIA
============================================================================
  Módulo de gestão do rebanho com quatro abas:
    1. Rebanho  — lotes de animais por espécie/categoria
    2. Animais  — animais individuais de um lote (brinco, peso, raça)
    3. Vacinas  — vacinações por lote com alertas de próxima dose
    4. GTA      — Guias de Trânsito Animal com alertas de vencimento
============================================================================
-->
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { api } from '../composables/useApi'

// --------------------------------------------------------------------
// ESTADO GERAL
// --------------------------------------------------------------------
const abaAtiva = ref<'rebanho' | 'animais' | 'vacinas' | 'gta'>('rebanho')
const fazendas = ref<any[]>([])
const lotes = ref<any[]>([])
const gtas = ref<any[]>([])
const resumo = ref<any>({ totalLotes: 0, totalAnimais: 0, gtasVencendo: 0, vacinasProximas: 0, porEspecie: {} })
const loading = ref(true)
const filtroFazenda = ref<number | 'todas'>('todas')

// Lote selecionado para ver animais/vacinas
const loteSelecionado = ref<any>(null)
const animais = ref<any[]>([])
const vacinacoes = ref<any[]>([])

const especies = ['Bovino', 'Suíno', 'Aves', 'Equino', 'Ovino', 'Caprino', 'Outro']

// --------------------------------------------------------------------
// MODAIS
// --------------------------------------------------------------------
const showModalLote = ref(false)
const salvandoLote = ref(false)
const editandoLote = ref<any>(null)
const formLote = ref({ nome: '', especie: especies[0], categoria: '', localizacao: '', fazendaId: '' as number | '' })

const showModalAnimal = ref(false)
const salvandoAnimal = ref(false)
const formAnimal = ref({ numeroBrinco: '', nome: '', sexo: 'M', dataNascimento: '', raca: '', peso: '' })

const showModalPeso = ref(false)
const salvandoPeso = ref(false)
const animalPesando = ref<any>(null)
const formPeso = ref({ peso: '', observacao: '' })

const showModalVacina = ref(false)
const salvandoVacina = ref(false)
const formVacina = ref({ vacina: '', dataAplicacao: new Date().toISOString().slice(0, 10), dataProxima: '', responsavel: '', dosesAplicadas: '', observacao: '' })

const showModalGta = ref(false)
const salvandoGta = ref(false)
const formGta = ref({ numero: '', tipo: 'Venda', destino: '', quantidadeAnimais: '', especie: especies[0], dataEmissao: new Date().toISOString().slice(0, 10), dataVencimento: '', loteId: '' as number | '', fazendaId: '' as number | '' })

// --------------------------------------------------------------------
// CARREGAMENTO
// --------------------------------------------------------------------
async function fetchFazendas() {
  fazendas.value = await api.get('/fazendas')
  if (fazendas.value.length > 0) {
    if (!formLote.value.fazendaId) formLote.value.fazendaId = fazendas.value[0].id
    if (!formGta.value.fazendaId) formGta.value.fazendaId = fazendas.value[0].id
  }
}

async function fetchLotes() {
  const q = filtroFazenda.value !== 'todas' ? `?fazendaId=${filtroFazenda.value}` : ''
  lotes.value = await api.get(`/pecuaria/lotes${q}`)
}

async function fetchGtas() {
  const q = filtroFazenda.value !== 'todas' ? `?fazendaId=${filtroFazenda.value}` : ''
  gtas.value = await api.get(`/pecuaria/gtas${q}`)
}

async function fetchResumo() {
  const q = filtroFazenda.value !== 'todas' ? `?fazendaId=${filtroFazenda.value}` : ''
  resumo.value = await api.get(`/pecuaria/resumo${q}`)
}

async function fetchAnimais() {
  if (!loteSelecionado.value) return
  animais.value = await api.get(`/pecuaria/lotes/${loteSelecionado.value.id}/animais`)
}

async function fetchVacinacoes() {
  if (!loteSelecionado.value) return
  vacinacoes.value = await api.get(`/pecuaria/lotes/${loteSelecionado.value.id}/vacinacoes`)
}

async function fetchTudo() {
  loading.value = true
  try {
    await fetchFazendas()
    await Promise.all([fetchLotes(), fetchGtas(), fetchResumo()])
    await api.post('/pecuaria/verificar-vencimentos', {})
  } finally { loading.value = false }
}

watch(filtroFazenda, () => Promise.all([fetchLotes(), fetchGtas(), fetchResumo()]))

// --------------------------------------------------------------------
// AÇÕES: LOTES
// --------------------------------------------------------------------
function abrirNovoLote() {
  editandoLote.value = null
  formLote.value = { nome: '', especie: especies[0], categoria: '', localizacao: '', fazendaId: fazendas.value[0]?.id || '' }
  showModalLote.value = true
}

function abrirEditarLote(l: any) {
  editandoLote.value = l
  formLote.value = { nome: l.nome, especie: l.especie, categoria: l.categoria, localizacao: l.localizacao || '', fazendaId: l.fazendaId }
  showModalLote.value = true
}

async function salvarLote() {
  if (!formLote.value.nome || !formLote.value.categoria) return
  salvandoLote.value = true
  try {
    const payload = { nome: formLote.value.nome, especie: formLote.value.especie as any, categoria: formLote.value.categoria, localizacao: formLote.value.localizacao || undefined, fazendaId: Number(formLote.value.fazendaId) }
    if (editandoLote.value) await api.put(`/pecuaria/lotes/${editandoLote.value.id}`, payload)
    else await api.post('/pecuaria/lotes', payload)
    showModalLote.value = false
    await Promise.all([fetchLotes(), fetchResumo()])
  } finally { salvandoLote.value = false }
}

async function deletarLote(id: number) {
  if (!confirm('Remover lote e todos os animais? Esta ação não pode ser desfeita.')) return
  await api.delete(`/pecuaria/lotes/${id}`)
  await Promise.all([fetchLotes(), fetchResumo()])
  if (loteSelecionado.value?.id === id) loteSelecionado.value = null
}

function verAnimais(l: any) {
  loteSelecionado.value = l
  abaAtiva.value = 'animais'
  fetchAnimais()
}

function verVacinas(l: any) {
  loteSelecionado.value = l
  abaAtiva.value = 'vacinas'
  fetchVacinacoes()
}

// --------------------------------------------------------------------
// AÇÕES: ANIMAIS
// --------------------------------------------------------------------
async function salvarAnimal() {
  if (!loteSelecionado.value) return
  salvandoAnimal.value = true
  try {
    await api.post(`/pecuaria/lotes/${loteSelecionado.value.id}/animais`, {
      numeroBrinco: formAnimal.value.numeroBrinco || undefined,
      nome: formAnimal.value.nome || undefined,
      sexo: formAnimal.value.sexo,
      dataNascimento: formAnimal.value.dataNascimento ? new Date(formAnimal.value.dataNascimento).toISOString() : undefined,
      raca: formAnimal.value.raca || undefined,
      peso: formAnimal.value.peso ? Number(formAnimal.value.peso) : undefined
    })
    showModalAnimal.value = false
    formAnimal.value = { numeroBrinco: '', nome: '', sexo: 'M', dataNascimento: '', raca: '', peso: '' }
    await Promise.all([fetchAnimais(), fetchLotes(), fetchResumo()])
  } finally { salvandoAnimal.value = false }
}

async function marcarStatus(id: number, status: string) {
  await api.put(`/pecuaria/animais/${id}`, { status })
  await fetchAnimais()
}

function abrirPeso(a: any) {
  animalPesando.value = a
  formPeso.value = { peso: '', observacao: '' }
  showModalPeso.value = true
}

async function salvarPeso() {
  if (!animalPesando.value || !formPeso.value.peso) return
  salvandoPeso.value = true
  try {
    await api.post(`/pecuaria/animais/${animalPesando.value.id}/peso`, {
      peso: Number(formPeso.value.peso),
      observacao: formPeso.value.observacao || undefined
    })
    showModalPeso.value = false
    await fetchAnimais()
  } finally { salvandoPeso.value = false }
}

// --------------------------------------------------------------------
// AÇÕES: VACINAS
// --------------------------------------------------------------------
async function salvarVacina() {
  if (!loteSelecionado.value || !formVacina.value.vacina) return
  salvandoVacina.value = true
  try {
    await api.post(`/pecuaria/lotes/${loteSelecionado.value.id}/vacinacao`, {
      vacina: formVacina.value.vacina,
      dataAplicacao: new Date(formVacina.value.dataAplicacao).toISOString(),
      dataProxima: formVacina.value.dataProxima ? new Date(formVacina.value.dataProxima).toISOString() : undefined,
      responsavel: formVacina.value.responsavel || undefined,
      dosesAplicadas: formVacina.value.dosesAplicadas ? Number(formVacina.value.dosesAplicadas) : 0,
      observacao: formVacina.value.observacao || undefined
    })
    showModalVacina.value = false
    formVacina.value = { vacina: '', dataAplicacao: new Date().toISOString().slice(0, 10), dataProxima: '', responsavel: '', dosesAplicadas: '', observacao: '' }
    await fetchVacinacoes()
  } finally { salvandoVacina.value = false }
}

// --------------------------------------------------------------------
// AÇÕES: GTA
// --------------------------------------------------------------------
async function salvarGta() {
  const f = formGta.value
  if (!f.destino || !f.quantidadeAnimais || !f.dataVencimento || !f.fazendaId) return
  salvandoGta.value = true
  try {
    await api.post('/pecuaria/gtas', {
      numero: f.numero || undefined,
      tipo: f.tipo,
      destino: f.destino,
      quantidadeAnimais: Number(f.quantidadeAnimais),
      especie: f.especie,
      dataEmissao: new Date(f.dataEmissao).toISOString(),
      dataVencimento: new Date(f.dataVencimento).toISOString(),
      loteId: f.loteId ? Number(f.loteId) : undefined,
      fazendaId: Number(f.fazendaId)
    })
    showModalGta.value = false
    formGta.value = { numero: '', tipo: 'Venda', destino: '', quantidadeAnimais: '', especie: especies[0], dataEmissao: new Date().toISOString().slice(0, 10), dataVencimento: '', loteId: '', fazendaId: fazendas.value[0]?.id || '' }
    await fetchGtas()
  } finally { salvandoGta.value = false }
}

async function deletarGta(id: number) {
  if (!confirm('Remover esta GTA?')) return
  await api.delete(`/pecuaria/gtas/${id}`)
  await fetchGtas()
}

// --------------------------------------------------------------------
// HELPERS
// --------------------------------------------------------------------
const statusVencimentoInfo: Record<string, { label: string; color: string; icon: string }> = {
  valido: { label: 'Válida', color: '#4ade80', icon: 'ti-circle-check' },
  vencendo: { label: 'Vence em breve', color: '#facc15', icon: 'ti-alert-triangle' },
  vencido: { label: 'Vencida', color: '#f87171', icon: 'ti-alert-circle' },
  sem_data: { label: 'Sem data', color: '#6b7280', icon: 'ti-infinity' }
}

const especieCor: Record<string, string> = { Bovino: '#4ade80', Suíno: '#fb923c', Aves: '#facc15', Equino: '#a78bfa', Ovino: '#22d3ee', Caprino: '#f87171', Outro: '#6b7280' }

function formatarData(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR')
}

const lotesFiltrados = computed(() =>
  filtroFazenda.value === 'todas' ? lotes.value : lotes.value.filter(l => l.fazendaId === filtroFazenda.value)
)

onMounted(fetchTudo)
</script>

<template>
  <div class="page">
    <!-- CABEÇALHO -->
    <div class="header">
      <div>
        <h1 class="page-title">Pecuária</h1>
        <p class="page-sub">Rebanho, vacinações e guias de trânsito animal</p>
      </div>
      <div class="header-actions">
        <button v-if="abaAtiva === 'rebanho'" class="btn-primary" @click="abrirNovoLote" :disabled="fazendas.length === 0"><i class="ti ti-plus"></i> Novo Lote</button>
        <button v-if="abaAtiva === 'animais' && loteSelecionado" class="btn-primary" @click="showModalAnimal = true"><i class="ti ti-plus"></i> Novo Animal</button>
        <button v-if="abaAtiva === 'vacinas' && loteSelecionado" class="btn-primary" @click="showModalVacina = true"><i class="ti ti-plus"></i> Nova Vacinação</button>
        <button v-if="abaAtiva === 'gta'" class="btn-primary" @click="showModalGta = true" :disabled="fazendas.length === 0"><i class="ti ti-plus"></i> Nova GTA</button>
      </div>
    </div>

    <!-- RESUMO -->
    <div v-if="!loading" class="resumo-grid">
      <div class="resumo-card"><i class="ti ti-paw" style="color:#4ade80"></i><div><strong>{{ resumo.totalAnimais }}</strong><span>Animais no rebanho</span></div></div>
      <div class="resumo-card"><i class="ti ti-layout-grid" style="color:#22d3ee"></i><div><strong>{{ resumo.totalLotes }}</strong><span>Lotes ativos</span></div></div>
      <div class="resumo-card" :class="{ alerta: resumo.gtasVencendo > 0 }"><i class="ti ti-file-invoice" :style="`color:${resumo.gtasVencendo > 0 ? '#facc15' : '#6b7280'}`"></i><div><strong>{{ resumo.gtasVencendo }}</strong><span>GTAs vencendo</span></div></div>
      <div class="resumo-card" :class="{ alerta: resumo.vacinasProximas > 0 }"><i class="ti ti-vaccine" :style="`color:${resumo.vacinasProximas > 0 ? '#facc15' : '#6b7280'}`"></i><div><strong>{{ resumo.vacinasProximas }}</strong><span>Vacinas pendentes</span></div></div>
    </div>

    <!-- ABAS -->
    <div class="tabs">
      <button class="tab-btn" :class="{ active: abaAtiva === 'rebanho' }" @click="abaAtiva = 'rebanho'"><i class="ti ti-paw"></i> Rebanho</button>
      <button class="tab-btn" :class="{ active: abaAtiva === 'animais' }" @click="abaAtiva = 'animais'">
        <i class="ti ti-list-details"></i> Animais
        <span v-if="loteSelecionado" class="tab-badge">{{ loteSelecionado.nome }}</span>
      </button>
      <button class="tab-btn" :class="{ active: abaAtiva === 'vacinas' }" @click="abaAtiva = 'vacinas'"><i class="ti ti-vaccine"></i> Vacinas</button>
      <button class="tab-btn" :class="{ active: abaAtiva === 'gta' }" @click="abaAtiva = 'gta'"><i class="ti ti-file-invoice"></i> GTA</button>
    </div>

    <div v-if="loading" class="loading-state"><i class="ti ti-loader-2 spin"></i> Carregando...</div>

    <!-- ========== ABA REBANHO ========== -->
    <template v-else-if="abaAtiva === 'rebanho'">
      <div class="filtros">
        <select v-model="filtroFazenda" class="select-filtro">
          <option value="todas">Todas as fazendas</option>
          <option v-for="f in fazendas" :key="f.id" :value="f.id">{{ f.nome }}</option>
        </select>
      </div>

      <div v-if="lotesFiltrados.length === 0" class="empty-state">
        <div class="empty-icon"><i class="ti ti-paw"></i></div>
        <h3>Nenhum lote cadastrado</h3>
        <p>Crie lotes para organizar seu rebanho por espécie e categoria.</p>
        <button class="btn-primary" @click="abrirNovoLote"><i class="ti ti-plus"></i> Criar lote</button>
      </div>

      <div v-else class="lotes-grid">
        <div v-for="l in lotesFiltrados" :key="l.id" class="lote-card" :style="`--c:${especieCor[l.especie]}`">
          <div class="lote-top">
            <div class="lote-especie" :style="`background:${especieCor[l.especie]}22;color:${especieCor[l.especie]}`">{{ l.especie }}</div>
            <div class="lote-count"><strong>{{ l._count?.animais || 0 }}</strong> animais</div>
          </div>
          <h3 class="lote-nome">{{ l.nome }}</h3>
          <div class="lote-cat">{{ l.categoria }}</div>
          <div v-if="l.localizacao" class="lote-loc"><i class="ti ti-map-pin"></i> {{ l.localizacao }}</div>
          <div class="lote-fazenda"><i class="ti ti-map"></i> {{ l.fazenda?.nome }}</div>
          <div class="lote-actions">
            <button class="btn-sm" @click="verAnimais(l)"><i class="ti ti-list-details"></i> Animais</button>
            <button class="btn-sm" @click="verVacinas(l)"><i class="ti ti-vaccine"></i> Vacinas</button>
            <button class="icon-btn" @click="abrirEditarLote(l)"><i class="ti ti-edit"></i></button>
            <button class="icon-btn danger" @click="deletarLote(l.id)"><i class="ti ti-trash"></i></button>
          </div>
        </div>
      </div>
    </template>

    <!-- ========== ABA ANIMAIS ========== -->
    <template v-else-if="abaAtiva === 'animais'">
      <div v-if="!loteSelecionado" class="empty-state">
        <div class="empty-icon"><i class="ti ti-list-details"></i></div>
        <h3>Selecione um lote</h3>
        <p>Vá para a aba Rebanho e clique em "Animais" em um lote para ver os registros individuais.</p>
        <button class="btn-primary" @click="abaAtiva = 'rebanho'">← Ir para Rebanho</button>
      </div>

      <template v-else>
        <div class="lote-info-bar">
          <span class="lote-especie-sm" :style="`color:${especieCor[loteSelecionado.especie]}`">{{ loteSelecionado.especie }}</span>
          <strong>{{ loteSelecionado.nome }}</strong>
          <span class="muted">{{ animais.length }} animais</span>
          <button class="btn-ghost" @click="loteSelecionado = null; abaAtiva = 'rebanho'"><i class="ti ti-x"></i></button>
        </div>

        <div v-if="animais.length === 0" class="empty-state" style="border:none">
          <p style="color:var(--text3)">Nenhum animal neste lote ainda.</p>
        </div>

        <div v-else class="table-wrap">
          <table>
            <thead><tr><th>Brinco</th><th>Nome/ID</th><th>Sexo</th><th>Raça</th><th>Peso atual</th><th>Status</th><th></th></tr></thead>
            <tbody>
              <tr v-for="a in animais" :key="a.id" :class="{ inativo: a.status !== 'ativo' }">
                <td><code>{{ a.numeroBrinco || '—' }}</code></td>
                <td>{{ a.nome || '—' }}</td>
                <td>{{ a.sexo === 'M' ? '♂ Macho' : '♀ Fêmea' }}</td>
                <td class="muted">{{ a.raca || '—' }}</td>
                <td class="peso">{{ a.pesos?.[0] ? `${a.pesos[0].peso} kg` : (a.peso ? `${a.peso} kg` : '—') }}</td>
                <td><span class="status-pill" :class="a.status">{{ a.status }}</span></td>
                <td>
                  <div style="display:flex;gap:4px">
                    <button class="icon-btn" title="Registrar peso" @click="abrirPeso(a)"><i class="ti ti-weight"></i></button>
                    <button v-if="a.status === 'ativo'" class="icon-btn" title="Marcar como vendido" @click="marcarStatus(a.id, 'vendido')"><i class="ti ti-currency-dollar"></i></button>
                    <button v-if="a.status === 'ativo'" class="icon-btn danger" title="Registrar morte" @click="marcarStatus(a.id, 'morto')"><i class="ti ti-skull"></i></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </template>

    <!-- ========== ABA VACINAS ========== -->
    <template v-else-if="abaAtiva === 'vacinas'">
      <div v-if="!loteSelecionado" class="empty-state">
        <div class="empty-icon"><i class="ti ti-vaccine"></i></div>
        <h3>Selecione um lote</h3>
        <p>Vá para a aba Rebanho e clique em "Vacinas" em um lote.</p>
        <button class="btn-primary" @click="abaAtiva = 'rebanho'">← Ir para Rebanho</button>
      </div>

      <template v-else>
        <div class="lote-info-bar">
          <strong>Vacinações — {{ loteSelecionado.nome }}</strong>
          <button class="btn-ghost" @click="loteSelecionado = null; abaAtiva = 'rebanho'"><i class="ti ti-x"></i></button>
        </div>

        <div v-if="vacinacoes.length === 0" class="empty-state" style="border:none">
          <p style="color:var(--text3)">Nenhuma vacinação registrada para este lote.</p>
        </div>

        <div v-else class="vacinas-list">
          <div v-for="v in vacinacoes" :key="v.id" class="vacina-card">
            <div class="vacina-top">
              <h3 class="vacina-nome">{{ v.vacina }}</h3>
              <span v-if="v.dataProxima" class="vacina-status" :style="`background:${statusVencimentoInfo[v.statusProxima].color}22;color:${statusVencimentoInfo[v.statusProxima].color}`">
                <i :class="['ti', statusVencimentoInfo[v.statusProxima].icon]"></i> Próxima: {{ formatarData(v.dataProxima) }}
              </span>
            </div>
            <div class="vacina-meta">
              <span><i class="ti ti-calendar"></i> Aplicada: {{ formatarData(v.dataAplicacao) }}</span>
              <span v-if="v.dosesAplicadas"><i class="ti ti-droplet"></i> {{ v.dosesAplicadas }} doses</span>
              <span v-if="v.responsavel"><i class="ti ti-user"></i> {{ v.responsavel }}</span>
            </div>
            <p v-if="v.observacao" class="vacina-obs">{{ v.observacao }}</p>
          </div>
        </div>
      </template>
    </template>

    <!-- ========== ABA GTA ========== -->
    <template v-else-if="abaAtiva === 'gta'">
      <div v-if="gtas.length === 0" class="empty-state">
        <div class="empty-icon"><i class="ti ti-file-invoice"></i></div>
        <h3>Nenhuma GTA cadastrada</h3>
        <p>Registre as Guias de Trânsito Animal para acompanhar prazos de validade.</p>
        <button class="btn-primary" @click="showModalGta = true"><i class="ti ti-plus"></i> Nova GTA</button>
      </div>

      <div v-else class="gtas-grid">
        <div v-for="g in gtas" :key="g.id" class="gta-card" :style="`--c:${statusVencimentoInfo[g.statusVencimento].color}`">
          <div class="gta-top">
            <span class="gta-tipo">{{ g.tipo }}</span>
            <span class="gta-status" :style="`background:${statusVencimentoInfo[g.statusVencimento].color}22;color:${statusVencimentoInfo[g.statusVencimento].color}`">
              <i :class="['ti', statusVencimentoInfo[g.statusVencimento].icon]"></i> {{ statusVencimentoInfo[g.statusVencimento].label }}
            </span>
          </div>
          <h3 class="gta-destino">{{ g.destino }}</h3>
          <div class="gta-qtd"><strong>{{ g.quantidadeAnimais }}</strong> {{ g.especie }}(s)</div>
          <div class="gta-meta">
            <div class="meta-row"><i class="ti ti-calendar"></i> Emitida: {{ formatarData(g.dataEmissao) }}</div>
            <div class="meta-row"><i class="ti ti-calendar-due"></i> Vence: {{ formatarData(g.dataVencimento) }}</div>
            <div v-if="g.numero" class="meta-row"><i class="ti ti-hash"></i> {{ g.numero }}</div>
            <div class="meta-row"><i class="ti ti-map-pin"></i> {{ g.fazenda?.nome }}</div>
          </div>
          <div class="gta-actions">
            <a v-if="g.arquivoUrl" :href="g.arquivoUrl" target="_blank" class="btn-outline"><i class="ti ti-eye"></i> Ver GTA</a>
            <button class="btn-outline danger" @click="deletarGta(g.id)"><i class="ti ti-trash"></i></button>
          </div>
        </div>
      </div>
    </template>

    <!-- =================== MODAIS =================== -->

    <!-- Modal Lote -->
    <div v-if="showModalLote" class="modal-overlay" @click.self="showModalLote = false">
      <div class="modal">
        <div class="modal-header"><h3>{{ editandoLote ? 'Editar Lote' : 'Novo Lote' }}</h3><button class="modal-close" @click="showModalLote = false"><i class="ti ti-x"></i></button></div>
        <div class="field"><label>Nome do lote *</label><input v-model="formLote.nome" type="text" placeholder="Ex: Bezerros machos 2026" /></div>
        <div class="field-row">
          <div class="field"><label>Espécie *</label><select v-model="formLote.especie" class="select-input"><option v-for="e in especies" :key="e">{{ e }}</option></select></div>
          <div class="field"><label>Categoria *</label><input v-model="formLote.categoria" type="text" placeholder="Ex: Bezerro, Novilha, Vaca" /></div>
        </div>
        <div class="field"><label>Localização (pasto/curral)</label><input v-model="formLote.localizacao" type="text" placeholder="Ex: Pasto 3 - Setor Norte" /></div>
        <div v-if="!editandoLote" class="field"><label>Fazenda *</label><select v-model="formLote.fazendaId" class="select-input"><option v-for="f in fazendas" :key="f.id" :value="f.id">{{ f.nome }}</option></select></div>
        <div class="modal-actions">
          <button class="btn-outline-lg" @click="showModalLote = false">Cancelar</button>
          <button class="btn-primary-lg" @click="salvarLote" :disabled="salvandoLote"><i v-if="salvandoLote" class="ti ti-loader-2 spin"></i><span v-else>Salvar</span></button>
        </div>
      </div>
    </div>

    <!-- Modal Animal -->
    <div v-if="showModalAnimal" class="modal-overlay" @click.self="showModalAnimal = false">
      <div class="modal">
        <div class="modal-header"><h3>Novo Animal — {{ loteSelecionado?.nome }}</h3><button class="modal-close" @click="showModalAnimal = false"><i class="ti ti-x"></i></button></div>
        <div class="field-row">
          <div class="field"><label>Nº do brinco</label><input v-model="formAnimal.numeroBrinco" type="text" placeholder="Opcional" /></div>
          <div class="field"><label>Nome (opcional)</label><input v-model="formAnimal.nome" type="text" placeholder="Para matrizes" /></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Sexo *</label><select v-model="formAnimal.sexo" class="select-input"><option value="M">♂ Macho</option><option value="F">♀ Fêmea</option></select></div>
          <div class="field"><label>Raça</label><input v-model="formAnimal.raca" type="text" placeholder="Ex: Nelore, Angus" /></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Data de nascimento</label><input v-model="formAnimal.dataNascimento" type="date" /></div>
          <div class="field"><label>Peso inicial (kg)</label><input v-model="formAnimal.peso" type="number" step="0.1" placeholder="Opcional" /></div>
        </div>
        <div class="modal-actions">
          <button class="btn-outline-lg" @click="showModalAnimal = false">Cancelar</button>
          <button class="btn-primary-lg" @click="salvarAnimal" :disabled="salvandoAnimal"><i v-if="salvandoAnimal" class="ti ti-loader-2 spin"></i><span v-else>Cadastrar</span></button>
        </div>
      </div>
    </div>

    <!-- Modal Peso -->
    <div v-if="showModalPeso" class="modal-overlay" @click.self="showModalPeso = false">
      <div class="modal">
        <div class="modal-header"><h3>Registrar Pesagem</h3><button class="modal-close" @click="showModalPeso = false"><i class="ti ti-x"></i></button></div>
        <div class="mov-info"><strong>{{ animalPesando?.nome || animalPesando?.numeroBrinco || `Animal #${animalPesando?.id}` }}</strong><span>Peso atual: {{ animalPesando?.pesos?.[0]?.peso || animalPesando?.peso || '—' }} kg</span></div>
        <div class="field"><label>Novo peso (kg) *</label><input v-model="formPeso.peso" type="number" step="0.1" placeholder="0.0" /></div>
        <div class="field"><label>Observação</label><input v-model="formPeso.observacao" type="text" placeholder="Opcional" /></div>
        <div class="modal-actions">
          <button class="btn-outline-lg" @click="showModalPeso = false">Cancelar</button>
          <button class="btn-primary-lg" @click="salvarPeso" :disabled="salvandoPeso || !formPeso.peso"><i v-if="salvandoPeso" class="ti ti-loader-2 spin"></i><span v-else>Salvar</span></button>
        </div>
      </div>
    </div>

    <!-- Modal Vacina -->
    <div v-if="showModalVacina" class="modal-overlay" @click.self="showModalVacina = false">
      <div class="modal">
        <div class="modal-header"><h3>Nova Vacinação — {{ loteSelecionado?.nome }}</h3><button class="modal-close" @click="showModalVacina = false"><i class="ti ti-x"></i></button></div>
        <div class="field"><label>Nome da vacina *</label><input v-model="formVacina.vacina" type="text" placeholder="Ex: Febre Aftosa, Brucelose, Raiva" /></div>
        <div class="field-row">
          <div class="field"><label>Data de aplicação *</label><input v-model="formVacina.dataAplicacao" type="date" /></div>
          <div class="field"><label>Próxima dose (alerta)</label><input v-model="formVacina.dataProxima" type="date" /><span class="field-hint"><i class="ti ti-bell"></i> Gera alerta automático</span></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Responsável/Veterinário</label><input v-model="formVacina.responsavel" type="text" placeholder="Opcional" /></div>
          <div class="field"><label>Doses aplicadas</label><input v-model="formVacina.dosesAplicadas" type="number" placeholder="0" /></div>
        </div>
        <div class="field"><label>Observações</label><input v-model="formVacina.observacao" type="text" placeholder="Opcional" /></div>
        <div class="modal-actions">
          <button class="btn-outline-lg" @click="showModalVacina = false">Cancelar</button>
          <button class="btn-primary-lg" @click="salvarVacina" :disabled="salvandoVacina"><i v-if="salvandoVacina" class="ti ti-loader-2 spin"></i><span v-else>Salvar</span></button>
        </div>
      </div>
    </div>

    <!-- Modal GTA -->
    <div v-if="showModalGta" class="modal-overlay" @click.self="showModalGta = false">
      <div class="modal">
        <div class="modal-header"><h3>Nova GTA</h3><button class="modal-close" @click="showModalGta = false"><i class="ti ti-x"></i></button></div>
        <div class="field-row">
          <div class="field"><label>Tipo *</label><select v-model="formGta.tipo" class="select-input"><option>Compra</option><option>Venda</option><option>Exposição</option><option>Transferência</option><option>Outro</option></select></div>
          <div class="field"><label>Número GTA</label><input v-model="formGta.numero" type="text" placeholder="Opcional" /></div>
        </div>
        <div class="field"><label>Destino *</label><input v-model="formGta.destino" type="text" placeholder="Fazenda ou estabelecimento de destino" /></div>
        <div class="field-row">
          <div class="field"><label>Espécie *</label><select v-model="formGta.especie" class="select-input"><option v-for="e in especies" :key="e">{{ e }}</option></select></div>
          <div class="field"><label>Quantidade de animais *</label><input v-model="formGta.quantidadeAnimais" type="number" /></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Data de emissão *</label><input v-model="formGta.dataEmissao" type="date" /></div>
          <div class="field"><label>Data de vencimento *</label><input v-model="formGta.dataVencimento" type="date" /><span class="field-hint"><i class="ti ti-bell"></i> Alerta 3 dias antes</span></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Lote vinculado (opcional)</label><select v-model="formGta.loteId" class="select-input"><option value="">Nenhum</option><option v-for="l in lotes" :key="l.id" :value="l.id">{{ l.nome }}</option></select></div>
          <div class="field"><label>Fazenda *</label><select v-model="formGta.fazendaId" class="select-input"><option v-for="f in fazendas" :key="f.id" :value="f.id">{{ f.nome }}</option></select></div>
        </div>
        <div class="modal-actions">
          <button class="btn-outline-lg" @click="showModalGta = false">Cancelar</button>
          <button class="btn-primary-lg" @click="salvarGta" :disabled="salvandoGta"><i v-if="salvandoGta" class="ti ti-loader-2 spin"></i><span v-else>Salvar GTA</span></button>
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
.resumo-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 1rem; margin-bottom: 1.25rem; }
.resumo-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 1.25rem 1.5rem; display: flex; align-items: center; gap: 1rem; }
.resumo-card.alerta { border-color: #facc15; }
.resumo-card .ti { font-size: 26px; }
.resumo-card strong { display: block; font-family: var(--font-display); font-size: 1.4rem; font-weight: 800; }
.resumo-card span { font-size: 0.75rem; color: var(--text3); }
.tabs { display: flex; gap: 6px; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border); }
.tab-btn { background: none; border: none; color: var(--text3); padding: 10px 18px; font-size: 0.88rem; cursor: pointer; font-family: var(--font-body); display: flex; align-items: center; gap: 6px; border-bottom: 2px solid transparent; transition: all 0.2s; }
.tab-btn.active { color: var(--green); border-bottom-color: var(--green); }
.tab-badge { background: var(--green); color: #0a0f0d; font-size: 0.65rem; padding: 1px 7px; border-radius: 10px; font-weight: 700; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.loading-state { display: flex; align-items: center; gap: 8px; color: var(--text3); padding: 3rem; justify-content: center; }
.filtros { margin-bottom: 1.25rem; }
.select-filtro { background: var(--surface); border: 1px solid var(--border); color: var(--text); padding: 9px 14px; border-radius: 10px; font-size: 0.85rem; font-family: var(--font-body); outline: none; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 4rem 2rem; text-align: center; background: var(--surface); border: 2px dashed var(--border); border-radius: 20px; }
.empty-icon { width: 64px; height: 64px; background: var(--surface2); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 28px; color: var(--text3); }
.empty-state h3 { font-family: var(--font-display); font-size: 1.2rem; font-weight: 800; }
.empty-state p { color: var(--text3); font-size: 0.88rem; max-width: 360px; line-height: 1.6; }
.lotes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px,1fr)); gap: 1.25rem; }
.lote-card { background: var(--surface); border: 1px solid var(--border); border-top: 3px solid var(--c); border-radius: 18px; padding: 1.5rem; }
.lote-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
.lote-especie { font-size: 0.72rem; padding: 3px 10px; border-radius: 8px; font-weight: 500; }
.lote-count { font-size: 0.82rem; color: var(--text3); }
.lote-count strong { color: var(--text); font-family: var(--font-display); font-size: 1.1rem; }
.lote-nome { font-family: var(--font-display); font-size: 1rem; font-weight: 800; margin-bottom: 3px; }
.lote-cat { font-size: 0.78rem; color: var(--green); margin-bottom: 8px; }
.lote-loc, .lote-fazenda { font-size: 0.78rem; color: var(--text3); display: flex; align-items: center; gap: 4px; margin-bottom: 4px; }
.lote-actions { display: flex; gap: 6px; margin-top: 1rem; flex-wrap: wrap; }
.btn-sm { background: var(--surface2); border: 1px solid var(--border); color: var(--text2); padding: 6px 12px; border-radius: 8px; font-size: 0.78rem; cursor: pointer; display: flex; align-items: center; gap: 4px; font-family: var(--font-body); transition: all 0.2s; }
.btn-sm:hover { border-color: var(--green); color: var(--green); }
.icon-btn { background: none; border: none; color: var(--text3); cursor: pointer; font-size: 16px; padding: 5px 7px; border-radius: 8px; transition: all 0.2s; }
.icon-btn:hover { background: var(--surface2); color: var(--text); }
.icon-btn.danger:hover { color: var(--red); background: #1a0a0a; }
.lote-info-bar { display: flex; align-items: center; gap: 10px; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 10px 16px; margin-bottom: 1.25rem; flex-wrap: wrap; }
.lote-especie-sm { font-size: 0.78rem; font-weight: 600; }
.muted { color: var(--text3); font-size: 0.85rem; }
.btn-ghost { background: none; border: 1px solid var(--border); color: var(--text3); padding: 6px 12px; border-radius: 8px; font-size: 0.82rem; cursor: pointer; margin-left: auto; display: flex; align-items: center; gap: 4px; font-family: var(--font-body); }
.table-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; overflow: auto; }
table { width: 100%; border-collapse: collapse; font-size: 0.88rem; min-width: 600px; }
thead tr { border-bottom: 1px solid var(--border); }
th { padding: 12px 16px; text-align: left; color: var(--text3); font-weight: 500; font-size: 0.78rem; }
td { padding: 12px 16px; border-bottom: 1px solid var(--surface2); }
tr:last-child td { border-bottom: none; }
tr.inativo td { opacity: 0.55; }
code { background: var(--surface2); padding: 2px 7px; border-radius: 6px; font-size: 0.78rem; color: var(--green); }
.peso { font-family: var(--font-display); font-weight: 700; color: var(--green); }
.status-pill { font-size: 0.72rem; padding: 3px 9px; border-radius: 20px; font-weight: 500; background: var(--surface2); }
.status-pill.ativo { background: #1a2e1a; color: var(--green); }
.status-pill.vendido { background: #0e2a2e; color: var(--cyan); }
.status-pill.morto { background: #1a0a0a; color: var(--red); }
.status-pill.transferido { background: #1e1a2e; color: var(--purple); }
.vacinas-list { display: flex; flex-direction: column; gap: 1rem; }
.vacina-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 1.25rem; }
.vacina-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 8px; }
.vacina-nome { font-family: var(--font-display); font-size: 1rem; font-weight: 800; }
.vacina-status { font-size: 0.72rem; padding: 3px 10px; border-radius: 20px; display: flex; align-items: center; gap: 4px; }
.vacina-meta { display: flex; gap: 12px; flex-wrap: wrap; font-size: 0.78rem; color: var(--text3); }
.vacina-meta span { display: flex; align-items: center; gap: 4px; }
.vacina-obs { font-size: 0.8rem; color: var(--text3); margin-top: 6px; }
.gtas-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px,1fr)); gap: 1.25rem; }
.gta-card { background: var(--surface); border: 1px solid var(--border); border-top: 3px solid var(--c); border-radius: 18px; padding: 1.5rem; }
.gta-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
.gta-tipo { background: var(--surface2); color: var(--text2); font-size: 0.72rem; padding: 3px 10px; border-radius: 8px; }
.gta-status { font-size: 0.7rem; padding: 3px 10px; border-radius: 20px; display: flex; align-items: center; gap: 4px; }
.gta-destino { font-family: var(--font-display); font-size: 1rem; font-weight: 800; margin-bottom: 4px; }
.gta-qtd { font-family: var(--font-display); font-size: 1.4rem; font-weight: 800; margin-bottom: 1rem; }
.gta-qtd strong { color: var(--text); }
.gta-meta { display: flex; flex-direction: column; gap: 5px; margin-bottom: 1.25rem; }
.meta-row { display: flex; align-items: center; gap: 6px; font-size: 0.78rem; color: var(--text3); }
.gta-actions { display: flex; gap: 6px; }
.btn-outline { flex: 1; background: transparent; border: 1px solid var(--border); color: var(--text2); padding: 8px; border-radius: 10px; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px; font-family: var(--font-body); text-decoration: none; transition: all 0.2s; }
.btn-outline:hover { border-color: var(--green); color: var(--green); }
.btn-outline.danger { flex: 0; padding: 8px 12px; }
.btn-outline.danger:hover { border-color: var(--red); color: var(--red); }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 1rem; }
.modal { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 1.75rem; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
.modal-header h3 { font-family: var(--font-display); font-size: 1.2rem; font-weight: 800; }
.modal-close { background: none; border: none; color: var(--text3); font-size: 20px; cursor: pointer; }
.field { margin-bottom: 1rem; }
.field label { display: block; font-size: 0.82rem; color: var(--text2); margin-bottom: 5px; }
.field input, .select-input { width: 100%; background: var(--surface2); border: 1px solid var(--border); color: var(--text); padding: 10px 14px; border-radius: 10px; font-size: 0.9rem; font-family: var(--font-body); outline: none; }
.field input:focus, .select-input:focus { border-color: var(--green); }
.field-hint { font-size: 0.72rem; color: var(--text3); margin-top: 4px; display: flex; align-items: center; gap: 3px; }
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.modal-actions { display: flex; gap: 10px; margin-top: 1.5rem; }
.btn-outline-lg { flex: 1; background: transparent; border: 1px solid var(--border); color: var(--text2); padding: 11px; border-radius: 10px; font-size: 0.9rem; cursor: pointer; font-family: var(--font-body); }
.btn-primary-lg { flex: 1; background: var(--green); color: #0a0f0d; border: none; padding: 11px; border-radius: 10px; font-size: 0.9rem; font-weight: 700; cursor: pointer; font-family: var(--font-body); display: flex; align-items: center; justify-content: center; gap: 6px; }
.btn-primary-lg:disabled { opacity: 0.6; cursor: not-allowed; }
.mov-info { background: var(--surface2); border-radius: 12px; padding: 12px 16px; margin-bottom: 1.25rem; display: flex; flex-direction: column; gap: 2px; }
.mov-info strong { font-size: 0.95rem; }
.mov-info span { font-size: 0.8rem; color: var(--text3); }
.spin { animation: spin 1s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 1024px) { .resumo-grid { grid-template-columns: repeat(2,1fr); } }
@media (max-width: 768px) { .page { padding: 1rem; } .lotes-grid { grid-template-columns: 1fr; } .gtas-grid { grid-template-columns: 1fr; } .field-row { grid-template-columns: 1fr; } .resumo-grid { grid-template-columns: repeat(2,1fr); } }
</style>
