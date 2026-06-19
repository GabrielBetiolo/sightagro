<!--
============================================================================
  ESTOQUE DE INSUMOS
============================================================================
  Controle de sementes, fertilizantes, defensivos e combustível.

  IMPORTANTE: a quantidade de cada insumo NUNCA é editada diretamente pelo
  usuário na tela de edição - toda alteração de quantidade passa pelo botão
  "Movimentar" (entrada/saída), que registra histórico e gera alertas de
  estoque baixo automaticamente.
============================================================================
-->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '../composables/useApi'

// --------------------------------------------------------------------
// ESTADO
// --------------------------------------------------------------------
const insumos = ref<any[]>([])
const fazendas = ref<any[]>([])
const resumo = ref<any>({ totalItens: 0, itensEstoqueBaixo: 0, valorTotalEstoque: 0, porCategoria: {} })
const loading = ref(true)
const filtroFazenda = ref<number | 'todas'>('todas')
const filtroCategoria = ref<string | 'todas'>('todas')
const apenasEstoqueBaixo = ref(false)

const categorias = ['Semente', 'Fertilizante', 'Defensivo', 'Combustível', 'Outro']
const unidades = ['kg', 'L', 'sc', 'ton', 'un']

// --------------------------------------------------------------------
// MODAL: NOVO/EDITAR INSUMO
// --------------------------------------------------------------------
const showModalInsumo = ref(false)
const salvandoInsumo = ref(false)
const editandoInsumo = ref<any>(null)
const formInsumo = ref({
  nome: '', categoria: categorias[0], unidade: unidades[0],
  quantidade: '0', estoqueMinimo: '0', precoUnitario: '', fornecedor: '',
  fazendaId: '' as number | ''
})

// --------------------------------------------------------------------
// MODAL: MOVIMENTAÇÃO (entrada/saída)
// --------------------------------------------------------------------
const showModalMov = ref(false)
const salvandoMov = ref(false)
const insumoMovimentando = ref<any>(null)
const formMov = ref({ tipo: 'entrada' as 'entrada' | 'saida', quantidade: '', motivo: '' })

// --------------------------------------------------------------------
// MODAL: HISTÓRICO
// --------------------------------------------------------------------
const showModalHistorico = ref(false)
const historicoInsumo = ref<any>(null)
const movimentacoes = ref<any[]>([])

// --------------------------------------------------------------------
// CARREGAMENTO
// --------------------------------------------------------------------
async function fetchFazendas() {
  fazendas.value = await api.get('/fazendas')
  if (fazendas.value.length > 0 && !formInsumo.value.fazendaId) {
    formInsumo.value.fazendaId = fazendas.value[0].id
  }
}

async function fetchInsumos() {
  insumos.value = await api.get('/estoque')
}

async function fetchResumo() {
  resumo.value = await api.get('/estoque/resumo')
}

async function fetchTudo() {
  loading.value = true
  try {
    await fetchFazendas()
    await Promise.all([fetchInsumos(), fetchResumo()])
  } finally {
    loading.value = false
  }
}

// --------------------------------------------------------------------
// COMPUTED: FILTROS
// --------------------------------------------------------------------
const insumosFiltrados = computed(() => {
  return insumos.value.filter((i) => {
    const okFazenda = filtroFazenda.value === 'todas' || i.fazendaId === filtroFazenda.value
    const okCategoria = filtroCategoria.value === 'todas' || i.categoria === filtroCategoria.value
    const okEstoque = !apenasEstoqueBaixo.value || i.estoqueBaixo
    return okFazenda && okCategoria && okEstoque
  })
})

function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// --------------------------------------------------------------------
// AÇÕES: INSUMO
// --------------------------------------------------------------------
function abrirNovoInsumo() {
  editandoInsumo.value = null
  formInsumo.value = { nome: '', categoria: categorias[0], unidade: unidades[0], quantidade: '0', estoqueMinimo: '0', precoUnitario: '', fornecedor: '', fazendaId: fazendas.value[0]?.id || '' }
  showModalInsumo.value = true
}

function abrirEditarInsumo(i: any) {
  editandoInsumo.value = i
  formInsumo.value = {
    nome: i.nome, categoria: i.categoria, unidade: i.unidade,
    quantidade: String(i.quantidade), estoqueMinimo: String(i.estoqueMinimo),
    precoUnitario: i.precoUnitario ? String(i.precoUnitario) : '',
    fornecedor: i.fornecedor || '', fazendaId: i.fazendaId
  }
  showModalInsumo.value = true
}

async function salvarInsumo() {
  if (!formInsumo.value.nome || !formInsumo.value.fazendaId) return
  salvandoInsumo.value = true
  try {
    if (editandoInsumo.value) {
      // Edição: não envia quantidade (isso é feito via movimentação)
      await api.put(`/estoque/${editandoInsumo.value.id}`, {
        nome: formInsumo.value.nome,
        categoria: formInsumo.value.categoria,
        unidade: formInsumo.value.unidade,
        estoqueMinimo: Number(formInsumo.value.estoqueMinimo),
        precoUnitario: formInsumo.value.precoUnitario ? Number(formInsumo.value.precoUnitario) : undefined,
        fornecedor: formInsumo.value.fornecedor || undefined
      })
    } else {
      // Criação: quantidade inicial é permitida
      await api.post('/estoque', {
        nome: formInsumo.value.nome,
        categoria: formInsumo.value.categoria,
        unidade: formInsumo.value.unidade,
        quantidade: Number(formInsumo.value.quantidade) || 0,
        estoqueMinimo: Number(formInsumo.value.estoqueMinimo) || 0,
        precoUnitario: formInsumo.value.precoUnitario ? Number(formInsumo.value.precoUnitario) : undefined,
        fornecedor: formInsumo.value.fornecedor || undefined,
        fazendaId: Number(formInsumo.value.fazendaId)
      })
    }
    showModalInsumo.value = false
    await Promise.all([fetchInsumos(), fetchResumo()])
  } finally {
    salvandoInsumo.value = false
  }
}

async function deletarInsumo(id: number) {
  if (!confirm('Remover este insumo e todo o histórico de movimentações?')) return
  await api.delete(`/estoque/${id}`)
  await Promise.all([fetchInsumos(), fetchResumo()])
}

// --------------------------------------------------------------------
// AÇÕES: MOVIMENTAÇÃO
// --------------------------------------------------------------------
function abrirMovimentacao(insumo: any, tipo: 'entrada' | 'saida') {
  insumoMovimentando.value = insumo
  formMov.value = { tipo, quantidade: '', motivo: tipo === 'entrada' ? 'Compra' : 'Aplicação' }
  showModalMov.value = true
}

async function salvarMovimentacao() {
  if (!insumoMovimentando.value || !formMov.value.quantidade) return
  salvandoMov.value = true
  try {
    await api.post(`/estoque/${insumoMovimentando.value.id}/movimentacao`, {
      tipo: formMov.value.tipo,
      quantidade: Number(formMov.value.quantidade),
      motivo: formMov.value.motivo || undefined
    })
    showModalMov.value = false
    await Promise.all([fetchInsumos(), fetchResumo()])
  } catch (err: any) {
    alert(err.message || 'Erro ao registrar movimentação')
  } finally {
    salvandoMov.value = false
  }
}

// --------------------------------------------------------------------
// AÇÕES: HISTÓRICO
// --------------------------------------------------------------------
async function abrirHistorico(insumo: any) {
  historicoInsumo.value = insumo
  showModalHistorico.value = true
  movimentacoes.value = await api.get(`/estoque/${insumo.id}/movimentacoes`)
}

function formatarData(d: string) {
  return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// Cor de acordo com a categoria, para dar um toque visual diferenciador
const categoriaCor: Record<string, string> = {
  Semente: '#4ade80', Fertilizante: '#facc15', Defensivo: '#f87171',
  Combustível: '#a78bfa', Outro: '#6b7280'
}

const categoriaIcone: Record<string, string> = {
  Semente: 'ti-seeding', Fertilizante: 'ti-flask', Defensivo: 'ti-spray',
  Combustível: 'ti-gas-station', Outro: 'ti-package'
}

onMounted(fetchTudo)
</script>

<template>
  <div class="page">
    <!-- CABEÇALHO -->
    <div class="header">
      <div>
        <h1 class="page-title">Estoque de Insumos</h1>
        <p class="page-sub">Sementes, fertilizantes, defensivos e combustível</p>
      </div>
      <button class="btn-primary" @click="abrirNovoInsumo" :disabled="fazendas.length === 0">
        <i class="ti ti-plus"></i> Novo Insumo
      </button>
    </div>

    <div v-if="!loading && fazendas.length === 0" class="alert-info">
      <i class="ti ti-info-circle"></i> Cadastre uma fazenda antes de gerenciar o estoque.
    </div>

    <!-- RESUMO -->
    <div v-if="!loading && insumos.length > 0" class="resumo-grid">
      <div class="resumo-card">
        <i class="ti ti-package" style="color:#4ade80"></i>
        <div><strong>{{ resumo.totalItens }}</strong><span>Itens cadastrados</span></div>
      </div>
      <div class="resumo-card" :class="{ alerta: resumo.itensEstoqueBaixo > 0 }">
        <i class="ti ti-alert-triangle" :style="`color:${resumo.itensEstoqueBaixo > 0 ? '#facc15' : '#4ade80'}`"></i>
        <div><strong>{{ resumo.itensEstoqueBaixo }}</strong><span>Com estoque baixo</span></div>
      </div>
      <div class="resumo-card">
        <i class="ti ti-coin" style="color:#22d3ee"></i>
        <div><strong>{{ formatarMoeda(resumo.valorTotalEstoque) }}</strong><span>Valor total em estoque</span></div>
      </div>
    </div>

    <!-- FILTROS -->
    <div v-if="insumos.length > 0" class="filtros">
      <select v-model="filtroFazenda" class="select-filtro">
        <option value="todas">Todas as fazendas</option>
        <option v-for="f in fazendas" :key="f.id" :value="f.id">{{ f.nome }}</option>
      </select>
      <select v-model="filtroCategoria" class="select-filtro">
        <option value="todas">Todas as categorias</option>
        <option v-for="c in categorias" :key="c" :value="c">{{ c }}</option>
      </select>
      <button class="toggle-baixo" :class="{ active: apenasEstoqueBaixo }" @click="apenasEstoqueBaixo = !apenasEstoqueBaixo">
        <i class="ti ti-alert-triangle"></i> Apenas estoque baixo
      </button>
    </div>

    <div v-if="loading" class="loading-state"><i class="ti ti-loader-2 spin"></i> Carregando estoque...</div>

    <!-- EMPTY STATE -->
    <div v-else-if="insumos.length === 0 && fazendas.length > 0" class="empty-state">
      <div class="empty-icon"><i class="ti ti-package"></i></div>
      <h3>Nenhum insumo cadastrado</h3>
      <p>Cadastre sementes, fertilizantes e defensivos para controlar o estoque e receber alertas quando estiver acabando.</p>
      <button class="btn-primary" @click="abrirNovoInsumo"><i class="ti ti-plus"></i> Adicionar insumo</button>
    </div>

    <!-- GRID DE INSUMOS -->
    <div v-else class="insumos-grid">
      <div v-for="i in insumosFiltrados" :key="i.id" class="insumo-card" :class="{ baixo: i.estoqueBaixo }">
        <div class="insumo-top">
          <div class="insumo-icon" :style="`background:${categoriaCor[i.categoria]}22;color:${categoriaCor[i.categoria]}`">
            <i :class="['ti', categoriaIcone[i.categoria]]"></i>
          </div>
          <span v-if="i.estoqueBaixo" class="badge-baixo"><i class="ti ti-alert-triangle"></i> Estoque baixo</span>
        </div>

        <h3 class="insumo-nome">{{ i.nome }}</h3>
        <div class="insumo-tag">{{ i.categoria }}</div>

        <div class="insumo-quantidade">
          <strong>{{ i.quantidade }}</strong> <span>{{ i.unidade }}</span>
        </div>
        <div class="insumo-minimo">Mínimo: {{ i.estoqueMinimo }} {{ i.unidade }}</div>

        <div class="insumo-meta">
          <div class="meta-row"><i class="ti ti-map-pin"></i> {{ i.fazenda?.nome }}</div>
          <div v-if="i.fornecedor" class="meta-row"><i class="ti ti-truck"></i> {{ i.fornecedor }}</div>
          <div v-if="i.precoUnitario" class="meta-row"><i class="ti ti-coin"></i> {{ formatarMoeda(i.precoUnitario) }}/{{ i.unidade }}</div>
        </div>

        <div class="insumo-actions">
          <button class="btn-mov entrada" @click="abrirMovimentacao(i, 'entrada')"><i class="ti ti-plus"></i> Entrada</button>
          <button class="btn-mov saida" @click="abrirMovimentacao(i, 'saida')"><i class="ti ti-minus"></i> Saída</button>
        </div>
        <div class="insumo-actions-2">
          <button class="icon-btn" title="Histórico" @click="abrirHistorico(i)"><i class="ti ti-history"></i></button>
          <button class="icon-btn" title="Editar" @click="abrirEditarInsumo(i)"><i class="ti ti-edit"></i></button>
          <button class="icon-btn danger" title="Remover" @click="deletarInsumo(i.id)"><i class="ti ti-trash"></i></button>
        </div>
      </div>
    </div>

    <!-- =================== MODAL: NOVO/EDITAR INSUMO =================== -->
    <div v-if="showModalInsumo" class="modal-overlay" @click.self="showModalInsumo = false">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ editandoInsumo ? 'Editar Insumo' : 'Novo Insumo' }}</h3>
          <button class="modal-close" @click="showModalInsumo = false"><i class="ti ti-x"></i></button>
        </div>

        <div class="field">
          <label>Nome *</label>
          <input v-model="formInsumo.nome" type="text" placeholder="Ex: Ureia 45%, Semente de soja BMX" />
        </div>

        <div class="field-row">
          <div class="field">
            <label>Categoria *</label>
            <select v-model="formInsumo.categoria" class="select-input">
              <option v-for="c in categorias" :key="c">{{ c }}</option>
            </select>
          </div>
          <div class="field">
            <label>Unidade *</label>
            <select v-model="formInsumo.unidade" class="select-input">
              <option v-for="u in unidades" :key="u">{{ u }}</option>
            </select>
          </div>
        </div>

        <div v-if="!editandoInsumo" class="field">
          <label>Quantidade inicial</label>
          <input v-model="formInsumo.quantidade" type="number" step="0.01" placeholder="0" />
          <span class="field-hint"><i class="ti ti-info-circle"></i> Após criado, use os botões Entrada/Saída para ajustar</span>
        </div>

        <div class="field">
          <label>Estoque mínimo (gera alerta)</label>
          <input v-model="formInsumo.estoqueMinimo" type="number" step="0.01" placeholder="0" />
        </div>

        <div class="field-row">
          <div class="field">
            <label>Preço unitário (R$)</label>
            <input v-model="formInsumo.precoUnitario" type="number" step="0.01" placeholder="Opcional" />
          </div>
          <div class="field">
            <label>Fornecedor</label>
            <input v-model="formInsumo.fornecedor" type="text" placeholder="Opcional" />
          </div>
        </div>

        <div v-if="!editandoInsumo" class="field">
          <label>Fazenda *</label>
          <select v-model="formInsumo.fazendaId" class="select-input">
            <option v-for="f in fazendas" :key="f.id" :value="f.id">{{ f.nome }}</option>
          </select>
        </div>

        <div class="modal-actions">
          <button class="btn-outline-lg" @click="showModalInsumo = false">Cancelar</button>
          <button class="btn-primary-lg" @click="salvarInsumo" :disabled="salvandoInsumo">
            <i v-if="salvandoInsumo" class="ti ti-loader-2 spin"></i>
            <span v-else>Salvar</span>
          </button>
        </div>
      </div>
    </div>

    <!-- =================== MODAL: MOVIMENTAÇÃO =================== -->
    <div v-if="showModalMov" class="modal-overlay" @click.self="showModalMov = false">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ formMov.tipo === 'entrada' ? 'Registrar Entrada' : 'Registrar Saída' }}</h3>
          <button class="modal-close" @click="showModalMov = false"><i class="ti ti-x"></i></button>
        </div>

        <div class="mov-info">
          <strong>{{ insumoMovimentando?.nome }}</strong>
          <span>Estoque atual: {{ insumoMovimentando?.quantidade }} {{ insumoMovimentando?.unidade }}</span>
        </div>

        <div class="tipo-toggle">
          <button class="tipo-btn entrada" :class="{ active: formMov.tipo === 'entrada' }" @click="formMov.tipo = 'entrada'">
            <i class="ti ti-arrow-down-circle"></i> Entrada
          </button>
          <button class="tipo-btn saida" :class="{ active: formMov.tipo === 'saida' }" @click="formMov.tipo = 'saida'">
            <i class="ti ti-arrow-up-circle"></i> Saída
          </button>
        </div>

        <div class="field">
          <label>Quantidade ({{ insumoMovimentando?.unidade }}) *</label>
          <input v-model="formMov.quantidade" type="number" step="0.01" placeholder="0" />
        </div>

        <div class="field">
          <label>Motivo</label>
          <input v-model="formMov.motivo" type="text" :placeholder="formMov.tipo === 'entrada' ? 'Ex: Compra, Doação' : 'Ex: Aplicação no setor B, Perda'" />
        </div>

        <div class="modal-actions">
          <button class="btn-outline-lg" @click="showModalMov = false">Cancelar</button>
          <button class="btn-primary-lg" @click="salvarMovimentacao" :disabled="salvandoMov || !formMov.quantidade">
            <i v-if="salvandoMov" class="ti ti-loader-2 spin"></i>
            <span v-else>Confirmar</span>
          </button>
        </div>
      </div>
    </div>

    <!-- =================== MODAL: HISTÓRICO =================== -->
    <div v-if="showModalHistorico" class="modal-overlay" @click.self="showModalHistorico = false">
      <div class="modal">
        <div class="modal-header">
          <h3>Histórico — {{ historicoInsumo?.nome }}</h3>
          <button class="modal-close" @click="showModalHistorico = false"><i class="ti ti-x"></i></button>
        </div>

        <div v-if="movimentacoes.length === 0" class="empty-historico">
          <p>Nenhuma movimentação registrada ainda.</p>
        </div>

        <div v-else class="historico-list">
          <div v-for="m in movimentacoes" :key="m.id" class="historico-item">
            <div class="hist-icon" :class="m.tipo">
              <i :class="['ti', m.tipo === 'entrada' ? 'ti-arrow-down-circle' : 'ti-arrow-up-circle']"></i>
            </div>
            <div class="hist-info">
              <div class="hist-qtd" :class="m.tipo">
                {{ m.tipo === 'entrada' ? '+' : '-' }}{{ m.quantidade }} {{ historicoInsumo?.unidade }}
              </div>
              <div class="hist-motivo">{{ m.motivo || '—' }}</div>
            </div>
            <div class="hist-data">{{ formatarData(m.data) }}</div>
          </div>
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

/* Resumo */
.resumo-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 1rem; margin-bottom: 1.25rem; }
.resumo-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 1.25rem 1.5rem; display: flex; align-items: center; gap: 1rem; }
.resumo-card.alerta { border-color: #facc15; }
.resumo-card .ti { font-size: 28px; }
.resumo-card strong { display: block; font-family: var(--font-display); font-size: 1.4rem; font-weight: 800; }
.resumo-card span { font-size: 0.78rem; color: var(--text3); }

/* Filtros */
.filtros { display: flex; gap: 10px; margin-bottom: 1.5rem; flex-wrap: wrap; align-items: center; }
.select-filtro { background: var(--surface); border: 1px solid var(--border); color: var(--text); padding: 9px 14px; border-radius: 10px; font-size: 0.85rem; font-family: var(--font-body); outline: none; }
.toggle-baixo { background: var(--surface); border: 1px solid var(--border); color: var(--text3); padding: 9px 16px; border-radius: 10px; font-size: 0.82rem; cursor: pointer; font-family: var(--font-body); display: flex; align-items: center; gap: 6px; transition: all 0.2s; }
.toggle-baixo.active { border-color: #facc15; color: #facc15; background: #2a2200; }

.loading-state { display: flex; align-items: center; gap: 8px; color: var(--text3); padding: 3rem; justify-content: center; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 4rem 2rem; text-align: center; background: var(--surface); border: 2px dashed var(--border); border-radius: 20px; }
.empty-icon { width: 64px; height: 64px; background: var(--surface2); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 28px; color: var(--text3); }
.empty-state h3 { font-family: var(--font-display); font-size: 1.2rem; font-weight: 800; }
.empty-state p { color: var(--text3); font-size: 0.88rem; max-width: 380px; line-height: 1.6; }

/* Grid de insumos */
.insumos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px,1fr)); gap: 1.25rem; }
.insumo-card { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: 1.5rem; transition: border-color 0.2s; }
.insumo-card.baixo { border-color: #facc15; }
.insumo-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.insumo-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
.badge-baixo { font-size: 0.68rem; background: #2a2200; color: #facc15; padding: 3px 8px; border-radius: 10px; display: flex; align-items: center; gap: 3px; }
.insumo-nome { font-family: var(--font-display); font-size: 1rem; font-weight: 800; margin-bottom: 4px; }
.insumo-tag { display: inline-block; background: var(--surface2); color: var(--text2); font-size: 0.72rem; padding: 3px 10px; border-radius: 8px; margin-bottom: 1rem; }
.insumo-quantidade { font-family: var(--font-display); font-size: 1.8rem; font-weight: 800; }
.insumo-quantidade span { font-size: 0.9rem; color: var(--text3); font-family: var(--font-body); font-weight: 400; }
.insumo-minimo { font-size: 0.75rem; color: var(--text3); margin-bottom: 1rem; }
.insumo-meta { display: flex; flex-direction: column; gap: 5px; margin-bottom: 1.25rem; }
.meta-row { display: flex; align-items: center; gap: 6px; font-size: 0.78rem; color: var(--text3); }
.insumo-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 8px; }
.btn-mov { padding: 8px; border-radius: 10px; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; font-family: var(--font-body); border: 1px solid; transition: all 0.2s; }
.btn-mov.entrada { border-color: var(--green); color: var(--green); background: transparent; }
.btn-mov.entrada:hover { background: #0f2e17; }
.btn-mov.saida { border-color: var(--red); color: var(--red); background: transparent; }
.btn-mov.saida:hover { background: #2e0f0f; }
.insumo-actions-2 { display: flex; justify-content: flex-end; gap: 4px; }
.icon-btn { background: none; border: none; color: var(--text3); cursor: pointer; font-size: 16px; padding: 5px 7px; border-radius: 8px; transition: all 0.2s; }
.icon-btn:hover { background: var(--surface2); color: var(--text); }
.icon-btn.danger:hover { color: var(--red); background: #1a0a0a; }

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
.modal-actions { display: flex; gap: 10px; margin-top: 1.5rem; }
.btn-outline-lg { flex: 1; background: transparent; border: 1px solid var(--border); color: var(--text2); padding: 11px; border-radius: 10px; font-size: 0.9rem; cursor: pointer; font-family: var(--font-body); }
.btn-primary-lg { flex: 1; background: var(--green); color: #0a0f0d; border: none; padding: 11px; border-radius: 10px; font-size: 0.9rem; font-weight: 700; cursor: pointer; font-family: var(--font-body); display: flex; align-items: center; justify-content: center; gap: 6px; }
.btn-primary-lg:disabled { opacity: 0.6; cursor: not-allowed; }

/* Modal movimentação */
.mov-info { background: var(--surface2); border-radius: 12px; padding: 12px 16px; margin-bottom: 1.25rem; display: flex; flex-direction: column; gap: 2px; }
.mov-info strong { font-size: 0.95rem; }
.mov-info span { font-size: 0.8rem; color: var(--text3); }
.tipo-toggle { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 1.25rem; }
.tipo-btn { background: var(--surface2); border: 1.5px solid var(--border); color: var(--text2); padding: 12px; border-radius: 12px; cursor: pointer; font-family: var(--font-body); font-size: 0.9rem; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s; }
.tipo-btn.entrada.active { border-color: var(--green); color: var(--green); background: #0f2e17; }
.tipo-btn.saida.active { border-color: var(--red); color: var(--red); background: #2e0f0f; }

/* Histórico */
.empty-historico { text-align: center; padding: 2rem; color: var(--text3); }
.historico-list { display: flex; flex-direction: column; gap: 8px; max-height: 400px; overflow-y: auto; }
.historico-item { display: flex; align-items: center; gap: 10px; background: var(--surface2); border-radius: 12px; padding: 10px 14px; }
.hist-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
.hist-icon.entrada { background: #0f2e17; color: var(--green); }
.hist-icon.saida { background: #2e0f0f; color: var(--red); }
.hist-info { flex: 1; min-width: 0; }
.hist-qtd { font-weight: 600; font-size: 0.88rem; }
.hist-qtd.entrada { color: var(--green); }
.hist-qtd.saida { color: var(--red); }
.hist-motivo { font-size: 0.78rem; color: var(--text3); }
.hist-data { font-size: 0.72rem; color: var(--muted); white-space: nowrap; }

.spin { animation: spin 1s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .page { padding: 1rem; }
  .resumo-grid { grid-template-columns: 1fr; }
  .insumos-grid { grid-template-columns: 1fr; }
  .field-row { grid-template-columns: 1fr; }
  .filtros { flex-direction: column; align-items: stretch; }
}
</style>
