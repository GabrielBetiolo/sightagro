<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import ProductionChart from '../components/ProductionChart.vue'

const router = useRouter()

const showNovaFazenda = ref(false)
const novaFazenda = ref({ nome: '', localizacao: '', area: '', cultura: '' })

const metrics = ref({ temperatura: 24, umidade: 78, irrigacao: true, producao: 12 })
const farmStatus = ref({ saude: 92, agua: 67, energia: 81 })
const sensors = ref([
  { id: 'A1', status: 'online' },
  { id: 'B4', status: 'online' },
  { id: 'C2', status: 'offline' },
  { id: 'D8', status: 'unstable' }
])
const alerts = ref([
  { id: 1, text: 'Chuva prevista amanhã', time: '08:30', type: 'info' },
  { id: 2, text: 'Trator setor A finalizado', time: '07:12', type: 'success' },
  { id: 3, text: 'Irrigação automática ativada', time: '06:45', type: 'success' },
  { id: 4, text: 'Umidade abaixo do ideal', time: '05:20', type: 'warning' }
])

const statusColor: Record<string, string> = {
  online: '#4ade80', offline: '#f87171', unstable: '#facc15'
}
const alertColor: Record<string, string> = {
  info: '#22d3ee', success: '#4ade80', warning: '#facc15', danger: '#f87171'
}

function criarFazenda() {
  // futuramente conectar à API
  showNovaFazenda.value = false
  novaFazenda.value = { nome: '', localizacao: '', area: '', cultura: '' }
  router.push('/fazendas')
}
</script>

<template>
  <div class="dashboard">
    <!-- HEADER -->
    <div class="header">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-sub">Monitoramento agrícola inteligente</p>
      </div>
      <div class="header-actions">
        <div class="pill">
          <i class="ti ti-cloud-sun"></i> 24°C — Ensolarado
        </div>
        <button class="btn-primary" @click="showNovaFazenda = true">
          <i class="ti ti-plus"></i> Nova Fazenda
        </button>
      </div>
    </div>

    <!-- HERO BANNER -->
    <section class="hero">
      <div class="hero-content">
        <h2 class="hero-title">Agricultura inteligente para o futuro do agro</h2>
        <p class="hero-sub">Controle sensores, monitore plantações e aumente produtividade em tempo real.</p>
        <button class="hero-cta" @click="router.push('/relatorios')">Ver Relatórios →</button>
      </div>
      <div class="hero-stats">
        <div class="hero-stat">
          <strong>+12%</strong><span>Produção</span>
        </div>
        <div class="hero-stat">
          <strong>92%</strong><span>Saúde</span>
        </div>
      </div>
    </section>

    <!-- METRIC CARDS -->
    <div class="cards-grid">
      <div class="metric-card" style="--accent: #4ade80">
        <div class="card-header">
          <span class="card-label">Temperatura</span>
          <div class="card-icon" style="background:#1a2e1a"><i class="ti ti-temperature" style="color:#4ade80"></i></div>
        </div>
        <div class="card-value">{{ metrics.temperatura }}°</div>
        <div class="card-badge" style="background:#1a2e1a;color:#4ade80">
          <i class="ti ti-trending-up"></i> +2% hoje
        </div>
      </div>

      <div class="metric-card" style="--accent: #22d3ee">
        <div class="card-header">
          <span class="card-label">Umidade</span>
          <div class="card-icon" style="background:#0e2a2e"><i class="ti ti-droplet" style="color:#22d3ee"></i></div>
        </div>
        <div class="card-value">{{ metrics.umidade }}%</div>
        <div class="card-badge" style="background:#0e2a2e;color:#22d3ee">
          <i class="ti ti-check"></i> Ideal
        </div>
      </div>

      <div class="metric-card" style="--accent: #facc15">
        <div class="card-header">
          <span class="card-label">Irrigação</span>
          <div class="card-icon" style="background:#2a2200"><i class="ti ti-droplets" style="color:#facc15"></i></div>
        </div>
        <div class="card-value">{{ metrics.irrigacao ? 'ON' : 'OFF' }}</div>
        <div class="card-badge" style="background:#2a2200;color:#facc15">
          <i class="ti ti-bolt"></i> Ativa agora
        </div>
      </div>

      <div class="metric-card" style="--accent: #a78bfa">
        <div class="card-header">
          <span class="card-label">Produção</span>
          <div class="card-icon" style="background:#1e1a2e"><i class="ti ti-chart-line" style="color:#a78bfa"></i></div>
        </div>
        <div class="card-value">+{{ metrics.producao }}%</div>
        <div class="card-badge" style="background:#1e1a2e;color:#a78bfa">
          <i class="ti ti-calendar"></i> Este mês
        </div>
      </div>
    </div>

    <!-- BOTTOM PANELS -->
    <div class="bottom-grid">
      <div class="panel col-2">
        <div class="panel-header">
          <h3>Status da Fazenda</h3>
          <span class="panel-action" @click="router.push('/fazendas')">Ver detalhes →</span>
        </div>

        <div class="progress-list">
          <div class="prog-row">
            <div class="prog-header">
              <span>Saúde da Plantação</span>
              <span style="color:#4ade80">{{ farmStatus.saude }}%</span>
            </div>
            <div class="prog-track">
              <div class="prog-fill" :style="`width:${farmStatus.saude}%;background:#4ade80`"></div>
            </div>
          </div>
          <div class="prog-row">
            <div class="prog-header">
              <span>Uso de Água</span>
              <span style="color:#22d3ee">{{ farmStatus.agua }}%</span>
            </div>
            <div class="prog-track">
              <div class="prog-fill" :style="`width:${farmStatus.agua}%;background:#22d3ee`"></div>
            </div>
          </div>
          <div class="prog-row">
            <div class="prog-header">
              <span>Energia Solar</span>
              <span style="color:#facc15">{{ farmStatus.energia }}%</span>
            </div>
            <div class="prog-track">
              <div class="prog-fill" :style="`width:${farmStatus.energia}%;background:#facc15`"></div>
            </div>
          </div>
        </div>

        <div style="margin-top:2rem">
          <ProductionChart />
        </div>
      </div>

      <div class="side-panels">
        <div class="panel">
          <div class="panel-header">
            <h3>Alertas</h3>
            <span class="panel-action" @click="router.push('/alertas')">Ver todos</span>
          </div>
          <div class="alerts-list">
            <div v-for="a in alerts" :key="a.id" class="alert-item">
              <div class="alert-dot" :style="`background:${alertColor[a.type]}`"></div>
              <span>{{ a.text }}</span>
              <span class="alert-time">{{ a.time }}</span>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <h3>Sensores</h3>
            <span class="panel-action" @click="router.push('/sensores')">
              {{ sensors.filter(s => s.status === 'online').length }}/{{ sensors.length }} online
            </span>
          </div>
          <div class="sensors-list">
            <div v-for="s in sensors" :key="s.id" class="sensor-row">
              <span>Sensor {{ s.id }}</span>
              <div class="sensor-status">
                <div class="dot" :style="`background:${statusColor[s.status]}`" :class="s.status === 'online' ? 'dot-glow' : ''"></div>
                <span :style="`color:${statusColor[s.status]};text-transform:capitalize`">
                  {{ s.status === 'online' ? 'Online' : s.status === 'offline' ? 'Offline' : 'Instável' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL NOVA FAZENDA -->
    <div v-if="showNovaFazenda" class="modal-overlay" @click.self="showNovaFazenda = false">
      <div class="modal">
        <div class="modal-header">
          <h3>Nova Fazenda</h3>
          <button class="modal-close" @click="showNovaFazenda = false"><i class="ti ti-x"></i></button>
        </div>
        <div class="field">
          <label>Nome da fazenda</label>
          <input v-model="novaFazenda.nome" type="text" placeholder="Ex: Fazenda São João" />
        </div>
        <div class="field">
          <label>Localização</label>
          <input v-model="novaFazenda.localizacao" type="text" placeholder="Cidade, Estado" />
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
          <button class="btn-primary-lg" @click="criarFazenda">Criar Fazenda</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@400;500&display=swap');
@import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css');

.dashboard { padding: 2.5rem; display: flex; flex-direction: column; gap: 1.75rem; background: #0a0f0d; min-height: 100vh; color: #f0fdf4; font-family: 'DM Sans', sans-serif; }
.header { display: flex; justify-content: space-between; align-items: flex-start; }
.page-title { font-family: 'Syne', sans-serif; font-size: 2.8rem; font-weight: 800; letter-spacing: -0.03em; line-height: 1; }
.page-sub { color: #6b7280; font-size: 0.9rem; margin-top: 4px; }
.header-actions { display: flex; gap: 10px; align-items: center; }
.pill { background: #111a14; border: 1px solid #1e3020; padding: 9px 16px; border-radius: 30px; font-size: 0.85rem; display: flex; align-items: center; gap: 6px; }
.pill .ti { color: #facc15; }
.btn-primary { background: #4ade80; color: #0a0f0d; border: none; padding: 10px 20px; border-radius: 30px; font-family: 'DM Sans', sans-serif; font-weight: 700; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s; }
.btn-primary:hover { background: #22c55e; transform: translateY(-1px); }
.hero { background: linear-gradient(135deg, #14532d 0%, #166534 40%, #15803d 100%); border-radius: 24px; padding: 2.5rem; display: flex; justify-content: space-between; align-items: center; gap: 2rem; position: relative; overflow: hidden; }
.hero::before { content: ''; position: absolute; right: -60px; top: -60px; width: 280px; height: 280px; background: rgba(255,255,255,0.05); border-radius: 50%; }
.hero-title { font-family: 'Syne', sans-serif; font-size: 2rem; font-weight: 800; letter-spacing: -0.02em; line-height: 1.1; max-width: 400px; position: relative; z-index: 1; }
.hero-sub { color: rgba(255,255,255,0.7); font-size: 0.9rem; margin-top: 0.75rem; max-width: 340px; line-height: 1.6; position: relative; z-index: 1; }
.hero-cta { margin-top: 1.25rem; background: #fff; color: #14532d; padding: 11px 22px; border-radius: 30px; font-weight: 700; font-size: 0.85rem; border: none; cursor: pointer; transition: transform 0.2s; display: inline-block; position: relative; z-index: 1; }
.hero-cta:hover { transform: scale(1.04); }
.hero-stats { display: flex; flex-direction: column; gap: 10px; position: relative; z-index: 1; }
.hero-stat { background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); border-radius: 18px; padding: 1.25rem 1.5rem; text-align: center; min-width: 110px; }
.hero-stat strong { display: block; font-family: 'Syne', sans-serif; font-size: 1.8rem; font-weight: 800; }
.hero-stat span { color: rgba(255,255,255,0.6); font-size: 0.75rem; }
.cards-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
.metric-card { background: #111a14; border: 1px solid #1e3020; border-radius: 20px; padding: 1.5rem; transition: border-color 0.2s; }
.metric-card:hover { border-color: var(--accent); }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
.card-label { font-size: 0.78rem; color: #6b7280; }
.card-icon { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
.card-icon .ti { font-size: 15px; }
.card-value { font-family: 'Syne', sans-serif; font-size: 2.5rem; font-weight: 800; letter-spacing: -0.02em; line-height: 1; }
.card-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 0.72rem; margin-top: 10px; padding: 4px 10px; border-radius: 20px; }
.card-badge .ti { font-size: 11px; }
.bottom-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 1rem; }
.panel { background: #111a14; border: 1px solid #1e3020; border-radius: 20px; padding: 1.75rem; }
.panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.panel-header h3 { font-family: 'Syne', sans-serif; font-size: 1.1rem; font-weight: 800; }
.panel-action { font-size: 0.75rem; color: #4ade80; cursor: pointer; transition: opacity 0.2s; }
.panel-action:hover { opacity: 0.7; }
.progress-list { display: flex; flex-direction: column; gap: 1.25rem; }
.prog-header { display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 8px; color: #9ca3af; }
.prog-track { background: #1a2e1a; height: 8px; border-radius: 4px; overflow: hidden; }
.prog-fill { height: 100%; border-radius: 4px; transition: width 1s ease; }
.side-panels { display: flex; flex-direction: column; gap: 1rem; }
.alerts-list { display: flex; flex-direction: column; gap: 8px; }
.alert-item { display: flex; align-items: center; gap: 10px; background: #172110; border: 1px solid #1e3020; border-radius: 12px; padding: 11px 14px; font-size: 0.83rem; }
.alert-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.alert-time { margin-left: auto; font-size: 0.7rem; color: #374151; }
.sensors-list { display: flex; flex-direction: column; gap: 8px; }
.sensor-row { display: flex; justify-content: space-between; align-items: center; padding: 11px 14px; background: #172110; border-radius: 12px; font-size: 0.85rem; }
.sensor-status { display: flex; align-items: center; gap: 7px; font-size: 0.78rem; font-weight: 500; }
.dot { width: 7px; height: 7px; border-radius: 50%; }
.dot-glow { box-shadow: 0 0 6px rgba(74,222,128,0.6); }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal { background: #111a14; border: 1px solid #1e3020; border-radius: 24px; padding: 2rem; width: 100%; max-width: 480px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.modal-header h3 { font-family: 'Syne', sans-serif; font-size: 1.3rem; font-weight: 800; }
.modal-close { background: none; border: none; color: #6b7280; font-size: 20px; cursor: pointer; }
.field { margin-bottom: 1rem; }
.field label { display: block; font-size: 0.82rem; color: #9ca3af; margin-bottom: 6px; }
.field input { width: 100%; background: #172110; border: 1px solid #1e3020; color: #f0fdf4; padding: 10px 14px; border-radius: 10px; font-size: 0.9rem; font-family: 'DM Sans', sans-serif; outline: none; }
.field input:focus { border-color: #4ade80; }
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.modal-actions { display: flex; gap: 10px; margin-top: 1.5rem; }
.btn-outline-lg { flex: 1; background: transparent; border: 1px solid #1e3020; color: #9ca3af; padding: 12px; border-radius: 12px; font-size: 0.9rem; cursor: pointer; font-family: 'DM Sans', sans-serif; }
.btn-primary-lg { flex: 1; background: #4ade80; color: #0a0f0d; border: none; padding: 12px; border-radius: 12px; font-size: 0.9rem; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; }
</style>
