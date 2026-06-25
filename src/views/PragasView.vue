<script setup lang="ts">
/**
 * PragasView.vue — Manejo de Pragas e Doenças com Diagnóstico por IA
 *
 * Funcionalidades:
 *  - Registrar ocorrência com descrição detalhada dos sintomas
 *  - Diagnóstico automático via IA (Groq/Llama)
 *  - Sugestão de defensivos e manejo integrado
 *  - Upload de foto da área afetada (Cloudinary)
 *  - Acompanhar histórico e status de cada ocorrência
 *  - Filtros por urgência, status e fazenda
 */

import { ref, computed, onMounted } from 'vue'
import { useApi } from '../composables/useApi'
import { useThemeStore } from '../stores/theme'

// ─── Stores e composables ────────────────────────────────────────────────────
const { get, post, put, del } = useApi()
const theme = useThemeStore()

// ─── Estado ──────────────────────────────────────────────────────────────────
const ocorrencias  = ref<any[]>([])
const fazendas     = ref<any[]>([])
const carregando   = ref(true)
const salvando     = ref(false)
const diagnosticando = ref(false)
const erro         = ref('')

// Modais
const modalNova    = ref(false)
const modalDetalhe = ref<any>(null)

// Filtros
const filtroFazenda  = ref('')
const filtroStatus   = ref('')
const filtroUrgencia = ref('')

// Formulário de nova ocorrência
const form = ref({
  fazendaId:     0,
  cultura:       '',
  tipoProblema:  'praga' as 'praga' | 'doenca' | 'deficiencia' | 'outro',
  descricao:     '',
  areaAfetadaHa: '',
  urgencia:      'media' as 'baixa' | 'media' | 'alta' | 'critica',
  fotoUrl:       '',
})

// Upload de foto
const uploadandoFoto = ref(false)

// ─── Computed ────────────────────────────────────────────────────────────────
const ocorrenciasFiltradas = computed(() => {
  return ocorrencias.value.filter(o => {
    if (filtroFazenda.value  && String(o.fazendaId) !== filtroFazenda.value)  return false
    if (filtroStatus.value   && o.status    !== filtroStatus.value)            return false
    if (filtroUrgencia.value && o.urgencia  !== filtroUrgencia.value)          return false
    return true
  })
})

const totalCriticos = computed(() =>
  ocorrencias.value.filter(o => o.urgencia === 'critica' && o.status !== 'resolvida').length
)
const totalAbertas = computed(() =>
  ocorrencias.value.filter(o => o.status === 'aberta').length
)
const totalResolvidas = computed(() =>
  ocorrencias.value.filter(o => o.status === 'resolvida').length
)

// ─── Lifecycle ───────────────────────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([carregarOcorrencias(), carregarFazendas()])
  carregando.value = false
})

// ─── Funções de dados ────────────────────────────────────────────────────────
async function carregarOcorrencias() {
  try {
    ocorrencias.value = await get('/pragas') || []
  } catch {
    erro.value = 'Erro ao carregar ocorrências.'
  }
}

async function carregarFazendas() {
  try {
    fazendas.value = await get('/fazendas') || []
  } catch {}
}

// ─── Upload de foto via Cloudinary ───────────────────────────────────────────
async function uploadFoto(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return

  uploadandoFoto.value = true
  const file = input.files[0]
  const data = new FormData()
  data.append('file',   file)
  data.append('upload_preset', 'sightagro_documentos') // mesmo preset dos documentos
  data.append('folder', 'sightagro/pragas')

  try {
    const res  = await fetch('https://api.cloudinary.com/v1_1/dkrpjfanu/image/upload', {
      method: 'POST',
      body: data,
    })
    const json = await res.json()
    form.value.fotoUrl = json.secure_url
  } catch {
    erro.value = 'Erro ao fazer upload da foto.'
  } finally {
    uploadandoFoto.value = false
  }
}

// ─── Criar nova ocorrência ───────────────────────────────────────────────────
async function criarOcorrencia() {
  if (!form.value.fazendaId || !form.value.cultura || !form.value.descricao) {
    erro.value = 'Preencha fazenda, cultura e descrição dos sintomas.'
    return
  }
  if (form.value.descricao.length < 10) {
    erro.value = 'Descreva os sintomas com pelo menos 10 caracteres para um diagnóstico preciso.'
    return
  }

  salvando.value = true
  diagnosticando.value = true
  erro.value = ''

  try {
    const payload: any = {
      fazendaId:    Number(form.value.fazendaId),
      cultura:      form.value.cultura,
      tipoProblema: form.value.tipoProblema,
      descricao:    form.value.descricao,
      urgencia:     form.value.urgencia,
    }
    if (form.value.areaAfetadaHa) payload.areaAfetadaHa = Number(form.value.areaAfetadaHa)
    if (form.value.fotoUrl)       payload.fotoUrl        = form.value.fotoUrl

    const nova = await post('/pragas', payload)
    ocorrencias.value.unshift(nova)

    // Abre o detalhe para o produtor ver o diagnóstico
    modalDetalhe.value = nova
    fecharModalNova()
  } catch (e: any) {
    erro.value = e?.message || 'Erro ao registrar ocorrência.'
  } finally {
    salvando.value     = false
    diagnosticando.value = false
  }
}

function fecharModalNova() {
  modalNova.value = false
  form.value = {
    fazendaId: 0, cultura: '', tipoProblema: 'praga',
    descricao: '', areaAfetadaHa: '', urgencia: 'media', fotoUrl: '',
  }
  erro.value = ''
}

// ─── Atualizar status ────────────────────────────────────────────────────────
async function atualizarStatus(id: number, status: string) {
  try {
    const atualizado = await put(`/pragas/${id}`, { status })
    const idx = ocorrencias.value.findIndex(o => o.id === id)
    if (idx !== -1) ocorrencias.value[idx] = { ...ocorrencias.value[idx], ...atualizado }
    if (modalDetalhe.value?.id === id) modalDetalhe.value = { ...modalDetalhe.value, status }
  } catch {
    erro.value = 'Erro ao atualizar status.'
  }
}

// ─── Re-executar diagnóstico ─────────────────────────────────────────────────
async function rediagnosticar(id: number) {
  diagnosticando.value = true
  try {
    const atualizado = await post(`/pragas/${id}/diagnostico`, {})
    const idx = ocorrencias.value.findIndex(o => o.id === id)
    if (idx !== -1) ocorrencias.value[idx] = atualizado
    if (modalDetalhe.value?.id === id)    modalDetalhe.value = atualizado
  } catch {
    erro.value = 'Erro ao re-executar diagnóstico.'
  } finally {
    diagnosticando.value = false
  }
}

// ─── Excluir ─────────────────────────────────────────────────────────────────
async function excluir(id: number) {
  if (!confirm('Remover esta ocorrência?')) return
  try {
    await del(`/pragas/${id}`)
    ocorrencias.value = ocorrencias.value.filter(o => o.id !== id)
    if (modalDetalhe.value?.id === id) modalDetalhe.value = null
  } catch {
    erro.value = 'Erro ao excluir.'
  }
}

// ─── Helpers de formatação ───────────────────────────────────────────────────
function urgenciaCor(u: string) {
  return {
    baixa:   'text-green-400  bg-green-400/10  border-green-400/30',
    media:   'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
    alta:    'text-orange-400 bg-orange-400/10 border-orange-400/30',
    critica: 'text-red-400    bg-red-400/10    border-red-400/30',
  }[u] || ''
}

function statusCor(s: string) {
  return {
    aberta:         'text-red-400    bg-red-400/10',
    em_tratamento:  'text-yellow-400 bg-yellow-400/10',
    monitorando:    'text-blue-400   bg-blue-400/10',
    resolvida:      'text-green-400  bg-green-400/10',
  }[s] || ''
}

function tipoBadge(t: string) {
  return { praga: '🐛', doenca: '🦠', deficiencia: '🌿', outro: '❓' }[t] || '❓'
}

function defensivosArray(json: string | null): string[] {
  if (!json) return []
  try { return JSON.parse(json) } catch { return [] }
}

function formatarData(d: string) {
  return new Date(d).toLocaleDateString('pt-BR')
}
</script>

<template>
  <div :class="['min-h-screen p-4 md:p-6', theme.isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900']">

    <!-- ── Cabeçalho ─────────────────────────────────────────────────────── -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold">🐛 Manejo de Pragas</h1>
        <p :class="['text-sm mt-1', theme.isDark ? 'text-gray-400' : 'text-gray-500']">
          Diagnóstico automático por IA e sugestão de defensivos
        </p>
      </div>
      <button
        @click="modalNova = true"
        class="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
      >
        <span class="text-lg">+</span> Nova Ocorrência
      </button>
    </div>

    <!-- ── Cards de resumo ───────────────────────────────────────────────── -->
    <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
      <div :class="['rounded-xl p-4 border', theme.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200']">
        <p :class="['text-xs mb-1', theme.isDark ? 'text-gray-400' : 'text-gray-500']">Casos Críticos</p>
        <p class="text-2xl font-bold text-red-400">{{ totalCriticos }}</p>
      </div>
      <div :class="['rounded-xl p-4 border', theme.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200']">
        <p :class="['text-xs mb-1', theme.isDark ? 'text-gray-400' : 'text-gray-500']">Em Aberto</p>
        <p class="text-2xl font-bold text-orange-400">{{ totalAbertas }}</p>
      </div>
      <div :class="['rounded-xl p-4 border col-span-2 md:col-span-1', theme.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200']">
        <p :class="['text-xs mb-1', theme.isDark ? 'text-gray-400' : 'text-gray-500']">Resolvidas</p>
        <p class="text-2xl font-bold text-green-400">{{ totalResolvidas }}</p>
      </div>
    </div>

    <!-- ── Filtros ───────────────────────────────────────────────────────── -->
    <div :class="['flex flex-wrap gap-3 mb-6 p-4 rounded-xl border', theme.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200']">
      <select v-model="filtroFazenda" :class="['flex-1 min-w-[140px] rounded-lg px-3 py-2 text-sm border', theme.isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300']">
        <option value="">Todas as fazendas</option>
        <option v-for="f in fazendas" :key="f.id" :value="String(f.id)">{{ f.nome }}</option>
      </select>
      <select v-model="filtroUrgencia" :class="['flex-1 min-w-[130px] rounded-lg px-3 py-2 text-sm border', theme.isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300']">
        <option value="">Toda urgência</option>
        <option value="critica">🔴 Crítica</option>
        <option value="alta">🟠 Alta</option>
        <option value="media">🟡 Média</option>
        <option value="baixa">🟢 Baixa</option>
      </select>
      <select v-model="filtroStatus" :class="['flex-1 min-w-[130px] rounded-lg px-3 py-2 text-sm border', theme.isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300']">
        <option value="">Todo status</option>
        <option value="aberta">Aberta</option>
        <option value="em_tratamento">Em Tratamento</option>
        <option value="monitorando">Monitorando</option>
        <option value="resolvida">Resolvida</option>
      </select>
    </div>

    <!-- ── Erro global ───────────────────────────────────────────────────── -->
    <div v-if="erro" class="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
      {{ erro }}
    </div>

    <!-- ── Loading ───────────────────────────────────────────────────────── -->
    <div v-if="carregando" class="text-center py-16 text-gray-400">
      <div class="animate-spin text-4xl mb-3">⚙️</div>
      <p>Carregando ocorrências…</p>
    </div>

    <!-- ── Estado vazio ──────────────────────────────────────────────────── -->
    <div
      v-else-if="!ocorrenciasFiltradas.length"
      :class="['text-center py-16 rounded-xl border', theme.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200']"
    >
      <div class="text-5xl mb-4">🌱</div>
      <p class="text-lg font-medium mb-1">Nenhuma ocorrência registrada</p>
      <p :class="['text-sm mb-6', theme.isDark ? 'text-gray-400' : 'text-gray-500']">
        Registre uma praga ou doença e receba diagnóstico automático por IA
      </p>
      <button
        @click="modalNova = true"
        class="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
      >
        Registrar Primeira Ocorrência
      </button>
    </div>

    <!-- ── Lista de ocorrências ──────────────────────────────────────────── -->
    <div v-else class="space-y-4">
      <div
        v-for="o in ocorrenciasFiltradas"
        :key="o.id"
        :class="['rounded-xl border p-4 cursor-pointer hover:border-green-500/50 transition-all', theme.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200']"
        @click="modalDetalhe = o"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <!-- Info principal -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap mb-1">
              <span class="text-lg">{{ tipoBadge(o.tipoProblema) }}</span>
              <span class="font-semibold">{{ o.cultura }}</span>
              <span :class="['text-xs px-2 py-0.5 rounded-full border font-medium', urgenciaCor(o.urgencia)]">
                {{ o.urgencia.toUpperCase() }}
              </span>
              <span :class="['text-xs px-2 py-0.5 rounded-full font-medium', statusCor(o.status)]">
                {{ o.status.replace('_', ' ') }}
              </span>
            </div>
            <p class="text-sm text-gray-400 mb-1">📍 {{ o.fazenda?.nome }}</p>
            <p :class="['text-sm line-clamp-2', theme.isDark ? 'text-gray-300' : 'text-gray-600']">
              {{ o.descricao }}
            </p>
          </div>

          <!-- Diagnóstico resumido -->
          <div v-if="o.diagnosticoIA" class="bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 text-sm max-w-[220px]">
            <p class="text-green-400 font-medium text-xs mb-0.5">🤖 IA identificou:</p>
            <p :class="theme.isDark ? 'text-gray-200' : 'text-gray-700'">{{ o.diagnosticoIA }}</p>
          </div>
        </div>

        <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-700/50">
          <span class="text-xs text-gray-500">{{ formatarData(o.createdAt) }}</span>
          <div class="flex gap-2" @click.stop>
            <select
              :value="o.status"
              @change="atualizarStatus(o.id, ($event.target as HTMLSelectElement).value)"
              :class="['text-xs rounded-lg px-2 py-1 border', theme.isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300']"
            >
              <option value="aberta">Aberta</option>
              <option value="em_tratamento">Em Tratamento</option>
              <option value="monitorando">Monitorando</option>
              <option value="resolvida">Resolvida</option>
            </select>
            <button
              @click="excluir(o.id)"
              class="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded border border-red-400/30 hover:bg-red-400/10 transition-colors"
            >
              Excluir
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ════════════════════════════════════════════════════════════════════ -->
    <!-- Modal — Nova Ocorrência                                             -->
    <!-- ════════════════════════════════════════════════════════════════════ -->
    <div v-if="modalNova" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div :class="['w-full max-w-lg rounded-2xl border shadow-2xl overflow-y-auto max-h-[90vh]', theme.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200']">

        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-700/50">
          <div>
            <h2 class="text-lg font-bold">🐛 Nova Ocorrência</h2>
            <p class="text-sm text-gray-400 mt-0.5">A IA analisará os sintomas automaticamente</p>
          </div>
          <button @click="fecharModalNova" class="text-gray-400 hover:text-white text-2xl leading-none">×</button>
        </div>

        <div class="p-6 space-y-4">

          <!-- Erro no modal -->
          <div v-if="erro" class="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {{ erro }}
          </div>

          <!-- Fazenda -->
          <div>
            <label class="block text-sm font-medium mb-1">Fazenda *</label>
            <select
              v-model="form.fazendaId"
              :class="['w-full rounded-lg px-3 py-2 border', theme.isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300']"
            >
              <option :value="0" disabled>Selecione a fazenda</option>
              <option v-for="f in fazendas" :key="f.id" :value="f.id">{{ f.nome }}</option>
            </select>
          </div>

          <!-- Cultura e Tipo -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium mb-1">Cultura *</label>
              <input
                v-model="form.cultura"
                placeholder="Ex: Soja, Milho, Pastagem"
                :class="['w-full rounded-lg px-3 py-2 border', theme.isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300']"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Tipo de Problema</label>
              <select
                v-model="form.tipoProblema"
                :class="['w-full rounded-lg px-3 py-2 border', theme.isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300']"
              >
                <option value="praga">🐛 Praga</option>
                <option value="doenca">🦠 Doença</option>
                <option value="deficiencia">🌿 Deficiência</option>
                <option value="outro">❓ Outro</option>
              </select>
            </div>
          </div>

          <!-- Urgência e Área -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium mb-1">Urgência</label>
              <select
                v-model="form.urgencia"
                :class="['w-full rounded-lg px-3 py-2 border', theme.isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300']"
              >
                <option value="baixa">🟢 Baixa</option>
                <option value="media">🟡 Média</option>
                <option value="alta">🟠 Alta</option>
                <option value="critica">🔴 Crítica</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Área Afetada (ha)</label>
              <input
                v-model="form.areaAfetadaHa"
                type="number"
                step="0.1"
                placeholder="Ex: 5.5"
                :class="['w-full rounded-lg px-3 py-2 border', theme.isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300']"
              />
            </div>
          </div>

          <!-- Descrição dos sintomas -->
          <div>
            <label class="block text-sm font-medium mb-1">Descrição dos Sintomas * <span class="text-gray-400 font-normal">(quanto mais detalhado, melhor o diagnóstico)</span></label>
            <textarea
              v-model="form.descricao"
              rows="4"
              placeholder="Ex: Folhas com manchas amareladas nas bordas, caule apresenta lesões marrons, plantas murchando no período da tarde apesar de irrigação regular..."
              :class="['w-full rounded-lg px-3 py-2 border resize-none', theme.isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300']"
            />
            <p class="text-xs text-gray-500 mt-1">{{ form.descricao.length }}/2000 caracteres</p>
          </div>

          <!-- Upload de foto -->
          <div>
            <label class="block text-sm font-medium mb-1">Foto da Área Afetada <span class="text-gray-400 font-normal">(opcional)</span></label>
            <div v-if="form.fotoUrl" class="mb-2">
              <img :src="form.fotoUrl" class="w-full h-32 object-cover rounded-lg" />
              <button @click="form.fotoUrl = ''" class="text-xs text-red-400 mt-1">Remover foto</button>
            </div>
            <label
              v-else
              :class="['flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-4 cursor-pointer transition-colors', theme.isDark ? 'border-gray-600 hover:border-green-500' : 'border-gray-300 hover:border-green-500']"
            >
              <span v-if="uploadandoFoto" class="animate-spin">⚙️</span>
              <span v-else>📷 Clique para enviar foto</span>
              <input type="file" accept="image/*" class="hidden" @change="uploadFoto" />
            </label>
          </div>

          <!-- Aviso IA -->
          <div class="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <span class="text-xl">🤖</span>
            <div class="text-sm">
              <p class="text-green-400 font-medium">Diagnóstico automático por IA</p>
              <p :class="theme.isDark ? 'text-gray-300' : 'text-gray-600'">
                Ao registrar, a IA irá analisar os sintomas e sugerir o diagnóstico, defensivos recomendados e manejo integrado. Pode levar alguns segundos.
              </p>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="flex gap-3 p-6 pt-0">
          <button
            @click="fecharModalNova"
            :class="['flex-1 py-2 rounded-lg border font-medium', theme.isDark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50']"
          >
            Cancelar
          </button>
          <button
            @click="criarOcorrencia"
            :disabled="salvando"
            class="flex-1 py-2 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <span v-if="salvando" class="animate-spin">⚙️</span>
            <span>{{ salvando ? 'Analisando com IA…' : 'Registrar e Diagnosticar' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ════════════════════════════════════════════════════════════════════ -->
    <!-- Modal — Detalhe / Diagnóstico da IA                                -->
    <!-- ════════════════════════════════════════════════════════════════════ -->
    <div v-if="modalDetalhe" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div :class="['w-full max-w-2xl rounded-2xl border shadow-2xl overflow-y-auto max-h-[90vh]', theme.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200']">

        <!-- Header -->
        <div class="flex items-start justify-between p-6 border-b border-gray-700/50">
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-2xl">{{ tipoBadge(modalDetalhe.tipoProblema) }}</span>
              <h2 class="text-lg font-bold">{{ modalDetalhe.cultura }}</h2>
              <span :class="['text-xs px-2 py-0.5 rounded-full border font-medium', urgenciaCor(modalDetalhe.urgencia)]">
                {{ modalDetalhe.urgencia.toUpperCase() }}
              </span>
            </div>
            <p class="text-sm text-gray-400 mt-1">📍 {{ modalDetalhe.fazenda?.nome }} · {{ formatarData(modalDetalhe.createdAt) }}</p>
          </div>
          <button @click="modalDetalhe = null" class="text-gray-400 hover:text-white text-2xl leading-none ml-4">×</button>
        </div>

        <div class="p-6 space-y-5">

          <!-- Sintomas -->
          <div>
            <h3 class="font-semibold text-sm text-gray-400 uppercase tracking-wider mb-2">Sintomas Relatados</h3>
            <p :class="['text-sm leading-relaxed', theme.isDark ? 'text-gray-200' : 'text-gray-700']">{{ modalDetalhe.descricao }}</p>
            <p v-if="modalDetalhe.areaAfetadaHa" class="text-sm text-orange-400 mt-1">⚠️ Área afetada: {{ modalDetalhe.areaAfetadaHa }} ha</p>
          </div>

          <!-- Foto -->
          <div v-if="modalDetalhe.fotoUrl">
            <h3 class="font-semibold text-sm text-gray-400 uppercase tracking-wider mb-2">Foto</h3>
            <img :src="modalDetalhe.fotoUrl" class="w-full max-h-48 object-cover rounded-xl" />
          </div>

          <!-- Diagnóstico IA -->
          <div class="rounded-xl border border-green-500/30 bg-green-500/5 p-4">
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-semibold flex items-center gap-2">
                🤖 <span>Diagnóstico por IA</span>
              </h3>
              <button
                @click="rediagnosticar(modalDetalhe.id)"
                :disabled="diagnosticando"
                class="text-xs text-green-400 hover:text-green-300 border border-green-500/30 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
              >
                <span v-if="diagnosticando" class="animate-spin inline-block">⚙️</span>
                <span v-else>↺ Re-analisar</span>
              </button>
            </div>

            <div v-if="modalDetalhe.diagnosticoIA">
              <!-- Diagnóstico -->
              <div class="mb-3">
                <p class="text-xs text-gray-400 mb-0.5">Problema Identificado</p>
                <p class="font-bold text-green-400 text-lg">{{ modalDetalhe.diagnosticoIA }}</p>
              </div>

              <!-- Defensivos -->
              <div v-if="defensivosArray(modalDetalhe.defensivosIA).length" class="mb-3">
                <p class="text-xs text-gray-400 mb-1">Defensivos Recomendados</p>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="d in defensivosArray(modalDetalhe.defensivosIA)"
                    :key="d"
                    class="text-sm bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg px-2 py-1"
                  >
                    💊 {{ d }}
                  </span>
                </div>
              </div>

              <!-- Manejo -->
              <div v-if="modalDetalhe.manejoIA" class="mb-3">
                <p class="text-xs text-gray-400 mb-1">Orientações de Manejo</p>
                <p :class="['text-sm leading-relaxed whitespace-pre-line', theme.isDark ? 'text-gray-200' : 'text-gray-700']">{{ modalDetalhe.manejoIA }}</p>
              </div>

              <!-- Prevenção -->
              <div v-if="modalDetalhe.prevencaoIA">
                <p class="text-xs text-gray-400 mb-1">Prevenção para o Próximo Ciclo</p>
                <p :class="['text-sm leading-relaxed whitespace-pre-line', theme.isDark ? 'text-gray-300' : 'text-gray-600']">{{ modalDetalhe.prevencaoIA }}</p>
              </div>
            </div>

            <p v-else class="text-sm text-gray-400 italic">Diagnóstico ainda não gerado. Clique em "Re-analisar" para executar.</p>
          </div>

          <!-- Status e Acompanhamento -->
          <div>
            <h3 class="font-semibold text-sm text-gray-400 uppercase tracking-wider mb-2">Status do Tratamento</h3>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                v-for="s in ['aberta', 'em_tratamento', 'monitorando', 'resolvida']"
                :key="s"
                @click="atualizarStatus(modalDetalhe.id, s)"
                :class="['py-2 rounded-lg text-sm font-medium border transition-all', modalDetalhe.status === s ? statusCor(s) + ' border-current' : theme.isDark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50']"
              >
                {{ s.replace('_', ' ') }}
              </button>
            </div>
          </div>

          <!-- Defensivo aplicado -->
          <div v-if="modalDetalhe.defensivoAplicado">
            <h3 class="font-semibold text-sm text-gray-400 uppercase tracking-wider mb-1">Defensivo Aplicado</h3>
            <p class="text-sm">{{ modalDetalhe.defensivoAplicado }}</p>
          </div>

        </div>

        <!-- Footer -->
        <div class="flex gap-3 p-6 pt-0">
          <button
            @click="excluir(modalDetalhe.id)"
            class="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm transition-colors"
          >
            Excluir
          </button>
          <button
            @click="modalDetalhe = null"
            class="flex-1 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
