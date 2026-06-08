<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { api } from '../composables/useApi'

const router = useRouter()
const auth = useAuthStore()

const loading = ref(true)
const showNovaFazenda = ref(false)
const novaFazenda = ref({ nome: '', localizacao: '', area: '', cultura: '' })
const criando = ref(false)

const fazendas = ref<any[]>([])
const sensores = ref<any[]>([])
const alertas = ref<any[]>([])
const clima = ref<any>(null)

let interval: any = null

async function fetchDados() {
  try {
    const [fs, ss, as] = await Promise.all([
      api.get('/fazendas'),
      api.get('/sensores'),
      api.get('/alertas')
    ])
    fazendas.value = fs
    sensores.value = ss
    alertas.value = as.slice(0, 5)

    if (fs.length > 0) {
      try {
        const c = await api.get(`/clima/fazenda/${fs[0].id}`)
        clima.value = c
      } catch {}
    }
  } finally {
    loading.value = false
  }
}

async function criarFazenda() {
  if (!novaFazenda.value.nome) return
  criando.value = true
  try {
    await api.post('/fazendas', {
      nome: novaFazenda.value.nome,
      localizacao: novaFazenda.value.localizacao,
      area: Number(novaFazenda.value.area) || 0,
      cultura: novaFazenda.value.cultura
    })
    showNovaFazenda.value = false
    novaFazenda.value = { nome: '', localizacao: '', area: '', cultura: '' }
    await fetchDados()
  } finally {
    criando.value = false
  }
}

const statusColor: Record<string, string> = { online: '#4ade80', offline: '#f87171', unstable: '#facc15' }
const alertColor: Record<string, string> = { info: '#22d3ee', success: '#4ade80', warning: '#facc15', danger: '#f87171' }

onMounted(() => {
  fetchDados()
  interval = setInterval(fetchDados, 30000)
})
onUnmounted(() => clearInterval(interval))
</script>

<template>
  <div class="dashboard">
    <div class="header">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-sub">Bem-vindo, {{ auth.user?.name?.split(' ')[0] }}!</p>
      </div>
      <div class="header-actions">
        <div v-if="clima" class="pill">
          <img :src="`https://openweathermap.org/img/wn/${clima.atual.icone}.png`" width="24" />
          {{ clima.atual.temp.toFixed(1) }}°C — {{ clima.atual.descricao }}
        </div>
        <button class="btn-primary" @click="showNovaFazenda = true">
          <i class="ti ti-plus"></i> Nova Fazenda
        </button>
      </div>
    </div>

    <!-- LOADING -->
    <div v-if="loading" class="loading-state">
      <i class="ti ti-loader-2 spin" style="font-size:2rem;color:var(--green)"></i>
      <p>Carregando dados...</p>
    </div>

    <template v-else>
      <!-- EMPTY STATE -->
      <div v-if="fazendas.length === 0" class="empty-hero">
        <div class="empty-icon"><i class="ti ti-map-pin-off"></i></div>
        <h2>Nenhuma fazenda cadastrada</h2>
        <p>Adicione sua primeira fazenda para começar a monitorar sua produção.</p>
        <button class="btn-primary" @click="showNovaFazenda = true">
          <i class="ti ti-plus"></i> Adicionar fazenda
        </button>
      </div>

      <template v-else>
        <!-- CLIMA WIDGET -->
        <div v-if="clima" class="hero">
          <div class="hero-content">
            <h2 class="hero-title">{{ fazendas[0]?.nome }}</h2>
            <p class="hero-sub">{{ fazendas[0]?.localizacao }} — {{ fazendas[0]?.cultura }}</p>
            <button class="hero-cta" @click="router.push('/app/relatorios')">Ver Relatórios →</button>
          </div>
          <div class="clima-cards">
            <div class="clima-card">
              <img :src="`https://openweathermap.org/img/wn/${clima.atual.icone}@2x.png`" width="48" />
              <div>
                <div class="clima-val">{{ clima.atual.temp.toFixed(1) }}°C</div>
                <div class="clima-label">{{ clima.atual.descricao }}</div>
              </div>
            </div>
            <div class="clima-card">
              <i class="ti ti-droplet" style="font-size:2rem;color:#22d3ee"></i>
              <div>
                <div class="clima-val">{{ clima.atual.umidade }}%</div>
                <div class="clima-label">Umidade</div>
              </div>
            </div>
            <div class="clima-card">
              <i class="ti ti-wind" style="font-size:2rem;color:#a78bfa"></i>
              <div>
                <div class="clima-val">{{ clima.atual.vento.toFixed(1) }} m/s</div>
                <div class="clima-label">Vento</div>
              </div>
            </div>
          </div>
        </div>

        <!-- CARDS MÉTRICAS -->
        <div class="cards-grid">
          <div class="metric-card" style="--accent:#4ade80">
            <div class="card-header">
              <span class="card-label">Fazendas</span>
              <div class="card-icon" style="background:#1a2e1a"><i class="ti ti-map" style="color:#4ade80"></i></div>
            </div>
            <div class="card-value">{{ fazendas.length }}</div>
            <div class="card-badge" style="background:#1a2e1a;color:#4ade80">
              <i class="ti ti-check"></i> Cadastradas
            </div>
          </div>
          <div class="metric-card" style="--accent:#22d3ee">
            <div class="card-header">
              <span class="card-label">Sensores</span>
              <div class="card-icon" style="background:#0e2a2e"><i class="ti ti-activity" style="color:#22d3ee"></i></div>
            </div>
            <div class="card-value">{{ sensores.filter(s=>s.status==='online').length }}/{{ sensores.length }}</div>
            <div class="card-badge" style="background:#0e2a2e;color:#22d3ee">
              <i class="ti ti-wifi"></i> Online
            </div>
          </div>
          <div class="metric-card" style="--accent:#facc15">
            <div class="card-header">
              <span class="card-label">Alertas</span>
              <div class="card-icon" style="background:#2a2200"><i class="ti ti-bell" style="color:#facc15"></i></div>
            </div>
            <div class="card-value">{{ alertas.filter(a=>!a.lido).length }}</div>
            <div class="card-badge" style="background:#2a2200;color:#facc15">
              <i class="ti ti-alert-triangle"></i> Não lidos
            </div>
          </div>
          <div class="metric-card" style="--accent:#a78bfa">
            <div class="card-header">
              <span class="card-label">Plano</span>
              <div class="card-icon" style="background:#1e1a2e"><i class="ti ti-crown" style="color:#a78bfa"></i></div>
            </div>
            <div class="card-value" style="font-size:1.8rem;text-transform:capitalize">{{ auth.user?.plan || 'free' }}</div>
            <div class="card-badge" style="background:#1e1a2e;color:#a78bfa;cursor:pointer" @click="router.push('/app/planos')">
              <i class="ti ti-arrow-up"></i> Fazer upgrade
            </div>
          </div>
        </div>

        <!-- BOTTOM PANELS -->
        <div class="bottom-grid">
          <!-- SENSORES -->
          <div class="panel">
            <div class="panel-header">
              <h3>Sensores</h3>
              <span class="panel-action" @click="router.push('/app/sensores')">Ver todos →</span>
            </div>
            <div v-if="sensores.length === 0" class="empty-panel">
              <i class="ti ti-activity"></i>
              <p>Nenhum sensor cadastrado</p>
              <button class="btn-sm" @click="router.push('/app/sensores')">Adicionar sensor</button>
            </div>
            <div v-else class="sensors-list">
              <div v-for="s in sensores.slice(0,5)" :key="s.id" class="sensor-row">
                <div>
                  <div style="font-size:0.88rem;font-weight:500">{{ s.codigo }}</div>
                  <div style="font-size:0.75rem;color:var(--text3)">{{ s.tipo }} · {{ s.fazenda?.nome }}</div>
                </div>
                <div class="sensor-status">
                  <div class="dot" :style="`background:${statusColor[s.status]}`" :class="s.status==='online'?'dot-glow':''"></div>
                  <span :style="`color:${statusColor[s.status]};font-size:0.78rem`">
                    {{ s.status === 'online' ? 'Online' : s.status === 'offline' ? 'Offline' : 'Instável' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- ALERTAS -->
          <div class="panel">
            <div class="panel-header">
              <h3>Alertas recentes</h3>
              <span class="panel-action" @click="router.push('/app/alertas')">Ver todos →</span>
            </div>
            <div v-if="alertas.length === 0" class="empty-panel">
              <i class="ti ti-bell-off"></i>
              <p>Nenhum alerta por enquanto</p>
            </div>
            <div v-else class="alerts-list">
              <div v-for="a in alertas" :key="a.id" class="alert-item">
                <div class="alert-dot" :style="`background:${alertColor[a.tipo]}`"></div>
                <div style="flex:1;min-width:0">
                  <div style="font-size:0.85rem;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ a.titulo }}</div>
                  <div style="font-size:0.75rem;color:var(--text3)">{{ a.fazenda?.nome }}</div>
                </div>
                <span class="alert-time">{{ new Date(a.createdAt).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) }}</span>
              </div>
            </div>
          </div>

          <!-- PREVISÃO -->
          <div v-if="clima?.previsao" class="panel">
            <div class="panel-header">
              <h3>Previsão — {{ clima.atual.cidade }}</h3>
            </div>
            <div class="previsao-list">
              <div v-for="p in clima.previsao.slice(0,6)" :key="p.hora" class="previsao-item">
                <span class="prev-hora">{{ p.hora }}</span>
                <img :src="`https://openweathermap.org/img/wn/${p.icone}.png`" width="28" />
                <span class="prev-temp">{{ p.temp.toFixed(0) }}°</span>
                <span v-if="p.chuva > 0" class="prev-chuva"><i class="ti ti-droplet"></i> {{ p.chuva.toFixed(1) }}mm</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </template>

    <!-- MODAL NOVA FAZENDA -->
    <div v-if="showNovaFazenda" class="modal-overlay" @click.self="showNovaFazenda = false">
      <div class="modal">
        <div class="modal-header">
          <h3>Nova Fazenda</h3>
          <button class="modal-close" @click="showNovaFazenda = false"><i class="ti ti-x"></i></button>
        </div>
        <div class="field">
          <label>Nome da fazenda *</label>
          <input v-model="novaFazenda.nome" type="text" placeholder="Ex: Fazenda São João" />
        </div>
        <div class="field">
          <label>Cidade, Estado *</label>
          <input v-model="novaFazenda.localizacao" type="text" placeholder="Ex: Sorriso, MT" />
          <span class="field-hint">Usado para buscar a previsão do tempo</span>
        </div>
        <div class="field-row">
          <div class="field">
            <label>Área (ha)</label>
            <input v-model="novaFazenda.area" type="number" placeholder="0" />
          </div>
          <div class="field">
            <label>Cultura principal</label>
            <input v-model="novaFazenda.cultura" type="text" placeholder="Ex: Soja" />
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-outline-lg" @click="showNovaFazenda = false">Cancelar</button>
          <button class="btn-primary-lg" @click="criarFazenda" :disabled="criando">
            <i v-if="criando" class="ti ti-loader-2 spin"></i>
            <span v-else>Criar Fazenda</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard { padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem; background: var(--bg); min-height: 100vh; color: var(--text); font-family: var(--font-body); }
.header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; }
.page-title { font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; letter-spacing: -0.03em; line-height: 1; }
.page-sub { color: var(--text3); font-size: 0.9rem; margin-top: 4px; }
.header-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.pill { background: var(--surface); border: 1px solid var(--border); padding: 8px 14px; border-radius: 30px; font-size: 0.82rem; display: flex; align-items: center; gap: 4px; }
.btn-primary { background: var(--green); color: #0a0f0d; border: none; padding: 10px 18px; border-radius: 30px; font-family: var(--font-body); font-weight: 700; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s; }
.btn-primary:hover { background: var(--green2); }

.loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; padding: 4rem; color: var(--text3); }

.empty-hero { background: var(--surface); border: 2px dashed var(--border); border-radius: 24px; padding: 4rem 2rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 1rem; }
.empty-icon { width: 72px; height: 72px; background: var(--surface2); border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 32px; color: var(--text3); }
.empty-hero h2 { font-family: var(--font-display); font-size: 1.4rem; font-weight: 800; }
.empty-hero p { color: var(--text3); font-size: 0.9rem; max-width: 340px; line-height: 1.6; }

.hero { background: linear-gradient(135deg, #14532d, #166534, #15803d); border-radius: 20px; padding: 2rem; display: flex; justify-content: space-between; align-items: center; gap: 1.5rem; flex-wrap: wrap; }
.hero-title { font-family: var(--font-display); font-size: 1.6rem; font-weight: 800; }
.hero-sub { color: rgba(255,255,255,0.7); font-size: 0.85rem; margin-top: 4px; }
.hero-cta { margin-top: 1rem; background: #fff; color: #14532d; padding: 10px 20px; border-radius: 30px; font-weight: 700; font-size: 0.85rem; border: none; cursor: pointer; }
.clima-cards { display: flex; gap: 10px; flex-wrap: wrap; }
.clima-card { background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 12px 16px; display: flex; align-items: center; gap: 10px; min-width: 120px; }
.clima-val { font-family: var(--font-display); font-size: 1.4rem; font-weight: 800; color: white; }
.clima-label { font-size: 0.75rem; color: rgba(255,255,255,0.6); text-transform: capitalize; }

.cards-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 1rem; }
.metric-card { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: 1.25rem; transition: border-color 0.2s; }
.metric-card:hover { border-color: var(--accent); }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
.card-label { font-size: 0.78rem; color: var(--text3); }
.card-icon { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
.card-value { font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; letter-spacing: -0.02em; line-height: 1; }
.card-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 0.72rem; margin-top: 8px; padding: 3px 10px; border-radius: 20px; }

.bottom-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; }
.panel { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: 1.5rem; }
.panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
.panel-header h3 { font-family: var(--font-display); font-size: 1rem; font-weight: 800; }
.panel-action { font-size: 0.75rem; color: var(--green); cursor: pointer; }

.empty-panel { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 2rem; color: var(--text3); font-size: 0.85rem; text-align: center; }
.empty-panel .ti { font-size: 28px; }
.btn-sm { background: var(--surface2); border: 1px solid var(--border); color: var(--text); padding: 6px 14px; border-radius: 8px; font-size: 0.8rem; cursor: pointer; font-family: var(--font-body); margin-top: 4px; }

.sensors-list { display: flex; flex-direction: column; gap: 8px; }
.sensor-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: var(--surface2); border-radius: 10px; }
.sensor-status { display: flex; align-items: center; gap: 6px; }
.dot { width: 7px; height: 7px; border-radius: 50%; }
.dot-glow { box-shadow: 0 0 6px rgba(74,222,128,0.6); }

.alerts-list { display: flex; flex-direction: column; gap: 8px; }
.alert-item { display: flex; align-items: center; gap: 10px; background: var(--surface2); border-radius: 10px; padding: 10px 12px; }
.alert-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.alert-time { font-size: 0.7rem; color: var(--muted); white-space: nowrap; }

.previsao-list { display: flex; flex-direction: column; gap: 6px; }
.previsao-item { display: flex; align-items: center; gap: 10px; padding: 8px 10px; background: var(--surface2); border-radius: 10px; }
.prev-hora { font-size: 0.78rem; color: var(--text3); width: 40px; flex-shrink: 0; }
.prev-temp { font-family: var(--font-display); font-weight: 700; font-size: 0.95rem; margin-left: auto; }
.prev-chuva { font-size: 0.72rem; color: #22d3ee; display: flex; align-items: center; gap: 3px; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 1rem; }
.modal { background: var(--surface); border: 1px solid var(--border); border-radius: 24px; padding: 2rem; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.modal-header h3 { font-family: var(--font-display); font-size: 1.3rem; font-weight: 800; }
.modal-close { background: none; border: none; color: var(--text3); font-size: 20px; cursor: pointer; }
.field { margin-bottom: 1rem; }
.field label { display: block; font-size: 0.82rem; color: var(--text2); margin-bottom: 5px; }
.field input { width: 100%; background: var(--surface2); border: 1px solid var(--border); color: var(--text); padding: 10px 14px; border-radius: 10px; font-size: 0.9rem; font-family: var(--font-body); outline: none; }
.field input:focus { border-color: var(--green); }
.field-hint { font-size: 0.75rem; color: var(--text3); margin-top: 4px; display: block; }
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.modal-actions { display: flex; gap: 10px; margin-top: 1.5rem; }
.btn-outline-lg { flex: 1; background: transparent; border: 1px solid var(--border); color: var(--text2); padding: 12px; border-radius: 12px; font-size: 0.9rem; cursor: pointer; font-family: var(--font-body); }
.btn-primary-lg { flex: 1; background: var(--green); color: #0a0f0d; border: none; padding: 12px; border-radius: 12px; font-size: 0.9rem; font-weight: 700; cursor: pointer; font-family: var(--font-body); display: flex; align-items: center; justify-content: center; gap: 6px; }

.spin { animation: spin 1s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 1024px) { .cards-grid { grid-template-columns: repeat(2,1fr); } .bottom-grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 640px) { .dashboard { padding: 1rem; } .cards-grid { grid-template-columns: repeat(2,1fr); gap: 0.75rem; } .bottom-grid { grid-template-columns: 1fr; } .hero { flex-direction: column; } .clima-cards { width: 100%; justify-content: space-between; } }
</style>
