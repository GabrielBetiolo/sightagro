<script setup lang="ts">
import { ref } from 'vue'

const sensors = ref([
  { id: 'A1', fazenda: 'Fazenda São João', tipo: 'Temperatura', valor: '24°C', bateria: 92, status: 'online', ultima: '2min atrás' },
  { id: 'B4', fazenda: 'Fazenda São João', tipo: 'Umidade', valor: '78%', bateria: 67, status: 'online', ultima: '1min atrás' },
  { id: 'C2', fazenda: 'Fazenda Aurora', tipo: 'Solo', valor: '--', bateria: 12, status: 'offline', ultima: '3h atrás' },
  { id: 'D8', fazenda: 'Fazenda Boa Esperança', tipo: 'Irrigação', valor: '4.2 L/m', bateria: 45, status: 'unstable', ultima: '8min atrás' },
  { id: 'E3', fazenda: 'Fazenda Aurora', tipo: 'Temperatura', valor: '26°C', bateria: 88, status: 'online', ultima: 'agora' },
  { id: 'F1', fazenda: 'Fazenda São João', tipo: 'Luminosidade', valor: '8400 lux', bateria: 73, status: 'online', ultima: '30s atrás' },
])

const statusColor: Record<string, string> = { online: '#4ade80', offline: '#f87171', unstable: '#facc15' }
const statusLabel: Record<string, string> = { online: 'Online', offline: 'Offline', unstable: 'Instável' }

function bateriaColor(v: number) {
  if (v >= 60) return '#4ade80'
  if (v >= 30) return '#facc15'
  return '#f87171'
}
</script>

<template>
  <div class="page">
    <div class="header">
      <div>
        <h1 class="page-title">Sensores</h1>
        <p class="page-sub">{{ sensors.filter(s=>s.status==='online').length }} de {{ sensors.length }} online</p>
      </div>
      <button class="btn-primary"><i class="ti ti-plus"></i> Novo Sensor</button>
    </div>

    <div class="summary-cards">
      <div class="sum-card"><strong>{{ sensors.filter(s=>s.status==='online').length }}</strong><span>Online</span></div>
      <div class="sum-card warn"><strong>{{ sensors.filter(s=>s.status==='offline').length }}</strong><span>Offline</span></div>
      <div class="sum-card caution"><strong>{{ sensors.filter(s=>s.status==='unstable').length }}</strong><span>Instáveis</span></div>
      <div class="sum-card"><strong>{{ sensors.length }}</strong><span>Total</span></div>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th><th>Fazenda</th><th>Tipo</th><th>Valor</th><th>Bateria</th><th>Status</th><th>Última leitura</th><th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in sensors" :key="s.id">
            <td><code>{{ s.id }}</code></td>
            <td>{{ s.fazenda }}</td>
            <td>{{ s.tipo }}</td>
            <td><strong>{{ s.valor }}</strong></td>
            <td>
              <div class="bat-wrap">
                <div class="bat-bar"><div :style="`width:${s.bateria}%;background:${bateriaColor(s.bateria)}`"></div></div>
                <span :style="`color:${bateriaColor(s.bateria)}`">{{ s.bateria }}%</span>
              </div>
            </td>
            <td>
              <span class="status-pill" :style="`background:${statusColor[s.status]}22;color:${statusColor[s.status]}`">
                {{ statusLabel[s.status] }}
              </span>
            </td>
            <td class="muted">{{ s.ultima }}</td>
            <td><button class="icon-btn"><i class="ti ti-dots"></i></button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@400;500&display=swap');
@import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css');
.page { padding: 2.5rem; background: #0a0f0d; min-height: 100vh; color: #f0fdf4; font-family: 'DM Sans', sans-serif; }
.header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.75rem; }
.page-title { font-family: 'Syne', sans-serif; font-size: 2.5rem; font-weight: 800; letter-spacing: -0.03em; }
.page-sub { color: #6b7280; font-size: 0.9rem; margin-top: 4px; }
.btn-primary { background: #4ade80; color: #0a0f0d; border: none; padding: 10px 20px; border-radius: 30px; font-family: 'DM Sans', sans-serif; font-weight: 700; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 6px; }
.summary-cards { display: grid; grid-template-columns: repeat(4,1fr); gap: 1rem; margin-bottom: 1.75rem; }
.sum-card { background: #111a14; border: 1px solid #1e3020; border-radius: 16px; padding: 1.25rem 1.5rem; }
.sum-card.warn { border-color: #3b1515; }
.sum-card.caution { border-color: #2a2200; }
.sum-card strong { font-family: 'Syne', sans-serif; font-size: 2rem; font-weight: 800; display: block; }
.sum-card span { font-size: 0.8rem; color: #6b7280; }
.table-wrap { background: #111a14; border: 1px solid #1e3020; border-radius: 20px; overflow: auto; }
table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
thead tr { border-bottom: 1px solid #1e3020; }
th { padding: 14px 18px; text-align: left; color: #6b7280; font-weight: 500; font-size: 0.78rem; letter-spacing: 0.05em; white-space: nowrap; }
td { padding: 14px 18px; border-bottom: 1px solid #172110; }
tr:last-child td { border-bottom: none; }
code { background: #172110; padding: 3px 8px; border-radius: 6px; font-size: 0.8rem; color: #4ade80; }
.muted { color: #4b5563; }
.bat-wrap { display: flex; align-items: center; gap: 8px; }
.bat-bar { flex: 1; background: #1a2e1a; height: 5px; border-radius: 4px; overflow: hidden; min-width: 60px; }
.bat-bar div { height: 100%; border-radius: 4px; }
.status-pill { font-size: 0.72rem; padding: 3px 10px; border-radius: 20px; font-weight: 500; }
.icon-btn { background: none; border: none; color: #4b5563; cursor: pointer; font-size: 18px; padding: 4px; }
</style>
