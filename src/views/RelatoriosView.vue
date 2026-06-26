<script setup lang="ts">
/**
 * RelatoriosView.vue — Geração e Exportação de Relatórios
 *
 * Funcionalidades:
 *  - Selecionar fazenda, tipo e período
 *  - Preview com dados reais em tempo real (sem salvar)
 *  - Gerar e salvar relatório no banco
 *  - Exportar CSV (download direto)
 *  - Gerar PDF profissional via jsPDF (biblioteca CDN)
 *  - Histórico de relatórios gerados com re-download
 *  - Excluir relatórios
 */

import { ref, computed, onMounted } from 'vue'
import { useApi } from '../composables/useApi'
import { useThemeStore } from '../stores/theme'

const { get, post, del } = useApi()
const theme = useThemeStore()

// ─── Estado ──────────────────────────────────────────────────────────────────
const fazendas      = ref<any[]>([])
const relatorios    = ref<any[]>([])
const carregando    = ref(true)
const gerando       = ref(false)
const carregandoPreview = ref(false)
const erro          = ref('')

// Formulário de geração
const form = ref({
  fazendaId:  0,
  tipo:       'consolidado' as string,
  dataInicio: dataInicioDefault(),
  dataFim:    new Date().toISOString().split('T')[0],
  titulo:     '',
})

// Dados do preview carregado
const preview       = ref<any>(null)
const abaSelecionada = ref<'novo' | 'historico'>('novo')
const secaoPreview  = ref<'resumo' | 'financeiro' | 'alertas' | 'sensores' | 'pragas'>('resumo')

// ─── Helpers de data ─────────────────────────────────────────────────────────
function dataInicioDefault() {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().split('T')[0]
}

// ─── Computed ────────────────────────────────────────────────────────────────
const diasPeriodo = computed(() => {
  if (!form.value.dataInicio || !form.value.dataFim) return 0
  const diff = new Date(form.value.dataFim).getTime() - new Date(form.value.dataInicio).getTime()
  return Math.round(diff / (1000 * 60 * 60 * 24))
})

const fazendaSelecionada = computed(() =>
  fazendas.value.find(f => f.id === Number(form.value.fazendaId))
)

// ─── Lifecycle ───────────────────────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([carregarFazendas(), carregarRelatorios()])
  carregando.value = false
})

// ─── Funções de dados ────────────────────────────────────────────────────────
async function carregarFazendas() {
  try {
    fazendas.value = await get('/fazendas') || []
    if (fazendas.value.length) form.value.fazendaId = fazendas.value[0].id
  } catch { erro.value = 'Erro ao carregar fazendas.' }
}

async function carregarRelatorios() {
  try {
    relatorios.value = await get('/relatorios') || []
  } catch {}
}

// ─── Preview em tempo real ────────────────────────────────────────────────────
async function carregarPreview() {
  if (!form.value.fazendaId) return
  carregandoPreview.value = true
  erro.value = ''
  try {
    preview.value = await get(`/relatorios/preview/${form.value.fazendaId}?dias=${diasPeriodo.value || 30}`)
  } catch {
    erro.value = 'Erro ao carregar dados de preview.'
  } finally {
    carregandoPreview.value = false
  }
}

// ─── Gerar e salvar relatório ─────────────────────────────────────────────────
async function gerarRelatorio() {
  if (!form.value.fazendaId) {
    erro.value = 'Selecione uma fazenda.'
    return
  }
  gerando.value = true
  erro.value = ''
  try {
    const novo = await post('/relatorios/gerar', {
      fazendaId:  Number(form.value.fazendaId),
      tipo:       form.value.tipo,
      dataInicio: new Date(form.value.dataInicio).toISOString(),
      dataFim:    new Date(form.value.dataFim + 'T23:59:59').toISOString(),
      titulo:     form.value.titulo || undefined,
    })
    relatorios.value.unshift(novo)
    abaSelecionada.value = 'historico'
    // Baixa CSV automaticamente após gerar
    await baixarCSV(novo.id, novo.titulo)
  } catch {
    erro.value = 'Erro ao gerar relatório.'
  } finally {
    gerando.value = false
  }
}

// ─── Download CSV via URL do backend ─────────────────────────────────────────
async function baixarCSV(id: number, titulo: string) {
  try {
    const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333'
    const token    = localStorage.getItem('token')
    const resp = await fetch(`${BASE_URL}/relatorios/${id}/csv`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const blob = await resp.blob()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `sightagro-${titulo.replace(/\s+/g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    erro.value = 'Erro ao baixar CSV.'
  }
}

// ─── Gerar PDF no frontend com jsPDF ─────────────────────────────────────────
async function gerarPDF(relatorioId?: number) {
  // Busca dados: ou do relatório salvo, ou do preview atual
  let dados: any = null

  if (relatorioId) {
    try {
      const resp = await get(`/relatorios/${relatorioId}/dados`)
      dados = resp.dados
    } catch { erro.value = 'Erro ao carregar dados.'; return }
  } else if (preview.value) {
    dados = preview.value
  } else {
    await carregarPreview()
    dados = preview.value
  }

  if (!dados) return

  // @ts-ignore — jsPDF carregado via CDN
  if (typeof window.jspdf === 'undefined') {
    erro.value = 'jsPDF não carregado. Verifique o index.html.'
    return
  }

  // @ts-ignore
  const { jsPDF } = window.jspdf
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const Verde  = [34, 197, 94]   as [number, number, number]
  const Cinza  = [107, 114, 128] as [number, number, number]
  const Preto  = [17, 24, 39]    as [number, number, number]
  const Branco = [255, 255, 255] as [number, number, number]

  let y = 20 // cursor vertical

  // ── Cabeçalho ──────────────────────────────────────────────────────────────
  doc.setFillColor(...Verde)
  doc.rect(0, 0, 210, 40, 'F')

  doc.setTextColor(...Branco)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('🌿 SightAgro', 15, 18)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('Gestão Rural Inteligente — Relatório Gerado Automaticamente', 15, 27)

  doc.setFontSize(9)
  doc.text(`Emitido em: ${new Date().toLocaleString('pt-BR')}`, 15, 35)

  y = 50

  // ── Info da fazenda ────────────────────────────────────────────────────────
  doc.setTextColor(...Preto)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(dados.fazenda?.nome || 'Fazenda', 15, y)
  y += 6

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...Cinza)
  doc.text(`Proprietário: ${dados.fazenda?.user?.nome || '—'}`, 15, y)
  y += 5
  doc.text(
    `Período: ${new Date(dados.periodo?.inicio).toLocaleDateString('pt-BR')} a ${new Date(dados.periodo?.fim).toLocaleDateString('pt-BR')}`,
    15, y
  )
  y += 10

  // ── Linha divisória ────────────────────────────────────────────────────────
  doc.setDrawColor(...Verde)
  doc.setLineWidth(0.5)
  doc.line(15, y, 195, y)
  y += 8

  // ── Seção: Resumo Executivo ────────────────────────────────────────────────
  doc.setTextColor(...Verde)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Resumo Executivo', 15, y)
  y += 7

  const resumo = dados.resumo || {}
  const kpis = [
    ['Total de Alertas',     String(resumo.totalAlertas   ?? 0)],
    ['Alertas Críticos',     String(resumo.alertasCriticos ?? 0)],
    ['Taxa de Resolução',    `${resumo.taxaResolucao ?? 0}%`],
    ['Sensores Ativos',      String(resumo.totalSensores  ?? 0)],
    ['Leituras no Período',  String(resumo.totalLeituras  ?? 0)],
    ['Ocorrências de Pragas', String(resumo.totalPragas   ?? 0)],
  ]

  // Grid 3x2 de KPI cards
  const colW = 58, rowH = 16
  kpis.forEach(([label, valor], i) => {
    const col = i % 3
    const row = Math.floor(i / 3)
    const x   = 15 + col * (colW + 3)
    const cy  = y + row * (rowH + 3)

    doc.setFillColor(248, 250, 252)
    doc.roundedRect(x, cy, colW, rowH, 2, 2, 'F')
    doc.setDrawColor(229, 231, 235)
    doc.roundedRect(x, cy, colW, rowH, 2, 2, 'S')

    doc.setTextColor(...Cinza)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(label, x + 3, cy + 5)

    doc.setTextColor(...Preto)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text(valor, x + 3, cy + 13)
  })
  y += 2 * (rowH + 3) + 8

  // ── Seção: Financeiro ──────────────────────────────────────────────────────
  if ((resumo.totalTransacoes ?? 0) > 0) {
    doc.setDrawColor(...Verde)
    doc.line(15, y, 195, y)
    y += 8

    doc.setTextColor(...Verde)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Resultado Financeiro', 15, y)
    y += 7

    const finCards = [
      { label: 'Receitas',  valor: `R$ ${(resumo.receitas  ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, cor: [34, 197, 94] as [number, number, number] },
      { label: 'Despesas',  valor: `R$ ${(resumo.despesas  ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, cor: [239, 68, 68] as [number, number, number] },
      { label: 'Saldo',     valor: `R$ ${(resumo.saldo     ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, cor: (resumo.saldo ?? 0) >= 0 ? [34, 197, 94] as [number, number, number] : [239, 68, 68] as [number, number, number] },
    ]
    finCards.forEach(({ label, valor, cor }, i) => {
      const x = 15 + i * 62
      doc.setFillColor(248, 250, 252)
      doc.roundedRect(x, y, 58, 16, 2, 2, 'F')
      doc.setTextColor(...Cinza)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.text(label, x + 3, y + 5)
      doc.setTextColor(...cor)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text(valor, x + 3, y + 13)
    })
    y += 22

    // Tabela de transações (últimas 10)
    if (dados.detalhes?.transacoes?.length) {
      doc.setTextColor(...Preto)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('Últimas Transações', 15, y)
      y += 5

      const headers = ['Data', 'Descrição', 'Tipo', 'Valor']
      const colsW   = [25, 90, 25, 35]
      let x = 15

      // Cabeçalho da tabela
      doc.setFillColor(...Verde)
      doc.rect(15, y, 180, 7, 'F')
      doc.setTextColor(...Branco)
      doc.setFontSize(8)
      headers.forEach((h, i) => {
        doc.text(h, x + 2, y + 5)
        x += colsW[i]
      })
      y += 7

      // Linhas da tabela (até 10)
      const transacoes = dados.detalhes.transacoes.slice(0, 10)
      transacoes.forEach((t: any, idx: number) => {
        if (y > 270) { doc.addPage(); y = 20 }
        doc.setFillColor(idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 250 : 255, idx % 2 === 0 ? 252 : 255)
        doc.rect(15, y, 180, 6, 'F')
        doc.setTextColor(...Preto)
        doc.setFontSize(7.5)
        doc.setFont('helvetica', 'normal')
        x = 15
        const row = [
          new Date(t.data).toLocaleDateString('pt-BR'),
          t.descricao.substring(0, 40),
          t.tipo,
          `R$ ${t.valor.toFixed(2)}`,
        ]
        row.forEach((cell, i) => {
          doc.text(cell, x + 2, y + 4.5)
          x += colsW[i]
        })
        y += 6
      })
      y += 5
    }
  }

  // ── Seção: Alertas ─────────────────────────────────────────────────────────
  if ((resumo.totalAlertas ?? 0) > 0 && dados.detalhes?.alertas?.length) {
    if (y > 230) { doc.addPage(); y = 20 }

    doc.setDrawColor(...Verde)
    doc.line(15, y, 195, y)
    y += 8

    doc.setTextColor(...Verde)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Alertas do Período', 15, y)
    y += 7

    const alertasRecentes = dados.detalhes.alertas.slice(0, 8)
    alertasRecentes.forEach((a: any) => {
      if (y > 270) { doc.addPage(); y = 20 }
      const corNivel = a.nivel === 'critico' ? [239, 68, 68] : a.nivel === 'alto' ? [249, 115, 22] : [234, 179, 8]
      doc.setFillColor(...corNivel as [number, number, number], 0.1)
      doc.setDrawColor(...corNivel as [number, number, number])
      doc.setLineWidth(0.3)
      doc.roundedRect(15, y, 180, 8, 1, 1, 'FD')
      doc.setTextColor(...corNivel as [number, number, number])
      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'bold')
      doc.text(`[${a.nivel.toUpperCase()}] ${a.titulo}`, 18, y + 5.5)
      doc.setTextColor(...Cinza)
      doc.setFont('helvetica', 'normal')
      doc.text(new Date(a.createdAt).toLocaleDateString('pt-BR'), 180, y + 5.5, { align: 'right' })
      y += 10
    })
    y += 3
  }

  // ── Rodapé ─────────────────────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFillColor(...Verde)
    doc.rect(0, 285, 210, 12, 'F')
    doc.setTextColor(...Branco)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text('SightAgro — Gestão Rural Inteligente | sightagro-hjln.vercel.app', 15, 292)
    doc.text(`Página ${i} / ${pageCount}`, 195, 292, { align: 'right' })
  }

  doc.save(`sightagro-relatorio-${dados.fazenda?.nome?.replace(/\s+/g, '-')}-${Date.now()}.pdf`)
}

// ─── Excluir relatório ────────────────────────────────────────────────────────
async function excluirRelatorio(id: number) {
  if (!confirm('Remover este relatório do histórico?')) return
  try {
    await del(`/relatorios/${id}`)
    relatorios.value = relatorios.value.filter(r => r.id !== id)
  } catch { erro.value = 'Erro ao excluir.' }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function tipoBadge(tipo: string) {
  const map: Record<string, string> = {
    consolidado: '📊', financeiro: '💰', alertas: '🔔',
    sensores: '📡', pragas: '🐛', estoque: '📦',
  }
  return map[tipo] || '📄'
}

function formatarMoeda(v: number) {
  return `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

function formatarData(d: string) {
  return new Date(d).toLocaleDateString('pt-BR')
}

function nivelCor(n: string) {
  return {
    critico: 'text-red-400 bg-red-400/10',
    alto:    'text-orange-400 bg-orange-400/10',
    medio:   'text-yellow-400 bg-yellow-400/10',
    info:    'text-blue-400 bg-blue-400/10',
  }[n] || 'text-gray-400 bg-gray-400/10'
}
</script>

<template>
  <div :class="['min-h-screen p-4 md:p-6', theme.isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900']">

    <!-- ── Cabeçalho ─────────────────────────────────────────────────────── -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold">📊 Relatórios</h1>
        <p :class="['text-sm mt-1', theme.isDark ? 'text-gray-400' : 'text-gray-500']">
          Gere, visualize e exporte relatórios completos da sua propriedade
        </p>
      </div>
      <!-- Abas -->
      <div :class="['flex rounded-lg border overflow-hidden', theme.isDark ? 'border-gray-700' : 'border-gray-200']">
        <button
          @click="abaSelecionada = 'novo'"
          :class="['px-4 py-2 text-sm font-medium transition-colors', abaSelecionada === 'novo' ? 'bg-green-600 text-white' : theme.isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50']"
        >
          + Novo Relatório
        </button>
        <button
          @click="abaSelecionada = 'historico'"
          :class="['px-4 py-2 text-sm font-medium transition-colors', abaSelecionada === 'historico' ? 'bg-green-600 text-white' : theme.isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50']"
        >
          📁 Histórico ({{ relatorios.length }})
        </button>
      </div>
    </div>

    <!-- ── Erro ──────────────────────────────────────────────────────────── -->
    <div v-if="erro" class="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
      {{ erro }}
    </div>

    <!-- ════════════════════════════════════════════════════════════════════ -->
    <!-- ABA: Novo Relatório                                                 -->
    <!-- ════════════════════════════════════════════════════════════════════ -->
    <div v-if="abaSelecionada === 'novo'" class="space-y-6">

      <!-- Formulário de configuração -->
      <div :class="['rounded-xl border p-5', theme.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200']">
        <h2 class="font-semibold mb-4">⚙️ Configurar Relatório</h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <!-- Fazenda -->
          <div>
            <label class="block text-sm font-medium mb-1">Fazenda *</label>
            <select
              v-model="form.fazendaId"
              :class="['w-full rounded-lg px-3 py-2 border', theme.isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300']"
            >
              <option :value="0" disabled>Selecione</option>
              <option v-for="f in fazendas" :key="f.id" :value="f.id">{{ f.nome }}</option>
            </select>
          </div>

          <!-- Tipo -->
          <div>
            <label class="block text-sm font-medium mb-1">Tipo de Relatório</label>
            <select
              v-model="form.tipo"
              :class="['w-full rounded-lg px-3 py-2 border', theme.isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300']"
            >
              <option value="consolidado">📊 Consolidado (tudo)</option>
              <option value="financeiro">💰 Financeiro</option>
              <option value="alertas">🔔 Alertas</option>
              <option value="sensores">📡 Sensores</option>
              <option value="pragas">🐛 Pragas e Doenças</option>
              <option value="estoque">📦 Estoque</option>
            </select>
          </div>

          <!-- Título personalizado -->
          <div>
            <label class="block text-sm font-medium mb-1">Título <span class="text-gray-400 font-normal">(opcional)</span></label>
            <input
              v-model="form.titulo"
              placeholder="Ex: Relatório Q1 2025"
              :class="['w-full rounded-lg px-3 py-2 border', theme.isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300']"
            />
          </div>

          <!-- Data início -->
          <div>
            <label class="block text-sm font-medium mb-1">Data Início</label>
            <input
              v-model="form.dataInicio"
              type="date"
              :class="['w-full rounded-lg px-3 py-2 border', theme.isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300']"
            />
          </div>

          <!-- Data fim -->
          <div>
            <label class="block text-sm font-medium mb-1">Data Fim</label>
            <input
              v-model="form.dataFim"
              type="date"
              :class="['w-full rounded-lg px-3 py-2 border', theme.isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300']"
            />
          </div>

          <!-- Info período -->
          <div class="flex items-end">
            <div :class="['w-full rounded-lg px-3 py-2 text-sm border', theme.isDark ? 'bg-gray-700/50 border-gray-700' : 'bg-gray-50 border-gray-200']">
              <p class="text-gray-400 text-xs">Período selecionado</p>
              <p class="font-semibold">{{ diasPeriodo }} dias</p>
            </div>
          </div>
        </div>

        <!-- Botões de ação -->
        <div class="flex flex-wrap gap-3 mt-5">
          <button
            @click="carregarPreview"
            :disabled="!form.fazendaId || carregandoPreview"
            :class="['flex items-center gap-2 px-4 py-2 rounded-lg border font-medium text-sm transition-colors disabled:opacity-50', theme.isDark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50']"
          >
            <span v-if="carregandoPreview" class="animate-spin">⚙️</span>
            <span v-else>👁️</span>
            Preview
          </button>

          <button
            @click="gerarRelatorio"
            :disabled="!form.fazendaId || gerando"
            class="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold text-sm transition-colors"
          >
            <span v-if="gerando" class="animate-spin">⚙️</span>
            <span v-else>💾</span>
            {{ gerando ? 'Gerando…' : 'Gerar e Baixar CSV' }}
          </button>

          <button
            v-if="preview"
            @click="gerarPDF()"
            class="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-colors"
          >
            📄 Gerar PDF
          </button>
        </div>
      </div>

      <!-- Preview dos dados -->
      <div v-if="carregandoPreview" class="text-center py-12 text-gray-400">
        <div class="animate-spin text-4xl mb-3">⚙️</div>
        <p>Carregando dados…</p>
      </div>

      <div v-else-if="preview" :class="['rounded-xl border', theme.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200']">

        <!-- Sub-abas do preview -->
        <div :class="['flex overflow-x-auto border-b', theme.isDark ? 'border-gray-700' : 'border-gray-200']">
          <button
            v-for="s in ['resumo', 'financeiro', 'alertas', 'sensores', 'pragas']"
            :key="s"
            @click="secaoPreview = s as any"
            :class="['px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors', secaoPreview === s ? 'border-green-500 text-green-400' : 'border-transparent text-gray-400 hover:text-gray-200']"
          >
            {{ { resumo: '📊 Resumo', financeiro: '💰 Financeiro', alertas: '🔔 Alertas', sensores: '📡 Sensores', pragas: '🐛 Pragas' }[s] }}
          </button>
        </div>

        <div class="p-5">

          <!-- RESUMO -->
          <div v-if="secaoPreview === 'resumo'">
            <h3 class="font-semibold mb-4">Resumo Executivo — {{ fazendaSelecionada?.nome }}</h3>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <div
                v-for="[label, valor, cor] in [
                  ['Total de Alertas',     preview.resumo.totalAlertas,    'text-orange-400'],
                  ['Alertas Críticos',     preview.resumo.alertasCriticos, 'text-red-400'],
                  ['Taxa Resolução',       preview.resumo.taxaResolucao + '%', 'text-green-400'],
                  ['Sensores Ativos',      preview.resumo.totalSensores,   'text-blue-400'],
                  ['Total Leituras',       preview.resumo.totalLeituras,   'text-purple-400'],
                  ['Ocorrências Pragas',   preview.resumo.totalPragas,     'text-yellow-400'],
                  ['Docs Vencidos',        preview.resumo.docsVencidos,    'text-red-400'],
                  ['Docs Vencendo',        preview.resumo.docsVencendo,    'text-orange-400'],
                ]"
                :key="label as string"
                :class="['rounded-xl p-4 border', theme.isDark ? 'bg-gray-700/50 border-gray-700' : 'bg-gray-50 border-gray-200']"
              >
                <p class="text-xs text-gray-400 mb-1">{{ label }}</p>
                <p :class="['text-2xl font-bold', cor]">{{ valor }}</p>
              </div>
            </div>
          </div>

          <!-- FINANCEIRO -->
          <div v-else-if="secaoPreview === 'financeiro'">
            <div class="grid grid-cols-3 gap-4 mb-5">
              <div class="rounded-xl p-4 bg-green-500/10 border border-green-500/20">
                <p class="text-xs text-gray-400 mb-1">Receitas</p>
                <p class="text-xl font-bold text-green-400">{{ formatarMoeda(preview.resumo.receitas) }}</p>
              </div>
              <div class="rounded-xl p-4 bg-red-500/10 border border-red-500/20">
                <p class="text-xs text-gray-400 mb-1">Despesas</p>
                <p class="text-xl font-bold text-red-400">{{ formatarMoeda(preview.resumo.despesas) }}</p>
              </div>
              <div :class="['rounded-xl p-4 border', preview.resumo.saldo >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20']">
                <p class="text-xs text-gray-400 mb-1">Saldo</p>
                <p :class="['text-xl font-bold', preview.resumo.saldo >= 0 ? 'text-green-400' : 'text-red-400']">{{ formatarMoeda(preview.resumo.saldo) }}</p>
              </div>
            </div>

            <div v-if="preview.detalhes?.transacoes?.length" class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr :class="theme.isDark ? 'bg-gray-700' : 'bg-gray-100'">
                    <th class="text-left px-3 py-2 rounded-tl-lg">Data</th>
                    <th class="text-left px-3 py-2">Descrição</th>
                    <th class="text-left px-3 py-2">Categoria</th>
                    <th class="text-right px-3 py-2 rounded-tr-lg">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="t in preview.detalhes.transacoes.slice(0, 20)"
                    :key="t.id"
                    :class="['border-t', theme.isDark ? 'border-gray-700' : 'border-gray-100']"
                  >
                    <td class="px-3 py-2 text-gray-400 text-xs whitespace-nowrap">{{ formatarData(t.data) }}</td>
                    <td class="px-3 py-2 max-w-[200px] truncate">{{ t.descricao }}</td>
                    <td class="px-3 py-2 text-gray-400 text-xs">{{ t.categoria }}</td>
                    <td :class="['px-3 py-2 text-right font-medium', t.tipo === 'receita' ? 'text-green-400' : 'text-red-400']">
                      {{ t.tipo === 'receita' ? '+' : '-' }} {{ formatarMoeda(t.valor) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-else class="text-gray-400 text-sm text-center py-6">Nenhuma transação no período.</p>
          </div>

          <!-- ALERTAS -->
          <div v-else-if="secaoPreview === 'alertas'">
            <div v-if="preview.detalhes?.alertas?.length" class="space-y-2">
              <div
                v-for="a in preview.detalhes.alertas.slice(0, 20)"
                :key="a.id"
                :class="['rounded-lg p-3 border border-gray-700/50', theme.isDark ? 'bg-gray-700/30' : 'bg-gray-50']"
              >
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <span :class="['text-xs px-2 py-0.5 rounded-full font-medium', nivelCor(a.nivel)]">{{ a.nivel }}</span>
                    <span class="text-sm font-medium">{{ a.titulo }}</span>
                  </div>
                  <span class="text-xs text-gray-500 whitespace-nowrap">{{ formatarData(a.createdAt) }}</span>
                </div>
              </div>
            </div>
            <p v-else class="text-gray-400 text-sm text-center py-6">Nenhum alerta no período.</p>
          </div>

          <!-- SENSORES -->
          <div v-else-if="secaoPreview === 'sensores'">
            <div v-if="preview.detalhes?.sensores?.length" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div
                v-for="s in preview.detalhes.sensores"
                :key="s.id"
                :class="['rounded-xl p-4 border', theme.isDark ? 'bg-gray-700/50 border-gray-700' : 'bg-gray-50 border-gray-200']"
              >
                <p class="font-medium text-sm mb-1">📡 {{ s.nome }}</p>
                <p class="text-xs text-gray-400 mb-2">{{ s.tipo }}</p>
                <p v-if="s.media !== null" class="text-2xl font-bold text-blue-400">
                  {{ s.media?.toFixed(1) }}
                  <span class="text-sm font-normal text-gray-400">{{ s.unidade }}</span>
                </p>
                <p v-else class="text-sm text-gray-500">Sem leituras</p>
                <p class="text-xs text-gray-500 mt-1">{{ s.totalLeituras }} leituras no período</p>
              </div>
            </div>
            <p v-else class="text-gray-400 text-sm text-center py-6">Nenhum sensor cadastrado.</p>
          </div>

          <!-- PRAGAS -->
          <div v-else-if="secaoPreview === 'pragas'">
            <div v-if="preview.detalhes?.pragas?.length" class="space-y-3">
              <div
                v-for="p in preview.detalhes.pragas"
                :key="p.id"
                :class="['rounded-lg p-3 border border-gray-700/50', theme.isDark ? 'bg-gray-700/30' : 'bg-gray-50']"
              >
                <div class="flex items-center gap-2 mb-1">
                  <span class="font-medium text-sm">{{ p.cultura }}</span>
                  <span :class="['text-xs px-2 py-0.5 rounded-full', { baixa: 'text-green-400 bg-green-400/10', media: 'text-yellow-400 bg-yellow-400/10', alta: 'text-orange-400 bg-orange-400/10', critica: 'text-red-400 bg-red-400/10' }[p.urgencia] || '']">
                    {{ p.urgencia }}
                  </span>
                  <span class="text-xs text-gray-500 ml-auto">{{ formatarData(p.createdAt) }}</span>
                </div>
                <p v-if="p.diagnosticoIA" class="text-xs text-green-400">🤖 {{ p.diagnosticoIA }}</p>
                <p class="text-xs text-gray-400 mt-0.5 truncate">{{ p.descricao }}</p>
              </div>
            </div>
            <p v-else class="text-gray-400 text-sm text-center py-6">Nenhuma ocorrência de praga no período.</p>
          </div>

        </div>
      </div>
    </div>

    <!-- ════════════════════════════════════════════════════════════════════ -->
    <!-- ABA: Histórico                                                      -->
    <!-- ════════════════════════════════════════════════════════════════════ -->
    <div v-else>

      <div v-if="carregando" class="text-center py-16 text-gray-400">
        <div class="animate-spin text-4xl mb-3">⚙️</div>
        <p>Carregando histórico…</p>
      </div>

      <div
        v-else-if="!relatorios.length"
        :class="['text-center py-16 rounded-xl border', theme.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200']"
      >
        <p class="text-5xl mb-4">📁</p>
        <p class="text-lg font-medium mb-1">Nenhum relatório gerado ainda</p>
        <p :class="['text-sm mb-6', theme.isDark ? 'text-gray-400' : 'text-gray-500']">
          Gere o primeiro relatório na aba "Novo Relatório"
        </p>
        <button @click="abaSelecionada = 'novo'" class="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-semibold transition-colors">
          Criar Relatório
        </button>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="r in relatorios"
          :key="r.id"
          :class="['rounded-xl border p-4', theme.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200']"
        >
          <div class="flex flex-wrap items-start gap-3 justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xl">{{ tipoBadge(r.tipo) }}</span>
                <span class="font-semibold truncate">{{ r.titulo }}</span>
              </div>
              <p class="text-xs text-gray-400">
                📍 {{ r.fazenda?.nome }} ·
                {{ formatarData(r.dataInicio) }} — {{ formatarData(r.dataFim) }} ·
                Gerado em {{ formatarData(r.createdAt) }}
              </p>

              <!-- Resumo numérico rápido -->
              <div v-if="r.resumoJson" class="flex flex-wrap gap-3 mt-2">
                <template v-for="[k, v] in Object.entries(JSON.parse(r.resumoJson)).slice(0, 4)" :key="k">
                  <span class="text-xs text-gray-400">
                    {{ String(k).replace(/([A-Z])/g, ' $1').toLowerCase() }}:
                    <strong :class="theme.isDark ? 'text-white' : 'text-gray-900'">{{ v as string }}</strong>
                  </span>
                </template>
              </div>
            </div>

            <!-- Ações -->
            <div class="flex items-center gap-2 flex-shrink-0">
              <button
                @click="baixarCSV(r.id, r.titulo)"
                class="text-xs px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 transition-colors"
              >
                ⬇️ CSV
              </button>
              <button
                @click="gerarPDF(r.id)"
                class="text-xs px-3 py-1.5 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 transition-colors"
              >
                📄 PDF
              </button>
              <button
                @click="excluirRelatorio(r.id)"
                class="text-xs px-3 py-1.5 rounded-lg bg-gray-600/20 text-gray-400 border border-gray-600/30 hover:bg-gray-600/30 transition-colors"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
