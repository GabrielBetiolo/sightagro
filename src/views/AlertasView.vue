<script setup lang="ts">
import { ref, computed } from 'vue'

type Tipo = 'info' | 'warning' | 'danger' | 'success'

const filtro = ref<'todos' | Tipo>('todos')
const alertas = ref([
  { id: 1, tipo: 'info' as Tipo, titulo: 'Chuva prevista amanhã', desc: 'Previsão de 12mm entre 14h e 18h na região da Fazenda São João.', time: '08:30', lido: false },
  { id: 2, tipo: 'success' as Tipo, titulo: 'Trator setor A finalizado', desc: 'Operação de aração concluída com sucesso no setor A.', time: '07:12', lido: false },
  { id: 3, tipo: 'success' as Tipo, titulo: 'Irrigação automática ativada', desc: 'Sistema de irrigação iniciado automaticamente conforme agendamento.', time: '06:45', lido: true },
  { id: 4, tipo: 'warning' as Tipo, titulo: 'Umidade abaixo do ideal', desc: 'Sensor B4 registrou umidade de 42% — abaixo do limite de 55%.', time: '05:20', lido: false },
  { id: 5, tipo: 'danger' as Tipo, titulo: 'Sensor C2 offline', desc: 'Sensor C2 da Fazenda Aurora não responde há 3 horas.', time: '03:00', lido: false },
  { id: 6, tipo: 'warning' as Tipo, titulo: 'Bateria baixa — Sensor D8', desc: 'Bateria do sensor D8 em 12%. Substitua em breve.', time: 'Ontem', lido: true },
])

const filtrados = computed(() =>
  filtro.value === 'todos' ? alertas.value : alertas.value.filter(a => a.tipo === filtro.value)
)

function marcarLido(id: number) {
  const a = alertas.value.find(x => x.id === id)
  if (a) a.lido = true
}

const color: Record<Tipo, string> = { info: '#22d3ee', success: '#4ade80', warning: '#facc15', danger: '#f87171' }
const iconMap: Record<Tipo, string> = { info: 'ti-info-circle', success: 'ti-circle-check', warning: 'ti-alert-triangle', danger: 'ti-alert-circle' }
</script>

<template>
  <div class="page">
    <div class="header">
      <div>
        <h1 class="page-title">Alertas</h1>
        <p class="page-sub">{{ alertas.filter(a=>!a.lido).length }} não lidos</p>
      </div>
      <button class="btn-ghost" @click="alertas.forEach(a => a.lido = true)">Marcar todos como lidos</button>
    </div>

    <div class="filtros">
      <button v-for="f in ['todos','info','success','warning','danger']" :key="f"
        class="filtro-btn" :class="{ active: filtro === f }" @click="filtro = f as any">
        {{ f === 'todos' ? 'Todos' : f === 'info' ? 'Info' : f === 'success' ? 'Sucesso' : f === 'warning' ? 'Atenção' : 'Crítico' }}
      </button>
    </div>

    <div class="alerts-list">
      <div v-for="a in filtrados" :key="a.id"
        class="alert-card" :class="{ unread: !a.lido }"
        :style="`--c:${color[a.tipo]}`">
        <div class="alert-icon" :style="`background:${color[a.tipo]}22;color:${color[a.tipo]}`">
          <i :class="['ti', iconMap[a.tipo]]"></i>
        </div>
        <div class="alert-body">
          <div class="alert-title">{{ a.titulo }}</div>
          <div class="alert-desc">{{ a.desc }}</div>
        </div>
        <div class="alert-right">
          <span class="alert-time">{{ a.time }}</span>
          <button v-if="!a.lido" class="mark-btn" @click="marcarLido(a.id)">Marcar lido</button>
        </div>
      </div>
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
.btn-ghost { background: none; border: 1px solid #1e3020; color: #9ca3af; padding: 9px 18px; border-radius: 10px; font-size: 0.85rem; cursor: pointer; font-family: 'DM Sans', sans-serif; }
.filtros { display: flex; gap: 8px; margin-bottom: 1.5rem; }
.filtro-btn { background: #111a14; border: 1px solid #1e3020; color: #6b7280; padding: 7px 16px; border-radius: 20px; font-size: 0.82rem; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s; }
.filtro-btn.active, .filtro-btn:hover { border-color: #4ade80; color: #4ade80; }
.alerts-list { display: flex; flex-direction: column; gap: 10px; }
.alert-card { background: #111a14; border: 1px solid #1e3020; border-radius: 16px; padding: 1.25rem 1.5rem; display: flex; align-items: center; gap: 1rem; transition: border-color 0.2s; }
.alert-card.unread { border-left: 3px solid var(--c); }
.alert-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
.alert-body { flex: 1; }
.alert-title { font-weight: 500; font-size: 0.9rem; margin-bottom: 3px; }
.alert-desc { font-size: 0.82rem; color: #6b7280; line-height: 1.4; }
.alert-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
.alert-time { font-size: 0.75rem; color: #4b5563; white-space: nowrap; }
.mark-btn { background: none; border: 1px solid #1e3020; color: #9ca3af; padding: 4px 10px; border-radius: 8px; font-size: 0.75rem; cursor: pointer; white-space: nowrap; font-family: 'DM Sans', sans-serif; }
.mark-btn:hover { border-color: #4ade80; color: #4ade80; }
</style>
