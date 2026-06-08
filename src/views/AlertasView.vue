<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '../composables/useApi'
import { usePush } from '../composables/usePush'

const { subscribed, loading: pushLoading, subscribe, unsubscribe } = usePush()
const filtro = ref<'todos'|'info'|'warning'|'danger'|'success'>('todos')
const alertas = ref<any[]>([])
const loading = ref(true)

async function fetchAlertas() {
  loading.value = true
  try { alertas.value = await api.get('/alertas') }
  finally { loading.value = false }
}

const filtrados = computed(() =>
  filtro.value === 'todos' ? alertas.value : alertas.value.filter(a => a.tipo === filtro.value)
)

async function marcarLido(id: number) {
  await api.patch(`/alertas/${id}/lido`, {})
  const a = alertas.value.find(x => x.id === id)
  if (a) a.lido = true
}

async function marcarTodos() {
  await api.patch('/alertas/marcar-todos-lidos', {})
  alertas.value.forEach(a => a.lido = true)
}

async function deletar(id: number) {
  await api.delete(`/alertas/${id}`)
  alertas.value = alertas.value.filter(a => a.id !== id)
}

const color: Record<string, string> = { info: '#22d3ee', success: '#4ade80', warning: '#facc15', danger: '#f87171' }
const iconMap: Record<string, string> = { info: 'ti-info-circle', success: 'ti-circle-check', warning: 'ti-alert-triangle', danger: 'ti-alert-circle' }
const labelMap: Record<string, string> = { info: 'Info', success: 'Sucesso', warning: 'Atenção', danger: 'Crítico' }

onMounted(fetchAlertas)
</script>

<template>
  <div class="page">
    <div class="header">
      <div>
        <h1 class="page-title">Alertas</h1>
        <p class="page-sub">{{ alertas.filter(a=>!a.lido).length }} não lidos</p>
      </div>
      <div class="header-actions">
        <button class="btn-push" :class="{ active: subscribed }" @click="subscribed ? unsubscribe() : subscribe()" :disabled="pushLoading">
          <i :class="['ti', subscribed ? 'ti-bell-check' : 'ti-bell']"></i>
          {{ subscribed ? 'Notificações ativas' : 'Ativar notificações' }}
        </button>
        <button class="btn-ghost" @click="marcarTodos">Marcar todos como lidos</button>
      </div>
    </div>

    <div class="filtros">
      <button v-for="f in ['todos','info','success','warning','danger']" :key="f"
        class="filtro-btn" :class="{ active: filtro === f }"
        @click="filtro = f as any">
        {{ f === 'todos' ? 'Todos' : labelMap[f] }}
        <span v-if="f !== 'todos'" class="filtro-count">
          {{ alertas.filter(a => a.tipo === f).length }}
        </span>
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <i class="ti ti-loader-2 spin"></i> Carregando alertas...
    </div>

    <div v-else-if="filtrados.length === 0" class="empty-state">
      <div class="empty-icon"><i class="ti ti-bell-off"></i></div>
      <h3>Nenhum alerta</h3>
      <p>Tudo está funcionando normalmente por aqui.</p>
    </div>

    <div v-else class="alerts-list">
      <div v-for="a in filtrados" :key="a.id"
        class="alert-card" :class="{ unread: !a.lido }"
        :style="`--c:${color[a.tipo]}`">
        <div class="alert-icon" :style="`background:${color[a.tipo]}22;color:${color[a.tipo]}`">
          <i :class="['ti', iconMap[a.tipo]]"></i>
        </div>
        <div class="alert-body">
          <div class="alert-title">{{ a.titulo }}</div>
          <div class="alert-desc">{{ a.descricao }}</div>
          <div class="alert-meta">
            <span class="alert-fazenda"><i class="ti ti-map-pin"></i> {{ a.fazenda?.nome }}</span>
            <span class="alert-time">{{ new Date(a.createdAt).toLocaleString('pt-BR') }}</span>
          </div>
        </div>
        <div class="alert-actions">
          <button v-if="!a.lido" class="mark-btn" @click="marcarLido(a.id)">
            <i class="ti ti-check"></i>
          </button>
          <button class="del-btn" @click="deletar(a.id)">
            <i class="ti ti-trash"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { padding: 2rem; background: var(--bg); min-height: 100vh; color: var(--text); font-family: var(--font-body); }
.header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
.page-title { font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; letter-spacing: -0.03em; }
.page-sub { color: var(--text3); font-size: 0.9rem; margin-top: 4px; }
.header-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.btn-push { background: var(--surface); border: 1px solid var(--border); color: var(--text2); padding: 9px 16px; border-radius: 10px; font-size: 0.85rem; cursor: pointer; font-family: var(--font-body); display: flex; align-items: center; gap: 6px; transition: all 0.2s; }
.btn-push.active { border-color: var(--green); color: var(--green); background: #1a2e1a; }
.btn-ghost { background: none; border: 1px solid var(--border); color: var(--text2); padding: 9px 16px; border-radius: 10px; font-size: 0.85rem; cursor: pointer; font-family: var(--font-body); }
.filtros { display: flex; gap: 8px; margin-bottom: 1.5rem; flex-wrap: wrap; }
.filtro-btn { background: var(--surface); border: 1px solid var(--border); color: var(--text3); padding: 7px 14px; border-radius: 20px; font-size: 0.82rem; cursor: pointer; font-family: var(--font-body); transition: all 0.2s; display: flex; align-items: center; gap: 5px; }
.filtro-btn.active, .filtro-btn:hover { border-color: var(--green); color: var(--green); }
.filtro-count { background: var(--surface2); font-size: 0.7rem; padding: 1px 6px; border-radius: 10px; }
.loading-state { display: flex; align-items: center; gap: 8px; color: var(--text3); padding: 3rem; justify-content: center; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 4rem 2rem; text-align: center; }
.empty-icon { width: 64px; height: 64px; background: var(--surface2); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 28px; color: var(--text3); }
.empty-state h3 { font-family: var(--font-display); font-size: 1.2rem; font-weight: 800; }
.empty-state p { color: var(--text3); font-size: 0.88rem; }
.alerts-list { display: flex; flex-direction: column; gap: 10px; }
.alert-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 1.25rem 1.5rem; display: flex; align-items: flex-start; gap: 1rem; transition: border-color 0.2s; }
.alert-card.unread { border-left: 3px solid var(--c); }
.alert-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
.alert-body { flex: 1; min-width: 0; }
.alert-title { font-weight: 500; font-size: 0.9rem; margin-bottom: 3px; }
.alert-desc { font-size: 0.82rem; color: var(--text3); line-height: 1.4; margin-bottom: 6px; }
.alert-meta { display: flex; gap: 12px; flex-wrap: wrap; }
.alert-fazenda { font-size: 0.75rem; color: var(--text3); display: flex; align-items: center; gap: 3px; }
.alert-time { font-size: 0.75rem; color: var(--muted); }
.alert-actions { display: flex; gap: 4px; flex-shrink: 0; }
.mark-btn, .del-btn { background: none; border: 1px solid var(--border); color: var(--text3); width: 32px; height: 32px; border-radius: 8px; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.mark-btn:hover { border-color: var(--green); color: var(--green); }
.del-btn:hover { border-color: var(--red); color: var(--red); }
.spin { animation: spin 1s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 640px) { .page { padding: 1rem; } .alert-card { flex-wrap: wrap; } }
</style>
