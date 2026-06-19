<!--
============================================================================
  GESTÃO DE COLABORADORES
============================================================================
  Tela com três abas:
    1. Equipe     — lista e cadastro de colaboradores por fazenda
    2. Tarefas    — quadro kanban (Pendente / Em andamento / Concluída)
    3. Ponto      — controle de presença e horas trabalhadas do mês
============================================================================
-->
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { api } from '../composables/useApi'

// --------------------------------------------------------------------
// ESTADO GERAL
// --------------------------------------------------------------------
const abaAtiva = ref<'equipe' | 'tarefas' | 'ponto'>('equipe')
const fazendas = ref<any[]>([])
const colaboradores = ref<any[]>([])
const tarefas = ref<any[]>([])
const loading = ref(true)
const filtroFazenda = ref<number | 'todas'>('todas')

// --------------------------------------------------------------------
// MODAL: NOVO COLABORADOR
// --------------------------------------------------------------------
const showModalColab = ref(false)
const salvandoColab = ref(false)
const editandoColab = ref<any>(null)
const formColab = ref({
  nome: '', funcao: '', telefone: '', email: '',
  dataAdmissao: '', salario: '', fazendaId: '' as number | ''
})

const funcoes = [
  'Gerente de fazenda', 'Encarregado', 'Tratorista', 'Operador de máquinas',
  'Irrigador', 'Aplicador de defensivos', 'Colhedor', 'Peão de gado', 'Mecânico', 'Outro'
]

// --------------------------------------------------------------------
// MODAL: NOVA TAREFA
// --------------------------------------------------------------------
const showModalTarefa = ref(false)
const salvandoTarefa = ref(false)
const formTarefa = ref({
  titulo: '', descricao: '', prioridade: 'media' as 'baixa' | 'media' | 'alta',
  dataPrazo: '', colaboradorId: '' as number | '', fazendaId: '' as number | ''
})

// --------------------------------------------------------------------
// PONTO
// --------------------------------------------------------------------
const colaboradorPonto = ref<any>(null)
const mesPonto = ref(new Date().toISOString().slice(0, 7)) // YYYY-MM
const registrosPonto = ref<any[]>([])
const resumoPonto = ref({ totalDias: 0, totalHoras: 0, totalMinutos: 0 })
const salvandoPonto = ref(false)
const formPonto = ref({
  data: new Date().toISOString().slice(0, 10),
  entrada: '', saida: '', observacao: ''
})

// --------------------------------------------------------------------
// COMPUTED
// --------------------------------------------------------------------
const colaboradoresFiltrados = computed(() =>
  filtroFazenda.value === 'todas'
    ? colaboradores.value
    : colaboradores.value.filter(c => c.fazendaId === filtroFazenda.value)
)

// Agrupa tarefas por status para o kanban
const tarefasPorStatus = computed(() => {
  const grupos = { pendente: [] as any[], em_andamento: [] as any[], concluida: [] as any[] }
  for (const t of tarefas.value) {
    if (grupos[t.status as keyof typeof grupos]) {
      grupos[t.status as keyof typeof grupos].push(t)
    }
  }
  return grupos
})

// --------------------------------------------------------------------
// CARREGAMENTO
// --------------------------------------------------------------------
async function fetchFazendas() {
  fazendas.value = await api.get('/fazendas')
  if (fazendas.value.length > 0) {
    if (!formColab.value.fazendaId) formColab.value.fazendaId = fazendas.value[0].id
    if (!formTarefa.value.fazendaId) formTarefa.value.fazendaId = fazendas.value[0].id
  }
}

async function fetchColaboradores() {
  colaboradores.value = await api.get('/colaboradores')
}

async function fetchTarefas() {
  tarefas.value = await api.get('/colaboradores/tarefas')
}

async function fetchPonto() {
  if (!colaboradorPonto.value) return
  const res = await api.get(`/colaboradores/${colaboradorPonto.value.id}/ponto?mes=${mesPonto.value}`)
  registrosPonto.value = res.registros
  resumoPonto.value = res.resumo
}

async function fetchTudo() {
  loading.value = true
  try {
    await fetchFazendas()
    await Promise.all([fetchColaboradores(), fetchTarefas()])
  } finally {
    loading.value = false
  }
}

watch(mesPonto, fetchPonto)

// --------------------------------------------------------------------
// AÇÕES: COLABORADORES
// --------------------------------------------------------------------
function abrirNovoColab() {
  editandoColab.value = null
  formColab.value = { nome: '', funcao: funcoes[0], telefone: '', email: '', dataAdmissao: '', salario: '', fazendaId: fazendas.value[0]?.id || '' }
  showModalColab.value = true
}

function abrirEditarColab(c: any) {
  editandoColab.value = c
  formColab.value = {
    nome: c.nome, funcao: c.funcao, telefone: c.telefone || '',
    email: c.email || '', dataAdmissao: c.dataAdmissao ? c.dataAdmissao.slice(0, 10) : '',
    salario: c.salario || '', fazendaId: c.fazendaId
  }
  showModalColab.value = true
}

async function salvarColab() {
  if (!formColab.value.nome || !formColab.value.funcao) return
  salvandoColab.value = true
  try {
    const payload = {
      nome: formColab.value.nome,
      funcao: formColab.value.funcao,
      telefone: formColab.value.telefone || undefined,
      email: formColab.value.email || undefined,
      dataAdmissao: formColab.value.dataAdmissao ? new Date(formColab.value.dataAdmissao).toISOString() : undefined,
      salario: formColab.value.salario ? Number(formColab.value.salario) : undefined,
      fazendaId: Number(formColab.value.fazendaId)
    }
    if (editandoColab.value) {
      await api.put(`/colaboradores/${editandoColab.value.id}`, payload)
    } else {
      await api.post('/colaboradores', payload)
    }
    showModalColab.value = false
    await fetchColaboradores()
  } finally {
    salvandoColab.value = false
  }
}

async function desativarColab(id: number, statusAtual: string) {
  const novoStatus = statusAtual === 'ativo' ? 'inativo' : 'ativo'
  await api.put(`/colaboradores/${id}`, { status: novoStatus })
  await fetchColaboradores()
}

async function deletarColab(id: number) {
  if (!confirm('Remover colaborador? As tarefas serão desvinculadas.')) return
  await api.delete(`/colaboradores/${id}`)
  await fetchColaboradores()
}

// --------------------------------------------------------------------
// AÇÕES: TAREFAS
// --------------------------------------------------------------------
async function salvarTarefa() {
  if (!formTarefa.value.titulo || !formTarefa.value.fazendaId) return
  salvandoTarefa.value = true
  try {
    await api.post('/colaboradores/tarefas', {
      titulo: formTarefa.value.titulo,
      descricao: formTarefa.value.descricao || undefined,
      prioridade: formTarefa.value.prioridade,
      dataPrazo: formTarefa.value.dataPrazo ? new Date(formTarefa.value.dataPrazo).toISOString() : undefined,
      colaboradorId: formTarefa.value.colaboradorId ? Number(formTarefa.value.colaboradorId) : undefined,
      fazendaId: Number(formTarefa.value.fazendaId)
    })
    showModalTarefa.value = false
    formTarefa.value = { titulo: '', descricao: '', prioridade: 'media', dataPrazo: '', colaboradorId: '', fazendaId: fazendas.value[0]?.id || '' }
    await fetchTarefas()
  } finally {
    salvandoTarefa.value = false
  }
}

async function moverTarefa(tarefa: any, novoStatus: string) {
  await api.put(`/colaboradores/tarefas/${tarefa.id}`, { status: novoStatus })
  tarefa.status = novoStatus
  await fetchTarefas()
}

async function deletarTarefa(id: number) {
  await api.delete(`/colaboradores/tarefas/${id}`)
  tarefas.value = tarefas.value.filter(t => t.id !== id)
}

// --------------------------------------------------------------------
// AÇÕES: PONTO
// --------------------------------------------------------------------
async function abrirPonto(c: any) {
  colaboradorPonto.value = c
  abaAtiva.value = 'ponto'
  await fetchPonto()
}

async function registrarPonto() {
  if (!colaboradorPonto.value || !formPonto.value.data) return
  salvandoPonto.value = true
  try {
    await api.post(`/colaboradores/${colaboradorPonto.value.id}/ponto`, {
      data: new Date(formPonto.value.data).toISOString(),
      entrada: formPonto.value.entrada ? new Date(`${formPonto.value.data}T${formPonto.value.entrada}`).toISOString() : undefined,
      saida: formPonto.value.saida ? new Date(`${formPonto.value.data}T${formPonto.value.saida}`).toISOString() : undefined,
      observacao: formPonto.value.observacao || undefined
    })
    formPonto.value.entrada = ''
    formPonto.value.saida = ''
    formPonto.value.observacao = ''
    await fetchPonto()
  } finally {
    salvandoPonto.value = false
  }
}

// --------------------------------------------------------------------
// HELPERS
// --------------------------------------------------------------------
const prioridadeInfo: Record<string, { label: string; color: string }> = {
  alta: { label: 'Alta', color: '#f87171' },
  media: { label: 'Média', color: '#facc15' },
  baixa: { label: 'Baixa', color: '#4ade80' }
}

const statusTarefaInfo: Record<string, { label: string; next: string; nextLabel: string }> = {
  pendente: { label: 'Pendente', next: 'em_andamento', nextLabel: 'Iniciar' },
  em_andamento: { label: 'Em andamento', next: 'concluida', nextLabel: 'Concluir' },
  concluida: { label: 'Concluída', next: 'pendente', nextLabel: 'Reabrir' }
}

function formatarData(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR')
}

function formatarHora(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function calcularHoras(entrada: string | null, saida: string | null) {
  if (!entrada || !saida) return '—'
  const min = (new Date(saida).getTime() - new Date(entrada).getTime()) / 60000
  return `${Math.floor(min / 60)}h${String(Math.round(min % 60)).padStart(2, '0')}m`
}

onMounted(fetchTudo)
</script>

<template>
  <div class="page">
    <!-- CABEÇALHO -->
    <div class="header">
      <div>
        <h1 class="page-title">Colaboradores</h1>
        <p class="page-sub">Equipe, tarefas e controle de ponto</p>
      </div>
      <div class="header-actions">
        <button v-if="abaAtiva === 'equipe'" class="btn-primary" @click="abrirNovoColab" :disabled="fazendas.length === 0">
          <i class="ti ti-plus"></i> Novo Colaborador
        </button>
        <button v-if="abaAtiva === 'tarefas'" class="btn-primary" @click="showModalTarefa = true" :disabled="fazendas.length === 0">
          <i class="ti ti-plus"></i> Nova Tarefa
        </button>
      </div>
    </div>

    <div v-if="!loading && fazendas.length === 0" class="alert-info">
      <i class="ti ti-info-circle"></i> Cadastre uma fazenda antes de gerenciar colaboradores.
    </div>

    <!-- ABAS -->
    <div class="tabs">
      <button class="tab-btn" :class="{ active: abaAtiva === 'equipe' }" @click="abaAtiva = 'equipe'">
        <i class="ti ti-users"></i> Equipe
      </button>
      <button class="tab-btn" :class="{ active: abaAtiva === 'tarefas' }" @click="abaAtiva = 'tarefas'">
        <i class="ti ti-layout-kanban"></i> Tarefas
      </button>
      <button class="tab-btn" :class="{ active: abaAtiva === 'ponto' }" @click="abaAtiva = 'ponto'">
        <i class="ti ti-clock"></i> Ponto
        <span v-if="colaboradorPonto" class="tab-badge">{{ colaboradorPonto.nome.split(' ')[0] }}</span>
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <i class="ti ti-loader-2 spin"></i> Carregando...
    </div>

    <!-- ============================================================ -->
    <!-- ABA EQUIPE -->
    <!-- ============================================================ -->
    <template v-else-if="abaAtiva === 'equipe'">
      <!-- Filtro de fazenda -->
      <div class="filtros" v-if="colaboradores.length > 0">
        <select v-model="filtroFazenda" class="select-filtro">
          <option value="todas">Todas as fazendas</option>
          <option v-for="f in fazendas" :key="f.id" :value="f.id">{{ f.nome }}</option>
        </select>
        <span class="filtro-info">{{ colaboradoresFiltrados.length }} colaboradores</span>
      </div>

      <div v-if="colaboradoresFiltrados.length === 0" class="empty-state">
        <div class="empty-icon"><i class="ti ti-users"></i></div>
        <h3>Nenhum colaborador cadastrado</h3>
        <p>Adicione os membros da equipe para gerenciar tarefas e controlar presença.</p>
        <button class="btn-primary" @click="abrirNovoColab"><i class="ti ti-plus"></i> Adicionar colaborador</button>
      </div>

      <div v-else class="colab-grid">
        <div v-for="c in colaboradoresFiltrados" :key="c.id" class="colab-card" :class="{ inativo: c.status === 'inativo' }">
          <!-- Avatar inicial -->
          <div class="colab-avatar">{{ c.nome.charAt(0).toUpperCase() }}</div>

          <div class="colab-info">
            <div class="colab-nome">{{ c.nome }}
              <span v-if="c.status === 'inativo'" class="badge-inativo">Inativo</span>
            </div>
            <div class="colab-funcao">{{ c.funcao }}</div>
            <div class="colab-fazenda"><i class="ti ti-map-pin"></i> {{ c.fazenda?.nome }}</div>
            <div class="colab-meta">
              <span v-if="c.dataAdmissao"><i class="ti ti-calendar"></i> desde {{ formatarData(c.dataAdmissao) }}</span>
              <span v-if="c.telefone"><i class="ti ti-phone"></i> {{ c.telefone }}</span>
            </div>
          </div>

          <div class="colab-actions">
            <button class="icon-btn" title="Ver ponto" @click="abrirPonto(c)"><i class="ti ti-clock"></i></button>
            <button class="icon-btn" title="Editar" @click="abrirEditarColab(c)"><i class="ti ti-edit"></i></button>
            <button class="icon-btn" :title="c.status === 'ativo' ? 'Desativar' : 'Reativar'" @click="desativarColab(c.id, c.status)">
              <i :class="['ti', c.status === 'ativo' ? 'ti-user-off' : 'ti-user-check']"></i>
            </button>
            <button class="icon-btn danger" title="Remover" @click="deletarColab(c.id)"><i class="ti ti-trash"></i></button>
          </div>
        </div>
      </div>
    </template>

    <!-- ============================================================ -->
    <!-- ABA TAREFAS (KANBAN) -->
    <!-- ============================================================ -->
    <template v-else-if="abaAtiva === 'tarefas'">
      <div v-if="tarefas.length === 0" class="empty-state">
        <div class="empty-icon"><i class="ti ti-layout-kanban"></i></div>
        <h3>Nenhuma tarefa criada</h3>
        <p>Crie tarefas e atribua aos colaboradores para organizar o trabalho da fazenda.</p>
        <button class="btn-primary" @click="showModalTarefa = true"><i class="ti ti-plus"></i> Criar tarefa</button>
      </div>

      <div v-else class="kanban">
        <!-- Coluna para cada status -->
        <div v-for="(col, statusKey) in tarefasPorStatus" :key="statusKey" class="kanban-col">
          <div class="kanban-header" :class="statusKey">
            <span>{{ statusTarefaInfo[statusKey].label }}</span>
            <span class="kanban-count">{{ col.length }}</span>
          </div>

          <div class="kanban-cards">
            <div v-for="t in col" :key="t.id" class="kanban-card">
              <!-- Prioridade -->
              <div class="tarefa-prio" :style="`color:${prioridadeInfo[t.prioridade].color}`">
                <i class="ti ti-flag"></i> {{ prioridadeInfo[t.prioridade].label }}
              </div>

              <div class="tarefa-titulo">{{ t.titulo }}</div>
              <p v-if="t.descricao" class="tarefa-desc">{{ t.descricao }}</p>

              <div class="tarefa-meta">
                <span v-if="t.colaborador"><i class="ti ti-user"></i> {{ t.colaborador.nome }}</span>
                <span v-if="t.dataPrazo"><i class="ti ti-calendar"></i> {{ formatarData(t.dataPrazo) }}</span>
                <span><i class="ti ti-map"></i> {{ t.fazenda?.nome }}</span>
              </div>

              <div class="tarefa-actions">
                <!-- Move para o próximo status -->
                <button class="btn-mover" @click="moverTarefa(t, statusTarefaInfo[statusKey].next)">
                  {{ statusTarefaInfo[statusKey].nextLabel }} →
                </button>
                <button class="icon-btn danger" @click="deletarTarefa(t.id)"><i class="ti ti-trash"></i></button>
              </div>
            </div>

            <div v-if="col.length === 0" class="kanban-empty">Nenhuma tarefa aqui</div>
          </div>
        </div>
      </div>
    </template>

    <!-- ============================================================ -->
    <!-- ABA PONTO -->
    <!-- ============================================================ -->
    <template v-else-if="abaAtiva === 'ponto'">
      <!-- Seletor de colaborador -->
      <div v-if="!colaboradorPonto" class="select-colab-wrap">
        <p class="select-colab-hint">Selecione um colaborador para ver o ponto:</p>
        <div class="select-colab-grid">
          <button v-for="c in colaboradores.filter(c => c.status === 'ativo')" :key="c.id"
            class="select-colab-btn" @click="abrirPonto(c)">
            <div class="colab-avatar-sm">{{ c.nome.charAt(0).toUpperCase() }}</div>
            <div>
              <div style="font-size:0.88rem;font-weight:500">{{ c.nome }}</div>
              <div style="font-size:0.75rem;color:var(--text3)">{{ c.funcao }}</div>
            </div>
          </button>
        </div>
      </div>

      <template v-else>
        <!-- Cabeçalho do colaborador selecionado -->
        <div class="ponto-header">
          <div style="display:flex;align-items:center;gap:12px">
            <div class="colab-avatar">{{ colaboradorPonto.nome.charAt(0).toUpperCase() }}</div>
            <div>
              <div style="font-family:var(--font-display);font-weight:800">{{ colaboradorPonto.nome }}</div>
              <div style="font-size:0.82rem;color:var(--text3)">{{ colaboradorPonto.funcao }}</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <input type="month" v-model="mesPonto" class="input-mes" />
            <button class="btn-ghost" @click="colaboradorPonto = null"><i class="ti ti-x"></i> Fechar</button>
          </div>
        </div>

        <!-- Resumo do mês -->
        <div class="ponto-resumo">
          <div class="resumo-item"><strong>{{ resumoPonto.totalDias }}</strong><span>Dias registrados</span></div>
          <div class="resumo-item"><strong>{{ resumoPonto.totalHoras }}h{{ String(resumoPonto.totalMinutos).padStart(2,'0') }}m</strong><span>Horas trabalhadas</span></div>
        </div>

        <!-- Registrar ponto -->
        <div class="ponto-form-wrap">
          <h3 class="panel-title">Registrar ponto</h3>
          <div class="ponto-form">
            <div class="field"><label>Data</label><input v-model="formPonto.data" type="date" /></div>
            <div class="field"><label>Entrada</label><input v-model="formPonto.entrada" type="time" /></div>
            <div class="field"><label>Saída</label><input v-model="formPonto.saida" type="time" /></div>
            <div class="field"><label>Observação</label><input v-model="formPonto.observacao" type="text" placeholder="Opcional" /></div>
          </div>
          <button class="btn-primary" @click="registrarPonto" :disabled="salvandoPonto">
            <i v-if="salvandoPonto" class="ti ti-loader-2 spin"></i>
            <span v-else><i class="ti ti-check"></i> Salvar registro</span>
          </button>
        </div>

        <!-- Histórico -->
        <div v-if="registrosPonto.length > 0" class="table-wrap">
          <table>
            <thead>
              <tr><th>Data</th><th>Entrada</th><th>Saída</th><th>Total</th><th>Observação</th></tr>
            </thead>
            <tbody>
              <tr v-for="r in registrosPonto" :key="r.id">
                <td>{{ formatarData(r.data) }}</td>
                <td class="hora">{{ formatarHora(r.entrada) }}</td>
                <td class="hora">{{ formatarHora(r.saida) }}</td>
                <td class="hora">{{ calcularHoras(r.entrada, r.saida) }}</td>
                <td class="muted">{{ r.observacao || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty-state" style="border:none;padding:2rem">
          <p style="color:var(--text3)">Nenhum registro neste mês.</p>
        </div>
      </template>
    </template>

    <!-- ============================================================ -->
    <!-- MODAL: NOVO/EDITAR COLABORADOR -->
    <!-- ============================================================ -->
    <div v-if="showModalColab" class="modal-overlay" @click.self="showModalColab = false">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ editandoColab ? 'Editar Colaborador' : 'Novo Colaborador' }}</h3>
          <button class="modal-close" @click="showModalColab = false"><i class="ti ti-x"></i></button>
        </div>
        <div class="field-row">
          <div class="field">
            <label>Nome completo *</label>
            <input v-model="formColab.nome" type="text" placeholder="Ex: João da Silva" />
          </div>
          <div class="field">
            <label>Função *</label>
            <select v-model="formColab.funcao" class="select-input">
              <option v-for="f in funcoes" :key="f">{{ f }}</option>
            </select>
          </div>
        </div>
        <div class="field-row">
          <div class="field">
            <label>Telefone</label>
            <input v-model="formColab.telefone" type="tel" placeholder="(00) 00000-0000" />
          </div>
          <div class="field">
            <label>E-mail</label>
            <input v-model="formColab.email" type="email" placeholder="Opcional" />
          </div>
        </div>
        <div class="field-row">
          <div class="field">
            <label>Data de admissão</label>
            <input v-model="formColab.dataAdmissao" type="date" />
          </div>
          <div class="field">
            <label>Salário (R$)</label>
            <input v-model="formColab.salario" type="number" step="0.01" placeholder="Opcional" />
          </div>
        </div>
        <div class="field">
          <label>Fazenda</label>
          <select v-model="formColab.fazendaId" class="select-input">
            <option v-for="f in fazendas" :key="f.id" :value="f.id">{{ f.nome }}</option>
          </select>
        </div>
        <div class="modal-actions">
          <button class="btn-outline-lg" @click="showModalColab = false">Cancelar</button>
          <button class="btn-primary-lg" @click="salvarColab" :disabled="salvandoColab">
            <i v-if="salvandoColab" class="ti ti-loader-2 spin"></i>
            <span v-else>Salvar</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- MODAL: NOVA TAREFA -->
    <!-- ============================================================ -->
    <div v-if="showModalTarefa" class="modal-overlay" @click.self="showModalTarefa = false">
      <div class="modal">
        <div class="modal-header">
          <h3>Nova Tarefa</h3>
          <button class="modal-close" @click="showModalTarefa = false"><i class="ti ti-x"></i></button>
        </div>
        <div class="field">
          <label>Título *</label>
          <input v-model="formTarefa.titulo" type="text" placeholder="Ex: Aplicar herbicida no setor A" />
        </div>
        <div class="field">
          <label>Descrição</label>
          <input v-model="formTarefa.descricao" type="text" placeholder="Detalhes da tarefa (opcional)" />
        </div>
        <div class="field-row">
          <div class="field">
            <label>Prioridade</label>
            <select v-model="formTarefa.prioridade" class="select-input">
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
            </select>
          </div>
          <div class="field">
            <label>Prazo</label>
            <input v-model="formTarefa.dataPrazo" type="date" />
          </div>
        </div>
        <div class="field-row">
          <div class="field">
            <label>Atribuir a</label>
            <select v-model="formTarefa.colaboradorId" class="select-input">
              <option value="">Sem responsável</option>
              <option v-for="c in colaboradores.filter(c => c.status === 'ativo')" :key="c.id" :value="c.id">{{ c.nome }}</option>
            </select>
          </div>
          <div class="field">
            <label>Fazenda</label>
            <select v-model="formTarefa.fazendaId" class="select-input">
              <option v-for="f in fazendas" :key="f.id" :value="f.id">{{ f.nome }}</option>
            </select>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-outline-lg" @click="showModalTarefa = false">Cancelar</button>
          <button class="btn-primary-lg" @click="salvarTarefa" :disabled="salvandoTarefa">
            <i v-if="salvandoTarefa" class="ti ti-loader-2 spin"></i>
            <span v-else>Criar tarefa</span>
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
.tab-badge { background: var(--green); color: #0a0f0d; font-size: 0.65rem; padding: 1px 7px; border-radius: 10px; font-weight: 700; }

.loading-state { display: flex; align-items: center; gap: 8px; color: var(--text3); padding: 3rem; justify-content: center; }

/* Filtros */
.filtros { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem; }
.select-filtro { background: var(--surface); border: 1px solid var(--border); color: var(--text); padding: 9px 14px; border-radius: 10px; font-size: 0.85rem; font-family: var(--font-body); outline: none; }
.filtro-info { font-size: 0.82rem; color: var(--text3); }

/* Empty state */
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 4rem 2rem; text-align: center; background: var(--surface); border: 2px dashed var(--border); border-radius: 20px; }
.empty-icon { width: 64px; height: 64px; background: var(--surface2); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 28px; color: var(--text3); }
.empty-state h3 { font-family: var(--font-display); font-size: 1.2rem; font-weight: 800; }
.empty-state p { color: var(--text3); font-size: 0.88rem; max-width: 360px; line-height: 1.6; }

/* Grid de colaboradores */
.colab-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px,1fr)); gap: 1.25rem; }
.colab-card { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: 1.25rem 1.5rem; display: flex; align-items: flex-start; gap: 1rem; transition: border-color 0.2s; }
.colab-card.inativo { opacity: 0.6; }
.colab-card:hover { border-color: var(--green); }
.colab-avatar { width: 48px; height: 48px; border-radius: 50%; background: var(--surface2); border: 2px solid var(--green); display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-size: 1.2rem; font-weight: 800; color: var(--green); flex-shrink: 0; }
.colab-info { flex: 1; min-width: 0; }
.colab-nome { font-family: var(--font-display); font-size: 0.95rem; font-weight: 800; display: flex; align-items: center; gap: 6px; }
.badge-inativo { background: var(--surface2); color: var(--text3); font-size: 0.65rem; padding: 2px 8px; border-radius: 10px; font-weight: 500; }
.colab-funcao { font-size: 0.82rem; color: var(--green); margin-top: 2px; }
.colab-fazenda { font-size: 0.78rem; color: var(--text3); margin-top: 4px; display: flex; align-items: center; gap: 4px; }
.colab-meta { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
.colab-meta span { font-size: 0.75rem; color: var(--text3); display: flex; align-items: center; gap: 3px; }
.colab-actions { display: flex; flex-direction: column; gap: 4px; }
.icon-btn { background: none; border: none; color: var(--text3); cursor: pointer; font-size: 16px; padding: 5px 7px; border-radius: 8px; transition: all 0.2s; }
.icon-btn:hover { background: var(--surface2); color: var(--text); }
.icon-btn.danger:hover { color: var(--red); background: #1a0a0a; }

/* Kanban */
.kanban { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; align-items: start; }
.kanban-col { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; overflow: hidden; }
.kanban-header { padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; font-weight: 600; border-bottom: 1px solid var(--border); }
.kanban-header.pendente { background: var(--surface2); }
.kanban-header.em_andamento { background: #0e2a2e; color: #22d3ee; }
.kanban-header.concluida { background: #0f2e17; color: var(--green); }
.kanban-count { background: rgba(255,255,255,0.1); font-size: 0.72rem; padding: 2px 8px; border-radius: 10px; }
.kanban-cards { padding: 10px; display: flex; flex-direction: column; gap: 8px; min-height: 120px; }
.kanban-card { background: var(--bg); border: 1px solid var(--border); border-radius: 12px; padding: 12px; }
.tarefa-prio { font-size: 0.7rem; display: flex; align-items: center; gap: 3px; margin-bottom: 6px; }
.tarefa-titulo { font-size: 0.88rem; font-weight: 600; margin-bottom: 4px; }
.tarefa-desc { font-size: 0.78rem; color: var(--text3); line-height: 1.4; margin-bottom: 8px; }
.tarefa-meta { display: flex; flex-direction: column; gap: 3px; margin-bottom: 8px; }
.tarefa-meta span { font-size: 0.72rem; color: var(--text3); display: flex; align-items: center; gap: 4px; }
.tarefa-actions { display: flex; justify-content: space-between; align-items: center; }
.btn-mover { background: var(--surface); border: 1px solid var(--border); color: var(--text2); padding: 5px 10px; border-radius: 8px; font-size: 0.75rem; cursor: pointer; font-family: var(--font-body); transition: all 0.2s; }
.btn-mover:hover { border-color: var(--green); color: var(--green); }
.kanban-empty { font-size: 0.8rem; color: var(--text3); text-align: center; padding: 1rem; }

/* Ponto */
.select-colab-wrap { padding: 1rem 0; }
.select-colab-hint { font-size: 0.9rem; color: var(--text3); margin-bottom: 1rem; }
.select-colab-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px,1fr)); gap: 10px; }
.select-colab-btn { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 12px 16px; cursor: pointer; display: flex; align-items: center; gap: 12px; transition: all 0.2s; text-align: left; font-family: var(--font-body); color: var(--text); }
.select-colab-btn:hover { border-color: var(--green); }
.colab-avatar-sm { width: 36px; height: 36px; border-radius: 50%; background: var(--surface2); border: 2px solid var(--green); display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-size: 1rem; font-weight: 800; color: var(--green); flex-shrink: 0; }
.ponto-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 1rem; }
.input-mes { background: var(--surface); border: 1px solid var(--border); color: var(--text); padding: 8px 12px; border-radius: 10px; font-family: var(--font-body); font-size: 0.9rem; outline: none; }
.btn-ghost { background: none; border: 1px solid var(--border); color: var(--text3); padding: 8px 14px; border-radius: 10px; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; gap: 5px; font-family: var(--font-body); }
.ponto-resumo { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
.resumo-item { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 1rem 1.5rem; text-align: center; }
.resumo-item strong { display: block; font-family: var(--font-display); font-size: 1.6rem; font-weight: 800; color: var(--green); }
.resumo-item span { font-size: 0.78rem; color: var(--text3); }
.ponto-form-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: 1.5rem; margin-bottom: 1.25rem; }
.panel-title { font-family: var(--font-display); font-size: 1rem; font-weight: 800; margin-bottom: 1rem; }
.ponto-form { display: grid; grid-template-columns: repeat(4,1fr); gap: 1rem; margin-bottom: 1rem; }
.table-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; overflow: auto; }
table { width: 100%; border-collapse: collapse; font-size: 0.88rem; min-width: 500px; }
thead tr { border-bottom: 1px solid var(--border); }
th { padding: 12px 16px; text-align: left; color: var(--text3); font-weight: 500; font-size: 0.78rem; }
td { padding: 12px 16px; border-bottom: 1px solid var(--surface2); }
tr:last-child td { border-bottom: none; }
.hora { font-family: monospace; color: var(--green); }
.muted { color: var(--text3); }

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
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.modal-actions { display: flex; gap: 10px; margin-top: 1.5rem; }
.btn-outline-lg { flex: 1; background: transparent; border: 1px solid var(--border); color: var(--text2); padding: 11px; border-radius: 10px; font-size: 0.9rem; cursor: pointer; font-family: var(--font-body); }
.btn-primary-lg { flex: 1; background: var(--green); color: #0a0f0d; border: none; padding: 11px; border-radius: 10px; font-size: 0.9rem; font-weight: 700; cursor: pointer; font-family: var(--font-body); display: flex; align-items: center; justify-content: center; gap: 6px; }
.btn-primary-lg:disabled { opacity: 0.6; cursor: not-allowed; }

.spin { animation: spin 1s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 1024px) { .kanban { grid-template-columns: 1fr; } }
@media (max-width: 768px) {
  .page { padding: 1rem; }
  .colab-grid { grid-template-columns: 1fr; }
  .ponto-form { grid-template-columns: 1fr 1fr; }
  .field-row { grid-template-columns: 1fr; }
}
</style>
