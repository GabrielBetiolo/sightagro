<script setup lang="ts">
/**
 * MapaView.vue — Mapa Interativo da Propriedade
 *
 * Funcionalidades:
 *  - Visualizar fazendas no mapa com marcadores
 *  - Desenhar e editar polígono da área total (draw tool)
 *  - Criar talhões com cultura, área e cor personalizada
 *  - Ver e rastrear maquinários (tratores, colheitadeiras) em tempo real
 *  - Exibir trilha de deslocamento do maquinário nas últimas 8h
 *  - Selecionar fazenda pelo seletor para alternar o mapa
 *
 * Dependência: Mapbox GL JS (carregado via CDN no index.html)
 * Token: VITE_MAPBOX_TOKEN no .env do frontend
 */

import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useApi } from '../composables/useApi'
import { useThemeStore } from '../stores/theme'

const { get, post, put, del } = useApi()
const theme = useThemeStore()

// ─── Estado geral ─────────────────────────────────────────────────────────────
const fazendas        = ref<any[]>([])
const fazendaSelecionada = ref<any>(null)
const talhoes         = ref<any[]>([])
const maquinarios     = ref<any[]>([])
const carregando      = ref(true)
const mapaCarregado   = ref(false)
const erro            = ref('')

// Mapbox instance (tipagem any para evitar imports que falham sem o token)
let map: any       = null
let draw: any      = null
let refreshTimer: ReturnType<typeof setInterval> | null = null

// Modais
const modalTalhao    = ref(false)
const modalMaquinario = ref(false)
const talhaoEditando  = ref<any>(null)

// Formulários
const formTalhao = ref({
  nome:    '',
  cultura: '',
  areaHa:  '',
  cor:     '#22c55e',
  status:  'vazio' as 'plantado' | 'colhido' | 'em_preparo' | 'vazio',
})

const formMaquinario = ref({
  nome:   '',
  tipo:   'trator' as 'trator' | 'colheitadeira' | 'pulverizador' | 'caminhao' | 'outro',
  placa:  '',
  modelo: '',
  ano:    '',
})

const salvando = ref(false)

// ─── Token Mapbox ─────────────────────────────────────────────────────────────
const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN || ''
const temToken    = computed(() => !!mapboxToken && mapboxToken !== 'SEU_TOKEN_AQUI')

// ─── Computed ─────────────────────────────────────────────────────────────────
const totalAreaTalhoes = computed(() =>
  talhoes.value.reduce((acc, t) => acc + (t.areaHa || 0), 0).toFixed(1)
)

const maquinariosAtivos = computed(() =>
  maquinarios.value.filter(m => m.posicoes?.length > 0)
)

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(async () => {
  await carregarFazendas()
  carregando.value = false

  if (temToken.value) {
    await nextTick()
    await inicializarMapa()
  }

  // Atualiza posição dos maquinários a cada 30 segundos
  refreshTimer = setInterval(atualizarMaquinarios, 30_000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
  if (map) map.remove()
})

// Reinicia o mapa quando troca de fazenda
watch(fazendaSelecionada, async (fazenda) => {
  if (!fazenda || !map) return
  await carregarDadosFazenda(fazenda.id)
  centralizarNoMapa(fazenda)
})

// ─── Inicializar Mapbox ───────────────────────────────────────────────────────
async function inicializarMapa() {
  // @ts-ignore — Mapbox é carregado via CDN no index.html
  if (typeof mapboxgl === 'undefined') {
    erro.value = 'Mapbox não carregado. Verifique o index.html.'
    return
  }

  // @ts-ignore
  mapboxgl.accessToken = mapboxToken

  // @ts-ignore
  map = new mapboxgl.Map({
    container: 'mapa-container',
    style:     theme.isDark
      ? 'mapbox://styles/mapbox/satellite-streets-v12'   // satélite para modo escuro
      : 'mapbox://styles/mapbox/satellite-streets-v12',  // satélite é melhor para agricultura
    center:    [-51.9253, -14.2350], // centro do Brasil
    zoom:      4,
    language:  'pt',
  })

  // Adiciona controles de navegação
  // @ts-ignore
  map.addControl(new mapboxgl.NavigationControl(), 'top-right')
  // @ts-ignore
  map.addControl(new mapboxgl.FullscreenControl(), 'top-right')
  // @ts-ignore
  map.addControl(new mapboxgl.GeolocateControl({
    positionOptions:  { enableHighAccuracy: true },
    trackUserLocation: false,
    showUserHeading:  true,
  }), 'top-right')

  map.on('load', () => {
    mapaCarregado.value = true
    inicializarDesenho()

    // Se já tem fazenda selecionada, centraliza
    if (fazendaSelecionada.value) {
      centralizarNoMapa(fazendaSelecionada.value)
    } else if (fazendas.value.length > 0) {
      // Seleciona a primeira fazenda automaticamente
      selecionarFazenda(fazendas.value[0])
    }
  })
}

// ─── Ferramenta de desenho (draw) ─────────────────────────────────────────────
function inicializarDesenho() {
  // @ts-ignore
  if (typeof MapboxDraw === 'undefined') return

  // @ts-ignore
  draw = new MapboxDraw({
    displayControlsDefault: false,
    controls: {
      polygon:    true,   // desenhar polígono
      trash:      true,   // apagar seleção
    },
    defaultMode: 'simple_select',
    styles: drawStyles(),
  })

  map.addControl(draw, 'top-left')

  // Quando um polígono é desenhado/editado, salva automaticamente
  map.on('draw.create',  salvarPoligono)
  map.on('draw.update',  salvarPoligono)
}

// Estilos customizados para o draw
function drawStyles() {
  return [
    {
      id: 'gl-draw-polygon-fill',
      type: 'fill',
      filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
      paint: { 'fill-color': '#22c55e', 'fill-opacity': 0.2 },
    },
    {
      id: 'gl-draw-polygon-stroke',
      type: 'line',
      filter: ['all', ['==', '$type', 'Polygon']],
      paint: { 'line-color': '#22c55e', 'line-width': 2 },
    },
    {
      id: 'gl-draw-point',
      type: 'circle',
      filter: ['all', ['==', '$type', 'Point']],
      paint: { 'circle-radius': 5, 'circle-color': '#22c55e' },
    },
  ]
}

// ─── Carregar dados ───────────────────────────────────────────────────────────
async function carregarFazendas() {
  try {
    fazendas.value = await get('/fazendas') || []
  } catch {
    erro.value = 'Erro ao carregar fazendas.'
  }
}

async function carregarDadosFazenda(id: number) {
  try {
    const dados = await get(`/mapa/fazenda/${id}`)
    talhoes.value    = dados.talhoes    || []
    maquinarios.value = dados.maquinarios || []

    if (!map || !mapaCarregado.value) return

    // Limpa layers anteriores
    limparLayersMapa()

    // Renderiza polígono da fazenda (área total)
    if (dados.fazenda.mapaPoligono) {
      renderizarPoligonoFazenda(dados.fazenda.mapaPoligono)
    }

    // Renderiza talhões
    talhoes.value.forEach(renderizarTalhao)

    // Renderiza maquinários
    maquinarios.value.forEach(renderizarMaquinario)

  } catch (e) {
    console.error('Erro ao carregar mapa:', e)
  }
}

async function atualizarMaquinarios() {
  if (!fazendaSelecionada.value) return
  try {
    const dados = await get(`/mapa/fazenda/${fazendaSelecionada.value.id}`)
    maquinarios.value = dados.maquinarios || []
    if (map && mapaCarregado.value) {
      maquinarios.value.forEach(renderizarMaquinario)
    }
  } catch {}
}

// ─── Funções de renderização Mapbox ──────────────────────────────────────────
function limparLayersMapa() {
  // Remove layers existentes antes de re-renderizar
  const layers = ['fazenda-fill', 'fazenda-outline', ...talhoes.value.map((_, i) => `talhao-${i}`)]
  layers.forEach(id => {
    if (map.getLayer(id))  map.removeLayer(id)
    if (map.getSource(id)) map.removeSource(id)
  })
  // Remove marcadores de maquinários (são elementos DOM)
  document.querySelectorAll('.maquinario-marker').forEach(el => el.remove())
}

function renderizarPoligonoFazenda(geojsonStr: string) {
  try {
    const geojson = JSON.parse(geojsonStr)
    map.addSource('fazenda-fill', { type: 'geojson', data: geojson })
    map.addLayer({
      id: 'fazenda-fill', type: 'fill', source: 'fazenda-fill',
      paint: { 'fill-color': '#22c55e', 'fill-opacity': 0.1 },
    })
    map.addLayer({
      id: 'fazenda-outline', type: 'line', source: 'fazenda-fill',
      paint: { 'line-color': '#22c55e', 'line-width': 2, 'line-dasharray': [2, 1] },
    })
  } catch {}
}

function renderizarTalhao(talhao: any, index: number) {
  if (!talhao.geojson) return
  try {
    const geojson = JSON.parse(talhao.geojson)
    const sourceId = `talhao-${index}`
    map.addSource(sourceId, { type: 'geojson', data: geojson })
    map.addLayer({
      id: sourceId, type: 'fill', source: sourceId,
      paint: { 'fill-color': talhao.cor || '#22c55e', 'fill-opacity': 0.35 },
    })
  } catch {}
}

function renderizarMaquinario(maq: any) {
  if (!maq.ultimaLatitude || !maq.ultimaLongitude) return

  const el = document.createElement('div')
  el.className = 'maquinario-marker'
  el.style.cssText = `
    width:36px; height:36px; background:#f59e0b; border-radius:50%;
    border:3px solid white; display:flex; align-items:center; justify-content:center;
    font-size:18px; cursor:pointer; box-shadow:0 2px 8px rgba(0,0,0,0.4);
  `
  el.innerHTML = tipoIcone(maq.tipo)
  el.title = maq.nome

  // @ts-ignore
  new mapboxgl.Marker(el)
    .setLngLat([maq.ultimaLongitude, maq.ultimaLatitude])
    // @ts-ignore
    .setPopup(new mapboxgl.Popup().setHTML(`
      <div style="font-family:sans-serif;padding:4px">
        <strong>${maq.nome}</strong><br>
        <small>${maq.tipo} · ${maq.placa || 'sem placa'}</small><br>
        ${maq.ultimaVez ? '<small>Atualizado: ' + new Date(maq.ultimaVez).toLocaleTimeString('pt-BR') + '</small>' : ''}
      </div>
    `))
    .addTo(map)
}

function centralizarNoMapa(fazenda: any) {
  if (!map || !fazenda) return
  if (fazenda.latitude && fazenda.longitude) {
    map.flyTo({ center: [fazenda.longitude, fazenda.latitude], zoom: 13, duration: 1500 })
  }
}

// ─── Salvar polígono desenhado ─────────────────────────────────────────────────
async function salvarPoligono() {
  if (!fazendaSelecionada.value || !draw) return
  const data = draw.getAll()
  if (!data.features.length) return

  try {
    await put(`/mapa/fazenda/${fazendaSelecionada.value.id}/poligono`, {
      geojson: JSON.stringify(data),
    })
  } catch {
    erro.value = 'Erro ao salvar área da fazenda.'
  }
}

// ─── Selecionar fazenda ───────────────────────────────────────────────────────
async function selecionarFazenda(fazenda: any) {
  fazendaSelecionada.value = fazenda
  await carregarDadosFazenda(fazenda.id)
  centralizarNoMapa(fazenda)
}

// ─── CRUD Talhões ─────────────────────────────────────────────────────────────
function abrirModalTalhao(talhao?: any) {
  talhaoEditando.value = talhao || null
  formTalhao.value = talhao
    ? { nome: talhao.nome, cultura: talhao.cultura || '', areaHa: String(talhao.areaHa || ''), cor: talhao.cor || '#22c55e', status: talhao.status }
    : { nome: '', cultura: '', areaHa: '', cor: '#22c55e', status: 'vazio' }
  modalTalhao.value = true
}

async function salvarTalhao() {
  if (!formTalhao.value.nome || !fazendaSelecionada.value) return
  salvando.value = true
  try {
    const payload: any = {
      fazendaId: fazendaSelecionada.value.id,
      nome:      formTalhao.value.nome,
      cultura:   formTalhao.value.cultura,
      cor:       formTalhao.value.cor,
      status:    formTalhao.value.status,
    }
    if (formTalhao.value.areaHa) payload.areaHa = Number(formTalhao.value.areaHa)

    // Se tem polígono desenhado, associa ao talhão
    if (draw) {
      const drawn = draw.getAll()
      if (drawn.features.length) payload.geojson = JSON.stringify(drawn.features[0])
    }

    if (talhaoEditando.value) {
      const atualizado = await put(`/mapa/talhoes/${talhaoEditando.value.id}`, payload)
      const idx = talhoes.value.findIndex(t => t.id === talhaoEditando.value.id)
      if (idx !== -1) talhoes.value[idx] = atualizado
    } else {
      const novo = await post('/mapa/talhoes', payload)
      talhoes.value.push(novo)
    }
    modalTalhao.value = false
  } catch {
    erro.value = 'Erro ao salvar talhão.'
  } finally {
    salvando.value = false
  }
}

async function excluirTalhao(id: number) {
  if (!confirm('Remover este talhão?')) return
  try {
    await del(`/mapa/talhoes/${id}`)
    talhoes.value = talhoes.value.filter(t => t.id !== id)
  } catch {
    erro.value = 'Erro ao excluir talhão.'
  }
}

// ─── CRUD Maquinários ─────────────────────────────────────────────────────────
async function salvarMaquinario() {
  if (!formMaquinario.value.nome) return
  salvando.value = true
  try {
    const payload: any = {
      nome:  formMaquinario.value.nome,
      tipo:  formMaquinario.value.tipo,
      placa: formMaquinario.value.placa,
      modelo: formMaquinario.value.modelo,
    }
    if (formMaquinario.value.ano) payload.ano = Number(formMaquinario.value.ano)

    const novo = await post('/mapa/maquinarios', payload)
    maquinarios.value.push(novo)
    modalMaquinario.value = false
    formMaquinario.value  = { nome: '', tipo: 'trator', placa: '', modelo: '', ano: '' }
  } catch {
    erro.value = 'Erro ao cadastrar maquinário.'
  } finally {
    salvando.value = false
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function tipoIcone(tipo: string) {
  return { trator: '🚜', colheitadeira: '🌾', pulverizador: '💧', caminhao: '🚛', outro: '⚙️' }[tipo] || '⚙️'
}

function statusCor(s: string) {
  return {
    plantado:   'text-green-400  bg-green-400/10',
    colhido:    'text-yellow-400 bg-yellow-400/10',
    em_preparo: 'text-blue-400   bg-blue-400/10',
    vazio:      'text-gray-400   bg-gray-400/10',
  }[s] || ''
}

function ultimaVezTexto(dt: string | null) {
  if (!dt) return 'Nunca'
  const diff = Date.now() - new Date(dt).getTime()
  const min  = Math.floor(diff / 60000)
  if (min < 1)  return 'Agora'
  if (min < 60) return `${min}min atrás`
  return `${Math.floor(min / 60)}h atrás`
}
</script>

<template>
  <div :class="['flex flex-col h-full', theme.isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900']">

    <!-- ── Cabeçalho ─────────────────────────────────────────────────────── -->
    <div :class="['flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b', theme.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200']">
      <div class="flex-1">
        <h1 class="text-xl font-bold flex items-center gap-2">🗺️ Mapa da Propriedade</h1>
        <p :class="['text-xs mt-0.5', theme.isDark ? 'text-gray-400' : 'text-gray-500']">
          Visualize, delimite áreas e rastreie maquinários em tempo real
        </p>
      </div>

      <!-- Seletor de fazenda -->
      <select
        @change="selecionarFazenda(fazendas.find(f => f.id === parseInt(($event.target as HTMLSelectElement).value))!)"
        :class="['rounded-lg px-3 py-2 text-sm border', theme.isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300']"
      >
        <option disabled :value="0">Selecione uma fazenda</option>
        <option v-for="f in fazendas" :key="f.id" :value="f.id">{{ f.nome }}</option>
      </select>

      <div class="flex gap-2">
        <button
          v-if="fazendaSelecionada"
          @click="abrirModalTalhao()"
          class="text-sm bg-green-600 hover:bg-green-500 text-white px-3 py-2 rounded-lg transition-colors"
        >
          + Talhão
        </button>
        <button
          @click="modalMaquinario = true"
          class="text-sm bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-2 rounded-lg transition-colors"
        >
          + Maquinário
        </button>
      </div>
    </div>

    <!-- ── Aviso sem token ────────────────────────────────────────────────── -->
    <div v-if="!temToken" class="flex-1 flex items-center justify-center p-8">
      <div :class="['max-w-md text-center rounded-2xl border p-8', theme.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200']">
        <div class="text-5xl mb-4">🗺️</div>
        <h2 class="text-xl font-bold mb-2">Configure o token do Mapbox</h2>
        <p :class="['text-sm mb-6 leading-relaxed', theme.isDark ? 'text-gray-400' : 'text-gray-500']">
          Para ativar o mapa interativo, você precisa de um token gratuito do Mapbox.
          São 50.000 visualizações gratuitas por mês — suficiente para começar.
        </p>
        <ol :class="['text-sm text-left space-y-3 mb-6', theme.isDark ? 'text-gray-300' : 'text-gray-600']">
          <li class="flex gap-2"><span class="text-green-400 font-bold">1.</span> Acesse <a href="https://mapbox.com" target="_blank" class="text-green-400 underline">mapbox.com</a> e crie uma conta gratuita</li>
          <li class="flex gap-2"><span class="text-green-400 font-bold">2.</span> Vá em <strong>Account → Access Tokens</strong></li>
          <li class="flex gap-2"><span class="text-green-400 font-bold">3.</span> Copie o <strong>Default public token</strong> (começa com <code class="bg-gray-700 px-1 rounded">pk.</code>)</li>
          <li class="flex gap-2"><span class="text-green-400 font-bold">4.</span> Adicione no arquivo <code class="bg-gray-700 px-1 rounded">sightagro/.env</code>:</li>
        </ol>
        <div class="bg-gray-900 rounded-lg p-3 text-left text-sm font-mono text-green-400 mb-4">
          VITE_MAPBOX_TOKEN=pk.eyJ1Ijo...
        </div>
        <p class="text-xs text-gray-400">Depois adicione também no Vercel em Settings → Environment Variables</p>
      </div>
    </div>

    <!-- ── Layout mapa + painel lateral ─────────────────────────────────── -->
    <div v-else class="flex-1 flex overflow-hidden">

      <!-- Mapa -->
      <div class="flex-1 relative">
        <div id="mapa-container" class="w-full h-full" />

        <!-- Loading overlay -->
        <div v-if="!mapaCarregado" class="absolute inset-0 flex items-center justify-center bg-gray-900/80">
          <div class="text-center">
            <div class="animate-spin text-4xl mb-3">🗺️</div>
            <p class="text-white">Carregando mapa…</p>
          </div>
        </div>

        <!-- Instrução de desenho -->
        <div v-if="mapaCarregado && fazendaSelecionada" class="absolute bottom-4 left-4 right-4 sm:right-auto">
          <div class="bg-gray-900/80 backdrop-blur rounded-lg px-3 py-2 text-xs text-gray-300 max-w-xs">
            🖊️ Use o botão de polígono (esquerda) para delimitar a área da fazenda ou um talhão
          </div>
        </div>
      </div>

      <!-- ── Painel lateral ────────────────────────────────────────────── -->
      <div :class="['w-72 flex-shrink-0 border-l overflow-y-auto', theme.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200']">

        <!-- Erro -->
        <div v-if="erro" class="m-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
          {{ erro }}
        </div>

        <!-- Estado vazio -->
        <div v-if="!fazendaSelecionada" class="p-6 text-center">
          <p class="text-4xl mb-3">🌾</p>
          <p :class="['text-sm', theme.isDark ? 'text-gray-400' : 'text-gray-500']">
            Selecione uma fazenda para ver os detalhes no mapa
          </p>
        </div>

        <template v-else>
          <!-- Info da fazenda -->
          <div class="p-4 border-b border-gray-700/50">
            <h3 class="font-semibold text-sm">📍 {{ fazendaSelecionada.nome }}</h3>
            <p class="text-xs text-gray-400 mt-0.5">{{ fazendaSelecionada.localizacao || 'Localização não informada' }}</p>
            <p class="text-xs text-green-400 mt-1">
              Área total: {{ fazendaSelecionada.areaHa ? fazendaSelecionada.areaHa + ' ha' : 'não definida' }}
            </p>
          </div>

          <!-- ── Talhões ──────────────────────────────────────────────── -->
          <div class="p-4 border-b border-gray-700/50">
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-semibold text-sm">🟩 Talhões</h3>
              <span class="text-xs text-gray-400">{{ totalAreaTalhoes }} ha total</span>
            </div>

            <div v-if="!talhoes.length" class="text-xs text-gray-400 text-center py-3">
              Nenhum talhão. Clique em <strong>"+ Talhão"</strong> para criar.
            </div>

            <div v-else class="space-y-2">
              <div
                v-for="t in talhoes"
                :key="t.id"
                :class="['rounded-lg p-2 border border-gray-700/50', theme.isDark ? 'bg-gray-700/50' : 'bg-gray-50']"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2 flex-1 min-w-0">
                    <div class="w-3 h-3 rounded-full flex-shrink-0" :style="{ backgroundColor: t.cor || '#22c55e' }" />
                    <span class="text-xs font-medium truncate">{{ t.nome }}</span>
                  </div>
                  <div class="flex gap-1 ml-2">
                    <button @click="abrirModalTalhao(t)" class="text-xs text-blue-400 hover:text-blue-300">✏️</button>
                    <button @click="excluirTalhao(t.id)" class="text-xs text-red-400 hover:text-red-300">🗑️</button>
                  </div>
                </div>
                <div class="flex items-center gap-2 mt-1">
                  <span v-if="t.cultura" class="text-xs text-gray-400">{{ t.cultura }}</span>
                  <span :class="['text-xs px-1.5 py-0.5 rounded-full', statusCor(t.status)]">
                    {{ t.status.replace('_', ' ') }}
                  </span>
                  <span v-if="t.areaHa" class="text-xs text-gray-500 ml-auto">{{ t.areaHa }}ha</span>
                </div>
              </div>
            </div>
          </div>

          <!-- ── Maquinários ─────────────────────────────────────────── -->
          <div class="p-4">
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-semibold text-sm">🚜 Maquinários</h3>
              <span class="text-xs text-gray-400">{{ maquinariosAtivos.length }} ativos</span>
            </div>

            <div v-if="!maquinarios.length" class="text-xs text-gray-400 text-center py-3">
              Nenhum maquinário. Clique em <strong>"+ Maquinário"</strong>.
            </div>

            <div v-else class="space-y-2">
              <div
                v-for="m in maquinarios"
                :key="m.id"
                :class="['rounded-lg p-2 border border-gray-700/50', theme.isDark ? 'bg-gray-700/50' : 'bg-gray-50']"
              >
                <div class="flex items-center gap-2">
                  <span class="text-base">{{ tipoIcone(m.tipo) }}</span>
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-medium truncate">{{ m.nome }}</p>
                    <p class="text-xs text-gray-400">{{ m.placa || m.modelo || m.tipo }}</p>
                  </div>
                  <!-- Indicador de GPS ativo -->
                  <div
                    :class="['w-2 h-2 rounded-full flex-shrink-0', m.ultimaLatitude ? 'bg-green-400 animate-pulse' : 'bg-gray-600']"
                    :title="m.ultimaLatitude ? 'GPS ativo' : 'Sem sinal GPS'"
                  />
                </div>
                <p v-if="m.ultimaVez" class="text-xs text-gray-500 mt-1 text-right">
                  📍 {{ ultimaVezTexto(m.ultimaVez) }}
                </p>
                <!-- Token do dispositivo IoT -->
                <details class="mt-1">
                  <summary class="text-xs text-gray-500 cursor-pointer hover:text-gray-300">Token IoT</summary>
                  <code class="text-xs text-green-400 break-all">{{ m.token }}</code>
                </details>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- ════════════════════════════════════════════════════════════════════ -->
    <!-- Modal — Talhão                                                      -->
    <!-- ════════════════════════════════════════════════════════════════════ -->
    <div v-if="modalTalhao" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div :class="['w-full max-w-md rounded-2xl border shadow-2xl', theme.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200']">

        <div class="flex items-center justify-between p-6 border-b border-gray-700/50">
          <h2 class="text-lg font-bold">{{ talhaoEditando ? '✏️ Editar Talhão' : '🟩 Novo Talhão' }}</h2>
          <button @click="modalTalhao = false" class="text-gray-400 hover:text-white text-2xl">×</button>
        </div>

        <div class="p-6 space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div class="col-span-2">
              <label class="block text-sm font-medium mb-1">Nome *</label>
              <input
                v-model="formTalhao.nome"
                placeholder="Ex: Talhão Norte"
                :class="['w-full rounded-lg px-3 py-2 border', theme.isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300']"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Cultura</label>
              <input
                v-model="formTalhao.cultura"
                placeholder="Soja, Milho…"
                :class="['w-full rounded-lg px-3 py-2 border', theme.isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300']"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Área (ha)</label>
              <input
                v-model="formTalhao.areaHa"
                type="number" step="0.1"
                placeholder="Ex: 15.5"
                :class="['w-full rounded-lg px-3 py-2 border', theme.isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300']"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Status</label>
              <select
                v-model="formTalhao.status"
                :class="['w-full rounded-lg px-3 py-2 border', theme.isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300']"
              >
                <option value="vazio">Vazio</option>
                <option value="em_preparo">Em Preparo</option>
                <option value="plantado">Plantado</option>
                <option value="colhido">Colhido</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Cor no Mapa</label>
              <div class="flex items-center gap-2">
                <input
                  v-model="formTalhao.cor"
                  type="color"
                  class="w-10 h-10 rounded cursor-pointer border-0"
                />
                <span class="text-sm text-gray-400">{{ formTalhao.cor }}</span>
              </div>
            </div>
          </div>

          <div class="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-sm text-blue-300">
            💡 Dica: Desenhe o polígono no mapa antes de salvar para associar a área ao talhão automaticamente.
          </div>
        </div>

        <div class="flex gap-3 p-6 pt-0">
          <button @click="modalTalhao = false" :class="['flex-1 py-2 rounded-lg border', theme.isDark ? 'border-gray-600' : 'border-gray-300']">Cancelar</button>
          <button @click="salvarTalhao" :disabled="salvando" class="flex-1 py-2 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold transition-colors">
            {{ salvando ? '…' : 'Salvar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ════════════════════════════════════════════════════════════════════ -->
    <!-- Modal — Maquinário                                                  -->
    <!-- ════════════════════════════════════════════════════════════════════ -->
    <div v-if="modalMaquinario" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div :class="['w-full max-w-md rounded-2xl border shadow-2xl', theme.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200']">

        <div class="flex items-center justify-between p-6 border-b border-gray-700/50">
          <h2 class="text-lg font-bold">🚜 Novo Maquinário</h2>
          <button @click="modalMaquinario = false" class="text-gray-400 hover:text-white text-2xl">×</button>
        </div>

        <div class="p-6 space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div class="col-span-2">
              <label class="block text-sm font-medium mb-1">Nome *</label>
              <input
                v-model="formMaquinario.nome"
                placeholder="Ex: Trator John Deere 5075E"
                :class="['w-full rounded-lg px-3 py-2 border', theme.isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300']"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Tipo</label>
              <select
                v-model="formMaquinario.tipo"
                :class="['w-full rounded-lg px-3 py-2 border', theme.isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300']"
              >
                <option value="trator">🚜 Trator</option>
                <option value="colheitadeira">🌾 Colheitadeira</option>
                <option value="pulverizador">💧 Pulverizador</option>
                <option value="caminhao">🚛 Caminhão</option>
                <option value="outro">⚙️ Outro</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Placa</label>
              <input
                v-model="formMaquinario.placa"
                placeholder="ABC-1234"
                :class="['w-full rounded-lg px-3 py-2 border', theme.isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300']"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Modelo</label>
              <input
                v-model="formMaquinario.modelo"
                placeholder="5075E"
                :class="['w-full rounded-lg px-3 py-2 border', theme.isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300']"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Ano</label>
              <input
                v-model="formMaquinario.ano"
                type="number" placeholder="2022"
                :class="['w-full rounded-lg px-3 py-2 border', theme.isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300']"
              />
            </div>
          </div>

          <div class="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-sm text-yellow-300">
            🔑 Após cadastrar, um token único será gerado. Use-o no seu dispositivo GPS (Arduino/ESP32) para enviar posição via <code class="text-xs">PUT /mapa/maquinarios/:id/posicao</code>
          </div>
        </div>

        <div class="flex gap-3 p-6 pt-0">
          <button @click="modalMaquinario = false" :class="['flex-1 py-2 rounded-lg border', theme.isDark ? 'border-gray-600' : 'border-gray-300']">Cancelar</button>
          <button @click="salvarMaquinario" :disabled="salvando" class="flex-1 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white font-semibold transition-colors">
            {{ salvando ? '…' : 'Cadastrar' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
