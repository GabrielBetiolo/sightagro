<script setup lang="ts">
import { ref } from 'vue'

const zones = ref([
  { id: 1, nome: 'Setor A - Soja Norte', ativa: true, valvula: 'aberta', fluxo: '4.2 L/min', proxima: '06:00', duracao: 45 },
  { id: 2, nome: 'Setor B - Soja Sul', ativa: false, valvula: 'fechada', fluxo: '0 L/min', proxima: '08:00', duracao: 30 },
  { id: 3, nome: 'Setor C - Milho', ativa: true, valvula: 'aberta', fluxo: '6.1 L/min', proxima: '10:00', duracao: 60 },
  { id: 4, nome: 'Setor D - Trigo', ativa: false, valvula: 'fechada', fluxo: '0 L/min', proxima: '14:00', duracao: 30 },
])

function toggle(zone: typeof zones.value[0]) {
  zone.ativa = !zone.ativa
  zone.valvula = zone.ativa ? 'aberta' : 'fechada'
  zone.fluxo = zone.ativa ? '4.2 L/min' : '0 L/min'
}
</script>

<template>
  <div class="page">
    <div class="header">
      <div>
        <h1 class="page-title">Irrigação</h1>
        <p class="page-sub">{{ zones.filter(z=>z.ativa).length }} zonas ativas agora</p>
      </div>
      <button class="btn-primary"><i class="ti ti-plus"></i> Nova Zona</button>
    </div>

    <div class="summary">
      <div class="sum-card">
        <i class="ti ti-droplets" style="color:#22d3ee;font-size:22px"></i>
        <div><strong>18.5 L/min</strong><span>Fluxo total</span></div>
      </div>
      <div class="sum-card">
        <i class="ti ti-clock" style="color:#a78bfa;font-size:22px"></i>
        <div><strong>2h 15min</strong><span>Hoje</span></div>
      </div>
      <div class="sum-card">
        <i class="ti ti-calendar" style="color:#4ade80;font-size:22px"></i>
        <div><strong>14.2 m³</strong><span>Esta semana</span></div>
      </div>
    </div>

    <div class="zones-grid">
      <div v-for="z in zones" :key="z.id" class="zone-card" :class="{ active: z.ativa }">
        <div class="zone-top">
          <div class="zone-info">
            <h3>{{ z.nome }}</h3>
            <span class="zone-status" :class="z.ativa ? 'on' : 'off'">
              Válvula {{ z.valvula }}
            </span>
          </div>
          <button class="toggle" :class="{ on: z.ativa }" @click="toggle(z)">
            <span class="toggle-knob"></span>
          </button>
        </div>

        <div class="zone-meta">
          <div class="meta"><i class="ti ti-droplet"></i> {{ z.fluxo }}</div>
          <div class="meta"><i class="ti ti-clock"></i> Próxima: {{ z.proxima }}</div>
          <div class="meta"><i class="ti ti-timer"></i> {{ z.duracao }} min</div>
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
.btn-primary { background: #4ade80; color: #0a0f0d; border: none; padding: 10px 20px; border-radius: 30px; font-family: 'DM Sans', sans-serif; font-weight: 700; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 6px; }
.summary { display: grid; grid-template-columns: repeat(3,1fr); gap: 1rem; margin-bottom: 1.75rem; }
.sum-card { background: #111a14; border: 1px solid #1e3020; border-radius: 16px; padding: 1.25rem 1.5rem; display: flex; align-items: center; gap: 1rem; }
.sum-card strong { display: block; font-family: 'Syne', sans-serif; font-size: 1.4rem; font-weight: 800; }
.sum-card span { font-size: 0.78rem; color: #6b7280; }
.zones-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }
.zone-card { background: #111a14; border: 1px solid #1e3020; border-radius: 20px; padding: 1.5rem; transition: border-color 0.2s; }
.zone-card.active { border-color: #4ade80; }
.zone-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; }
.zone-info h3 { font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 800; margin-bottom: 5px; }
.zone-status { font-size: 0.75rem; padding: 3px 10px; border-radius: 20px; }
.zone-status.on { background: #1a2e1a; color: #4ade80; }
.zone-status.off { background: #1a1a1a; color: #6b7280; }
.toggle { width: 48px; height: 26px; background: #1e3020; border: none; border-radius: 13px; cursor: pointer; position: relative; transition: background 0.2s; flex-shrink: 0; }
.toggle.on { background: #4ade80; }
.toggle-knob { position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; background: white; border-radius: 50%; transition: transform 0.2s; }
.toggle.on .toggle-knob { transform: translateX(22px); background: #0a0f0d; }
.zone-meta { display: flex; flex-direction: column; gap: 8px; }
.meta { display: flex; align-items: center; gap: 8px; font-size: 0.83rem; color: #9ca3af; }
.meta .ti { font-size: 14px; color: #4b5563; }
</style>
