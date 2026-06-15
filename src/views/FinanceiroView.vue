<!--
============================================================================
  GESTÃO FINANCEIRA RURAL
============================================================================
  Tela para o produtor registrar receitas, despesas e acompanhar
  financiamentos/CPR vinculados às suas fazendas.

  Seções:
    1. Resumo financeiro (receitas, despesas, saldo do período)
    2. Lançamentos (lista de transações com filtros)
    3. Financiamentos / CPR (com alertas de vencimento)
============================================================================
-->
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { api } from '../composables/useApi'

// --------------------------------------------------------------------
// ESTADO GERAL
// --------------------------------------------------------------------
const abaAtiva = ref<'lancamentos' | 'financiamentos'>('lancamentos')
const fazendas = ref<any[]>([])
const loading = ref(true)

// Filtros do resumo/lançamentos
const filtroFazenda = ref<number | 'todas'>('todas')
const filtroPeriodo = ref<'mes' | 'trimestre' | 'ano' | 'tudo'>('mes')

// Dados financeiros
const resumo = ref<any>({ totalReceitas: 0, totalDespesas: 0, saldo: 0, porCategoria: {} })
const transacoes = ref<any[]>([])
const financiamentos = ref<any[]>([])

// --------------------------------------------------------------------
// CATEGORIAS
// --------------------------------------------------------------------
const categoriasReceita = ['Venda de produção', 'Arrendamento', 'Subsídio/Incentivo', 'Outros']
const categoriasDespesa = ['Insumos', 'Maquinário', 'Mão de obra', 'Combustível', 'Manutenção', 'Impostos/Taxas', 'Outros']

// --------------------------------------------------------------------
// MODAL: NOVA TRANSAÇÃO
// --------------------------------------------------------------------
const showModalTransacao = ref(false)
const salvandoTransacao = ref(false)
const formTransacao = ref({
  tipo: 'receita' as 'receita' | 'despesa',
  categoria: categoriasReceita[0],
  descricao: '',
  valor: '',
  data: new Date().toISOString().slice(0, 10),
  fazendaId: '' as number | ''
})

// Ao trocar o tipo, ajusta a categoria padrão para a primeira da lista certa
watch(() => formTransacao.value.tipo, (novoTipo) => {
  formTransacao.value.categoria = novoTipo === 'receita' ? categoriasReceita[0] : categoriasDespesa[0]
})

// --------------------------------------------------------------------
// MODAL: NOVO FINANCIAMENTO/CPR
// --------------------------------------------------------------------
const showModalFinanciamento = ref(false)
const salvandoFinanciamento = ref(false)
const formFinanciamento = ref({
  tipo: 'CPR' as 'CPR' | 'Financiamento' | 'Outro',
  instituicao: '',
  descricao: '',
  valor: '',
  taxaJuros: '',
  dataContratacao: '',
  dataVencimento: '',
  fazendaId: '' as number | ''
})

// --------------------------------------------------------------------
// CÁLCULO DO PERÍODO (datas de início/fim conforme filtro selecionado)
// --------------------------------------------------------------------
function calcularPeriodo(): { inicio?: string; fim?: string } {
  const agora = new Date()
  if (filtroPeriodo.value === 'tudo') return {}

  const inicio = new Date(agora)
  if (filtroPeriodo.value === 'mes') inicio.setMonth(agora.getMonth() - 1)
  if (filtroPeriodo.value === 'trimestre') inicio.setMonth(agora.getMonth() - 3)
  if (filtroPeriodo.value === 'ano') inicio.setFullYear(agora.getFullYear() - 1)

  return { inicio: inicio.toISOString(), fim: agora.toISOString() }
}

// --------------------------------------------------------------------
// CARREGAMENTO DE DADOS
// --------------------------------------------------------------------
async function fetchFazendas() {
  fazendas.value = await api.get('/fazendas')
  if (fazendas.value.length > 0 && !formTransacao.value.fazendaId) {
    formTransacao.value.fazendaId = fazendas.value[0].id
    formFinanciamento.value.fazendaId = fazendas.value[0].id
  }
}

async function fetchResumoETransacoes() {
  const { inicio, fim } = calcularPeriodo()
  const params = new URLSearchParams()
  if (filtroFazenda.value !== 'todas') params.set('fazendaId', String(filtroFazenda.value))
  if (inicio) params.set('inicio', inicio)
  if (fim) params.set('fim', fim)

  const query = params.toString() ? `?${params.toString()}` : ''
  const [r, t] = await Promise.all([
    api.get(`/financeiro/resumo${query}`),
    api.get(`/financeiro/transacoes${query}`)
  ])
  resumo.value = r
  transacoes.value = t
}

async function fetchFinanciamentos() {
  financiamentos.value = await api.get('/financeiro/financiamentos')
  // Gera alertas de vencimento automaticamente ao abrir a aba
  await api.post('/financeiro/verificar-vencimentos', {})
}

async function fetchTudo() {
  loading.value = true
  try {
    await fetchFazendas()
    await Promise.all([fetchResumoETransacoes(), fetchFinanciamentos()])
  } finally {
    loading.value = false
  }
}

// Recarrega resumo/transações quando os filtros mudam
watch([filtroFazenda, filtroPeriodo], fetchResumoETransacoes)

// --------------------------------------------------------------------
// AÇÕES: TRANSAÇÕES
// --------------------------------------------------------------------
async function salvarTransacao() {
  if (!formTransacao.value.descricao || !formTransacao.value.valor || !formTransacao.value.fazendaId) return
  salvandoTransacao.value = true
  try {
    await api.post('/financeiro/transacoes', {
      tipo: formTransacao.value.tipo,
      categoria: formTransacao.value.categoria,
      descricao: formTransacao.value.descricao,
      valor: Number(formTransacao.value.valor),
      data: new Date(formTransacao.value.data).toISOString(),
      fazendaId: Number(formTransacao.value.fazendaId)
    })
    showModalTransacao.value = false
    formTransacao.value.descricao = ''
    formTransacao.value.valor = ''
    await fetchResumoETransacoes()
  } finally {
    salvandoTransacao.value = false
  }
}

async function deletarTransacao(id: number) {
  if (!confirm('Remover este lançamento?')) return
  await api.delete(`/financeiro/transacoes/${id}`)
  await fetchResumoETransacoes()
}

// --------------------------------------------------------------------
// AÇÕES: FINANCIAMENTOS
// --------------------------------------------------------------------
async function salvarFinanciamento() {
  const f = formFinanciamento.value
  if (!f.instituicao || !f.valor || !f.fazendaId) return
  salvandoFinanciamento.value = true
  try {
    await api.post('/financeiro/financiamentos', {
      tipo: f.tipo,
      instituicao: f.instituicao,
      descricao: f.descricao || undefined,
      valor: Number(f.valor),
      taxaJuros: f.taxaJuros ? Number(f.taxaJuros) : undefined,
      dataContratacao: f.dataContratacao ? new Date(f.dataContratacao).toISOString() : undefined,
      dataVencimento: f.dataVencimento ? new Date(f.dataVencimento).toISOString() : undefined,
      fazendaId: Number(f.fazendaId)
    })
    showModalFinanciamento.value = false
    formFinanciamento.value = { tipo: 'CPR', instituicao: '', descricao: '', valor: '', taxaJuros: '', dataContratacao: '', dataVencimento: '', fazendaId: fazendas.value[0]?.id || '' }
    await fetchFinanciamentos()
  } finally {
    salvandoFinanciamento.value = false
  }
}

async function marcarComoPago(id: number) {
  await api.put(`/financeiro/financiamentos/${id}`, { status: 'pago' })
  await fetchFinanciamentos()
}

async function deletarFinanciamento(id: number) {
  if (!confirm('Remover este financiamento?')) return
  await api.delete(`/financeiro/financiamentos/${id}`)
  await fetchFinanciamentos()
}

// --------------------------------------------------------------------
// FORMATAÇÃO
// --------------------------------------------------------------------
function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function formatarData(data: string | null) {
  if (!data) return '—'
  return new Date(data).toLocaleDateString('pt-BR')
}

// Ordena categorias por valor total (receita+despesa) para o gráfico de barras
const categoriasOrdenadas = computed(() => {
  return Object.entries(resumo.value.porCategoria || {})
    .map(([nome, valores]: [string, any]) => ({ nome, ...valores, total: valores.receita + valores.despesa }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6)
})

const maiorValorCategoria = computed(() => {
  return Math.max(1, ...categoriasOrdenadas.value.map((c) => c.total))
})

const statusFinanciamentoInfo: Record<string, { label: string; color: string; icon: string }> = {
  ativo: { label: 'Ativo', color: '#22d3ee', icon: 'ti-clock' },
  vencendo: { label: 'Vence em breve', color: '#facc15', icon: 'ti-alert-triangle' },
  vencido: { label: 'Vencido', color: '#f87171', icon: 'ti-alert-circle' },
  pago: { label: 'Pago', color: '#4ade80', icon: 'ti-circle-check' }
}

onMounted(fetchTudo)
</script>

<template>
  <div class="page">
    <!-- CABEÇALHO -->
    <div class="header">
      <div>
        <h1 class="page-title">Financeiro</h1>
        <p class="page-sub">Controle de receitas, despesas e financiamentos rurais</p>
      </div>
      <div class="header-actions">
        <button v-if="abaAtiva === 'lancamentos'" class="btn-primary" @click="showModalTransacao = true" :disabled="fazendas.length === 0">
          <i class="ti ti-plus"></i> Novo Lançamento
        </button>
        <button v-else class="btn-primary" @click="showModalFinanciamento = true" :disabled="fazendas.length === 0">
          <i class="ti ti-plus"></i> Novo Financiamento
        </button>
      </div>
    </div>

    <div v-if="!loading && fazendas.length === 0" class="alert-info">
      <i class="ti ti-info-circle"></i> Cadastre uma fazenda antes de registrar lançamentos financeiros.
    </div>

    <!-- ABAS -->
    <div class="tabs">
      <button class="tab-btn" :class="{ active: abaAtiva === 'lancamentos' }" @click="abaAtiva = 'lancamentos'">
        <i class="ti ti-receipt"></i> Lançamentos
      </button>
      <button class="tab-btn" :class="{ active: abaAtiva === 'financiamentos' }" @click="abaAtiva = 'financiamentos'">
        <i class="ti ti-building-bank"></i> Financiamentos / CPR
      </button>
    </div>

    <div v-if="loading" class="loading-state"><i class="ti ti-loader-2 spin"></i> Carregando dados financeiros...</div>

    <!-- =================== ABA LANÇAMENTOS =================== -->
    <template v-else-if="abaAtiva === 'lancamentos'">
      <!-- FILTROS -->
      <div class="filtros">
        <select v-model="filtroFazenda" class="select-filtro">
          <option value="todas">Todas as fazendas</option>
          <option v-for="f in fazendas" :key="f.id" :value="f.id">{{ f.nome }}</option>
        </select>
        <div class="periodo-select">
          <button v-for="p in [{k:'mes',l:'Último mês'},{k:'trimestre',l:'Trimestre'},{k:'ano',l:'Ano'},{k:'tudo',l:'Tudo'}]" :key="p.k"
            class="periodo-btn" :class="{ active: filtroPeriodo === p.k }" @click="filtroPeriodo = p.k as any">
            {{ p.l }}
          </button>
        </div>
      </div>

      <!-- RESUMO -->
      <div class="resumo-grid">
        <div class="resumo-card receita">
          <i class="ti ti-arrow-up-circle"></i>
          <div><strong>{{ formatarMoeda(resumo.totalReceitas) }}</strong><span>Receitas</span></div>
        </div>
        <div class="resumo-card despesa">
          <i class="ti ti-arrow-down-circle"></i>
          <div><strong>{{ formatarMoeda(resumo.totalDespesas) }}</strong><span>Despesas</span></div>
        </div>
        <div class="resumo-card saldo" :class="{ negativo: resumo.saldo < 0 }">
          <i class="ti ti-scale"></i>
          <div><strong>{{ formatarMoeda(resumo.saldo) }}</strong><span>Saldo do período</span></div>
        </div>
      </div>

      <!-- GRÁFICO DE CATEGORIAS -->
      <div v-if="categoriasOrdenadas.length > 0" class="panel">
        <h3 class="panel-title">Maiores categorias</h3>
        <div class="categorias-chart">
          <div v-for="c in categoriasOrdenadas" :key="c.nome" class="cat-row">
            <span class="cat-label">{{ c.nome }}</span>
            <div class="cat-bar-track">
              <div class="cat-bar despesa-bar" :style="`width:${(c.despesa / maiorValorCategoria) * 100}%`"></div>
              <div class="cat-bar receita-bar" :style="`width:${(c.receita / maiorValorCategoria) * 100}%`"></div>
            </div>
            <span class="cat-valor">{{ formatarMoeda(c.total) }}</span>
          </div>
        </div>
        <div class="legenda">
          <span><span class="dot receita-dot"></span> Receita</span>
          <span><span class="dot despesa-dot"></span> Despesa</span>
        </div>
      </div>

      <!-- LISTA DE LANÇAMENTOS -->
      <div v-if="transacoes.length === 0" class="empty-state">
        <div class="empty-icon"><i class="ti ti-receipt-off"></i></div>
        <h3>Nenhum lançamento no período</h3>
        <p>Registre receitas e despesas para acompanhar o resultado financeiro das suas fazendas.</p>
      </div>

      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Fazenda</th><th>Valor</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="t in transacoes" :key="t.id">
              <td class="muted">{{ formatarData(t.data) }}</td>
              <td>{{ t.descricao }}</td>
              <td><span class="cat-tag">{{ t.categoria }}</span></td>
              <td class="muted">{{ t.fazenda?.nome }}</td>
              <td :class="t.tipo === 'receita' ? 'valor-receita' : 'valor-despesa'">
                {{ t.tipo === 'receita' ? '+' : '-' }} {{ formatarMoeda(t.valor) }}
              </td>
              <td>
                <button class="icon-btn danger" @click="deletarTransacao(t.id)"><i class="ti ti-trash"></i></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- =================== ABA FINANCIAMENTOS =================== -->
    <template v-else>
      <div v-if="financiamentos.length === 0" class="empty-state">
        <div class="empty-icon"><i class="ti ti-building-bank"></i></div>
        <h3>Nenhum financiamento cadastrado</h3>
        <p>Registre CPRs e financiamentos bancários para acompanhar prazos e receber alertas de vencimento.</p>
      </div>

      <div v-else class="financ-grid">
        <div v-for="f in financiamentos" :key="f.id" class="financ-card" :style="`--c:${statusFinanciamentoInfo[f.statusCalculado].color}`">
          <div class="financ-top">
            <span class="financ-tipo">{{ f.tipo }}</span>
            <span class="financ-status" :style="`background:${statusFinanciamentoInfo[f.statusCalculado].color}22;color:${statusFinanciamentoInfo[f.statusCalculado].color}`">
              <i :class="['ti', statusFinanciamentoInfo[f.statusCalculado].icon]"></i>
              {{ statusFinanciamentoInfo[f.statusCalculado].label }}
            </span>
          </div>
          <h3 class="financ-instituicao">{{ f.instituicao }}</h3>
          <div class="financ-valor">{{ formatarMoeda(f.valor) }}</div>
          <p v-if="f.descricao" class="financ-desc">{{ f.descricao }}</p>
          <div class="financ-meta">
            <div v-if="f.taxaJuros" class="meta-row"><i class="ti ti-percentage"></i> {{ f.taxaJuros }}% a.a.</div>
            <div v-if="f.dataContratacao" class="meta-row"><i class="ti ti-calendar"></i> Contratado: {{ formatarData(f.dataContratacao) }}</div>
            <div v-if="f.dataVencimento" class="meta-row"><i class="ti ti-calendar-due"></i> Vencimento: {{ formatarData(f.dataVencimento) }}</div>
            <div class="meta-row"><i class="ti ti-map-pin"></i> {{ f.fazenda?.nome }}</div>
          </div>
          <div class="financ-actions">
            <button v-if="f.status !== 'pago'" class="btn-outline" @click="marcarComoPago(f.id)">
              <i class="ti ti-check"></i> Marcar como pago
            </button>
            <button class="btn-outline danger" @click="deletarFinanciamento(f.id)"><i class="ti ti-trash"></i></button>
          </div>
        </div>
      </div>
    </template>

    <!-- =================== MODAL: NOVO LANÇAMENTO =================== -->
    <div v-if="showModalTransacao" class="modal-overlay" @click.self="showModalTransacao = false">
      <div class="modal">
        <div class="modal-header">
          <h3>Novo Lançamento</h3>
          <button class="modal-close" @click="showModalTransacao = false"><i class="ti ti-x"></i></button>
        </div>

        <!-- Toggle Receita/Despesa -->
        <div class="tipo-toggle">
          <button class="tipo-btn" :class="{ active: formTransacao.tipo === 'receita', receita: true }" @click="formTransacao.tipo = 'receita'">
            <i class="ti ti-arrow-up-circle"></i> Receita
          </button>
          <button class="tipo-btn" :class="{ active: formTransacao.tipo === 'despesa', despesa: true }" @click="formTransacao.tipo = 'despesa'">
            <i class="ti ti-arrow-down-circle"></i> Despesa
          </button>
        </div>

        <div class="field">
          <label>Descrição *</label>
          <input v-model="formTransacao.descricao" type="text" placeholder="Ex: Venda de soja - 1ª safra" />
        </div>

        <div class="field-row">
          <div class="field">
            <label>Valor (R$) *</label>
            <input v-model="formTransacao.valor" type="number" step="0.01" placeholder="0,00" />
          </div>
          <div class="field">
            <label>Data *</label>
            <input v-model="formTransacao.data" type="date" />
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <label>Categoria</label>
            <select v-model="formTransacao.categoria" class="select-input">
              <option v-for="c in (formTransacao.tipo === 'receita' ? categoriasReceita : categoriasDespesa)" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div class="field">
            <label>Fazenda</label>
            <select v-model="formTransacao.fazendaId" class="select-input">
              <option v-for="f in fazendas" :key="f.id" :value="f.id">{{ f.nome }}</option>
            </select>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-outline-lg" @click="showModalTransacao = false">Cancelar</button>
          <button class="btn-primary-lg" @click="salvarTransacao" :disabled="salvandoTransacao">
            <i v-if="salvandoTransacao" class="ti ti-loader-2 spin"></i>
            <span v-else>Salvar</span>
          </button>
        </div>
      </div>
    </div>

    <!-- =================== MODAL: NOVO FINANCIAMENTO =================== -->
    <div v-if="showModalFinanciamento" class="modal-overlay" @click.self="showModalFinanciamento = false">
      <div class="modal">
        <div class="modal-header">
          <h3>Novo Financiamento / CPR</h3>
          <button class="modal-close" @click="showModalFinanciamento = false"><i class="ti ti-x"></i></button>
        </div>

        <div class="field-row">
          <div class="field">
            <label>Tipo *</label>
            <select v-model="formFinanciamento.tipo" class="select-input">
              <option value="CPR">CPR - Cédula de Produto Rural</option>
              <option value="Financiamento">Financiamento bancário</option>
              <option value="Outro">Outro</option>
            </select>
          </div>
          <div class="field">
            <label>Fazenda *</label>
            <select v-model="formFinanciamento.fazendaId" class="select-input">
              <option v-for="f in fazendas" :key="f.id" :value="f.id">{{ f.nome }}</option>
            </select>
          </div>
        </div>

        <div class="field">
          <label>Instituição / Credor *</label>
          <input v-model="formFinanciamento.instituicao" type="text" placeholder="Ex: Banco do Brasil, Cooperativa X" />
        </div>

        <div class="field-row">
          <div class="field">
            <label>Valor (R$) *</label>
            <input v-model="formFinanciamento.valor" type="number" step="0.01" placeholder="0,00" />
          </div>
          <div class="field">
            <label>Taxa de juros (% a.a.)</label>
            <input v-model="formFinanciamento.taxaJuros" type="number" step="0.01" placeholder="Opcional" />
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <label>Data de contratação</label>
            <input v-model="formFinanciamento.dataContratacao" type="date" />
          </div>
          <div class="field">
            <label>Data de vencimento</label>
            <input v-model="formFinanciamento.dataVencimento" type="date" />
            <span class="field-hint"><i class="ti ti-bell"></i> Gera alerta automático perto do vencimento</span>
          </div>
        </div>

        <div class="field">
          <label>Observações</label>
          <input v-model="formFinanciamento.descricao" type="text" placeholder="Opcional" />
        </div>

        <div class="modal-actions">
          <button class="btn-outline-lg" @click="showModalFinanciamento = false">Cancelar</button>
          <button class="btn-primary-lg" @click="salvarFinanciamento" :disabled="salvandoFinanciamento">
            <i v-if="salvandoFinanciamento" class="ti ti-loader-2 spin"></i>
            <span v-else>Salvar</span>
          </button>
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
.alert-info { background: #0e2a2e; border: 1px solid #0e4a5e; color: #22d3ee; padding: 12px 16px; border-radius: 12px; font-size: 0.88rem; display: flex; align-items: center; gap: 8px; margin-bottom: 1rem; }

/* Abas */
.tabs { display: flex; gap: 6px; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border); }
.tab-btn { background: none; border: none; color: var(--text3); padding: 10px 18px; font-size: 0.88rem; cursor: pointer; font-family: var(--font-body); display: flex; align-items: center; gap: 6px; border-bottom: 2px solid transparent; transition: all 0.2s; }
.tab-btn.active { color: var(--green); border-bottom-color: var(--green); }

.loading-state { display: flex; align-items: center; gap: 8px; color: var(--text3); padding: 3rem; justify-content: center; }

/* Filtros */
.filtros { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
.select-filtro { background: var(--surface); border: 1px solid var(--border); color: var(--text); padding: 9px 14px; border-radius: 10px; font-size: 0.85rem; font-family: var(--font-body); outline: none; }
.periodo-select { display: flex; gap: 4px; background: var(--surface); border: 1px solid var(--border); padding: 4px; border-radius: 12px; }
.periodo-btn { background: none; border: none; color: var(--text3); padding: 7px 14px; border-radius: 8px; font-size: 0.8rem; cursor: pointer; font-family: var(--font-body); transition: all 0.2s; }
.periodo-btn.active { background: var(--green); color: #0a0f0d; font-weight: 700; }

/* Resumo */
.resumo-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 1rem; margin-bottom: 1.25rem; }
.resumo-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 1.25rem 1.5rem; display: flex; align-items: center; gap: 1rem; }
.resumo-card .ti { font-size: 28px; }
.resumo-card strong { display: block; font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; }
.resumo-card span { font-size: 0.78rem; color: var(--text3); }
.resumo-card.receita .ti { color: var(--green); }
.resumo-card.despesa .ti { color: var(--red); }
.resumo-card.saldo .ti { color: var(--cyan); }
.resumo-card.saldo.negativo .ti, .resumo-card.saldo.negativo strong { color: var(--red); }

/* Painel / gráfico */
.panel { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: 1.5rem; margin-bottom: 1.25rem; }
.panel-title { font-family: var(--font-display); font-size: 1rem; font-weight: 800; margin-bottom: 1.25rem; }
.categorias-chart { display: flex; flex-direction: column; gap: 10px; }
.cat-row { display: grid; grid-template-columns: 140px 1fr 90px; align-items: center; gap: 10px; }
.cat-label { font-size: 0.82rem; color: var(--text2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cat-bar-track { background: var(--surface2); border-radius: 6px; height: 10px; display: flex; overflow: hidden; }
.cat-bar { height: 100%; transition: width 0.6s; }
.receita-bar { background: var(--green); }
.despesa-bar { background: var(--red); }
.cat-valor { font-size: 0.8rem; text-align: right; color: var(--text2); }
.legenda { display: flex; gap: 1rem; margin-top: 1rem; font-size: 0.78rem; color: var(--text3); }
.dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 4px; }
.receita-dot { background: var(--green); }
.despesa-dot { background: var(--red); }

/* Empty state */
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 4rem 2rem; text-align: center; background: var(--surface); border: 2px dashed var(--border); border-radius: 20px; }
.empty-icon { width: 64px; height: 64px; background: var(--surface2); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 28px; color: var(--text3); }
.empty-state h3 { font-family: var(--font-display); font-size: 1.2rem; font-weight: 800; }
.empty-state p { color: var(--text3); font-size: 0.88rem; max-width: 380px; line-height: 1.6; }

/* Tabela */
.table-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; overflow: auto; }
table { width: 100%; border-collapse: collapse; font-size: 0.88rem; min-width: 600px; }
thead tr { border-bottom: 1px solid var(--border); }
th { padding: 12px 16px; text-align: left; color: var(--text3); font-weight: 500; font-size: 0.78rem; }
td { padding: 12px 16px; border-bottom: 1px solid var(--surface2); }
tr:last-child td { border-bottom: none; }
.muted { color: var(--text3); }
.cat-tag { background: var(--surface2); color: var(--text2); font-size: 0.75rem; padding: 3px 10px; border-radius: 8px; }
.valor-receita { color: var(--green); font-weight: 600; }
.valor-despesa { color: var(--red); font-weight: 600; }
.icon-btn { background: none; border: none; color: var(--text3); cursor: pointer; font-size: 16px; padding: 4px 6px; border-radius: 6px; transition: all 0.2s; }
.icon-btn.danger:hover { color: var(--red); background: #1a0a0a; }

/* Financiamentos */
.financ-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px,1fr)); gap: 1.25rem; }
.financ-card { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: 1.5rem; border-top: 3px solid var(--c); }
.financ-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
.financ-tipo { background: var(--surface2); color: var(--text2); font-size: 0.72rem; padding: 3px 10px; border-radius: 8px; font-weight: 500; }
.financ-status { font-size: 0.7rem; padding: 4px 10px; border-radius: 20px; display: flex; align-items: center; gap: 4px; font-weight: 500; white-space: nowrap; }
.financ-instituicao { font-family: var(--font-display); font-size: 1.05rem; font-weight: 800; margin-bottom: 4px; }
.financ-valor { font-family: var(--font-display); font-size: 1.6rem; font-weight: 800; color: var(--text); margin-bottom: 0.5rem; }
.financ-desc { font-size: 0.82rem; color: var(--text3); margin-bottom: 0.75rem; }
.financ-meta { display: flex; flex-direction: column; gap: 6px; margin-bottom: 1.25rem; }
.meta-row { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: var(--text3); }
.financ-actions { display: flex; gap: 6px; }
.btn-outline { flex: 1; background: transparent; border: 1px solid var(--border); color: var(--text2); padding: 8px; border-radius: 10px; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px; font-family: var(--font-body); transition: all 0.2s; }
.btn-outline:hover { border-color: var(--green); color: var(--green); }
.btn-outline.danger { flex: 0; padding: 8px 12px; }
.btn-outline.danger:hover { border-color: var(--red); color: var(--red); }

/* Modal */
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

/* Toggle receita/despesa */
.tipo-toggle { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 1.25rem; }
.tipo-btn { background: var(--surface2); border: 1.5px solid var(--border); color: var(--text2); padding: 12px; border-radius: 12px; cursor: pointer; font-family: var(--font-body); font-size: 0.9rem; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s; }
.tipo-btn.active.receita { border-color: var(--green); color: var(--green); background: #0f2e17; }
.tipo-btn.active.despesa { border-color: var(--red); color: var(--red); background: #2e0f0f; }

.modal-actions { display: flex; gap: 10px; margin-top: 1.5rem; }
.btn-outline-lg { flex: 1; background: transparent; border: 1px solid var(--border); color: var(--text2); padding: 11px; border-radius: 10px; font-size: 0.9rem; cursor: pointer; font-family: var(--font-body); }
.btn-primary-lg { flex: 1; background: var(--green); color: #0a0f0d; border: none; padding: 11px; border-radius: 10px; font-size: 0.9rem; font-weight: 700; cursor: pointer; font-family: var(--font-body); display: flex; align-items: center; justify-content: center; gap: 6px; }
.btn-primary-lg:disabled { opacity: 0.6; cursor: not-allowed; }

.spin { animation: spin 1s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .page { padding: 1rem; }
  .resumo-grid { grid-template-columns: 1fr; }
  .filtros { flex-direction: column; align-items: stretch; }
  .field-row { grid-template-columns: 1fr; }
  .cat-row { grid-template-columns: 90px 1fr 70px; }
}
</style>
