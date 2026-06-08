<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '../composables/useApi'

const sensors = ref<any[]>([])
const fazendas = ref<any[]>([])
const loading = ref(true)
const showModal = ref(false)
const showToken = ref<string | null>(null)
const showInstrucoes = ref<any>(null)
const form = ref({ codigo: '', tipo: 'Temperatura', fazendaId: '' })
const criando = ref(false)

const tipos = ['Temperatura', 'Umidade', 'Solo', 'Irrigação', 'Luminosidade', 'pH', 'CO2', 'Pressão']
const statusColor: Record<string, string> = { online: '#4ade80', offline: '#f87171', unstable: '#facc15' }
const statusLabel: Record<string, string> = { online: 'Online', offline: 'Offline', unstable: 'Instável' }

async function fetchDados() {
  loading.value = true
  try {
    const [s, f] = await Promise.all([api.get('/sensores'), api.get('/fazendas')])
    sensors.value = s
    fazendas.value = f
    if (f.length > 0 && !form.value.fazendaId) form.value.fazendaId = f[0].id
  } finally { loading.value = false }
}

async function criarSensor() {
  if (!form.value.codigo || !form.value.fazendaId) return
  criando.value = true
  try {
    const sensor = await api.post('/sensores', {
      codigo: form.value.codigo,
      tipo: form.value.tipo,
      fazendaId: Number(form.value.fazendaId)
    })
    showModal.value = false
    showToken.value = sensor.token
    form.value = { codigo: '', tipo: 'Temperatura', fazendaId: fazendas.value[0]?.id || '' }
    await fetchDados()
  } finally { criando.value = false }
}

async function deletarSensor(id: number) {
  if (!confirm('Deletar este sensor? Todas as leituras serão removidas.')) return
  await api.delete(`/sensores/${id}`)
  await fetchDados()
}

async function regenerarToken(id: number) {
  const s = await api.post(`/sensores/${id}/regenerar-token`, {})
  showToken.value = s.token
  await fetchDados()
}

function bateriaColor(v: number) {
  if (v >= 60) return '#4ade80'
  if (v >= 30) return '#facc15'
  return '#f87171'
}

onMounted(fetchDados)
</script>

<template>
  <div class="page">
    <div class="header">
      <div>
        <h1 class="page-title">Sensores</h1>
        <p class="page-sub">{{ sensors.filter(s=>s.status==='online').length }} de {{ sensors.length }} online</p>
      </div>
      <button class="btn-primary" @click="showModal = true" :disabled="fazendas.length === 0">
        <i class="ti ti-plus"></i> Novo Sensor
      </button>
    </div>

    <!-- AVISO SEM FAZENDAS -->
    <div v-if="!loading && fazendas.length === 0" class="alert-info">
      <i class="ti ti-info-circle"></i>
      Cadastre uma fazenda antes de adicionar sensores.
    </div>

    <!-- LOADING -->
    <div v-if="loading" class="loading-state">
      <i class="ti ti-loader-2 spin"></i> Carregando sensores...
    </div>

    <!-- EMPTY -->
    <div v-else-if="sensors.length === 0 && fazendas.length > 0" class="empty-state">
      <div class="empty-icon"><i class="ti ti-activity"></i></div>
      <h3>Nenhum sensor cadastrado</h3>
      <p>Adicione um sensor para começar a monitorar sua fazenda em tempo real.</p>
      <button class="btn-primary" @click="showModal = true"><i class="ti ti-plus"></i> Adicionar sensor</button>
    </div>

    <!-- TABELA -->
    <div v-else-if="sensors.length > 0" class="table-wrap">
      <table>
        <thead>
          <tr><th>Código</th><th>Fazenda</th><th>Tipo</th><th>Última leitura</th><th>Bateria</th><th>Status</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="s in sensors" :key="s.id">
            <td><code>{{ s.codigo }}</code></td>
            <td>{{ s.fazenda?.nome || '—' }}</td>
            <td>{{ s.tipo }}</td>
            <td class="muted">
              {{ s.leituras?.[0] ? `${s.leituras[0].valor} ${s.leituras[0].unidade}` : '—' }}
              <div v-if="s.ultimaLeitura" style="font-size:0.7rem;color:var(--muted)">
                {{ new Date(s.ultimaLeitura).toLocaleString('pt-BR') }}
              </div>
            </td>
            <td>
              <div class="bat-wrap">
                <div class="bat-bar"><div :style="`width:${s.bateria}%;background:${bateriaColor(s.bateria)}`"></div></div>
                <span :style="`color:${bateriaColor(s.bateria)};font-size:0.78rem`">{{ s.bateria }}%</span>
              </div>
            </td>
            <td>
              <span class="status-pill" :style="`background:${statusColor[s.status]}22;color:${statusColor[s.status]}`">
                {{ statusLabel[s.status] }}
              </span>
            </td>
            <td>
              <div style="display:flex;gap:4px">
                <button class="icon-btn" title="Ver instruções" @click="showInstrucoes = s"><i class="ti ti-code"></i></button>
                <button class="icon-btn" title="Regenerar token" @click="regenerarToken(s.id)"><i class="ti ti-refresh"></i></button>
                <button class="icon-btn danger" title="Deletar" @click="deletarSensor(s.id)"><i class="ti ti-trash"></i></button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- MODAL NOVO SENSOR -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>Novo Sensor</h3>
          <button class="modal-close" @click="showModal = false"><i class="ti ti-x"></i></button>
        </div>
        <div class="field">
          <label>Código do sensor *</label>
          <input v-model="form.codigo" type="text" placeholder="Ex: TEMP-01" />
        </div>
        <div class="field">
          <label>Tipo</label>
          <select v-model="form.tipo" class="select-input">
            <option v-for="t in tipos" :key="t">{{ t }}</option>
          </select>
        </div>
        <div class="field">
          <label>Fazenda</label>
          <select v-model="form.fazendaId" class="select-input">
            <option v-for="f in fazendas" :key="f.id" :value="f.id">{{ f.nome }}</option>
          </select>
        </div>
        <div class="modal-actions">
          <button class="btn-outline-lg" @click="showModal = false">Cancelar</button>
          <button class="btn-primary-lg" @click="criarSensor" :disabled="criando">
            <i v-if="criando" class="ti ti-loader-2 spin"></i>
            <span v-else>Criar Sensor</span>
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL TOKEN -->
    <div v-if="showToken" class="modal-overlay" @click.self="showToken = null">
      <div class="modal">
        <div class="modal-header">
          <h3>Token do Sensor</h3>
          <button class="modal-close" @click="showToken = null"><i class="ti ti-x"></i></button>
        </div>
        <div class="token-box">
          <i class="ti ti-key" style="color:var(--green);font-size:2rem;margin-bottom:0.75rem"></i>
          <p style="font-size:0.85rem;color:var(--text3);margin-bottom:1rem">
            Guarde este token com segurança. Ele será usado pelo hardware para enviar leituras.
          </p>
          <code class="token-code">{{ showToken }}</code>
          <button class="btn-copy" @click="navigator.clipboard.writeText(showToken!)">
            <i class="ti ti-copy"></i> Copiar token
          </button>
        </div>
        <div class="info-box">
          <strong>Endpoint para enviar leituras:</strong>
          <code>POST {{ $env?.VITE_API_URL || 'https://sightagro-backend.onrender.com' }}/sensores/data</code>
          <pre style="font-size:0.75rem;margin-top:8px;color:var(--text2)">{{ JSON.stringify({ token: showToken, valor: 24.5, unidade: '°C', bateria: 85 }, null, 2) }}</pre>
        </div>
        <button class="btn-primary-lg" style="width:100%;margin-top:1rem" @click="showToken = null">Entendi</button>
      </div>
    </div>

    <!-- MODAL INSTRUÇÕES -->
    <div v-if="showInstrucoes" class="modal-overlay" @click.self="showInstrucoes = null">
      <div class="modal">
        <div class="modal-header">
          <h3>Integrar {{ showInstrucoes.codigo }}</h3>
          <button class="modal-close" @click="showInstrucoes = null"><i class="ti ti-x"></i></button>
        </div>
        <p style="font-size:0.85rem;color:var(--text3);margin-bottom:1rem">
          Use o código abaixo no seu Arduino/ESP32 para enviar leituras:
        </p>
        <div class="code-block">
          <pre>{{ `#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "SUA_REDE";
const char* password = "SUA_SENHA";
const char* token = "${showInstrucoes.token}";

void sendReading(float value, int battery) {
  HTTPClient http;
  http.begin("https://sightagro-backend.onrender.com/sensores/data");
  http.addHeader("Content-Type", "application/json");
  
  String body = "{\\"token\\":\\"" + String(token) + 
                "\\",\\"valor\\":" + String(value) + 
                ",\\"unidade\\":\\"${showInstrucoes.tipo === 'Temperatura' ? '°C' : showInstrucoes.tipo === 'Umidade' ? '%' : 'units'}\\"" +
                ",\\"bateria\\":" + String(battery) + "}";
  
  http.POST(body);
  http.end();
}

void setup() {
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) delay(500);
}

void loop() {
  float reading = /* sua leitura aqui */;
  sendReading(reading, 100);
  delay(30000); // a cada 30s
}` }}</pre>
        </div>
        <button class="btn-primary-lg" style="width:100%;margin-top:1rem" @click="navigator.clipboard.writeText('/* código acima */')">
          <i class="ti ti-copy"></i> Copiar código
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { padding: 2rem; background: var(--bg); min-height: 100vh; color: var(--text); font-family: var(--font-body); }
.header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
.page-title { font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; letter-spacing: -0.03em; }
.page-sub { color: var(--text3); font-size: 0.9rem; margin-top: 4px; }
.btn-primary { background: var(--green); color: #0a0f0d; border: none; padding: 10px 18px; border-radius: 30px; font-family: var(--font-body); font-weight: 700; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 6px; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.alert-info { background: #0e2a2e; border: 1px solid #0e4a5e; color: #22d3ee; padding: 12px 16px; border-radius: 12px; font-size: 0.88rem; display: flex; align-items: center; gap: 8px; margin-bottom: 1rem; }
.loading-state { display: flex; align-items: center; gap: 8px; color: var(--text3); padding: 3rem; justify-content: center; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 4rem 2rem; text-align: center; background: var(--surface); border: 2px dashed var(--border); border-radius: 20px; }
.empty-icon { width: 64px; height: 64px; background: var(--surface2); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 28px; color: var(--text3); }
.empty-state h3 { font-family: var(--font-display); font-size: 1.2rem; font-weight: 800; }
.empty-state p { color: var(--text3); font-size: 0.88rem; max-width: 320px; line-height: 1.6; }
.table-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; overflow: auto; }
table { width: 100%; border-collapse: collapse; font-size: 0.88rem; min-width: 600px; }
thead tr { border-bottom: 1px solid var(--border); }
th { padding: 12px 16px; text-align: left; color: var(--text3); font-weight: 500; font-size: 0.78rem; }
td { padding: 12px 16px; border-bottom: 1px solid var(--surface2); }
tr:last-child td { border-bottom: none; }
code { background: var(--surface2); padding: 2px 8px; border-radius: 6px; font-size: 0.8rem; color: var(--green); }
.muted { color: var(--text3); }
.bat-wrap { display: flex; align-items: center; gap: 8px; }
.bat-bar { flex: 1; background: var(--surface2); height: 5px; border-radius: 4px; overflow: hidden; min-width: 50px; }
.bat-bar div { height: 100%; border-radius: 4px; }
.status-pill { font-size: 0.72rem; padding: 3px 10px; border-radius: 20px; font-weight: 500; }
.icon-btn { background: none; border: none; color: var(--text3); cursor: pointer; font-size: 16px; padding: 4px 6px; border-radius: 6px; transition: all 0.2s; }
.icon-btn:hover { background: var(--surface2); color: var(--text); }
.icon-btn.danger:hover { color: var(--red); background: #1a0a0a; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 1rem; }
.modal { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 1.75rem; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
.modal-header h3 { font-family: var(--font-display); font-size: 1.2rem; font-weight: 800; }
.modal-close { background: none; border: none; color: var(--text3); font-size: 20px; cursor: pointer; }
.field { margin-bottom: 1rem; }
.field label { display: block; font-size: 0.82rem; color: var(--text2); margin-bottom: 5px; }
.field input, .select-input { width: 100%; background: var(--surface2); border: 1px solid var(--border); color: var(--text); padding: 10px 14px; border-radius: 10px; font-size: 0.9rem; font-family: var(--font-body); outline: none; }
.field input:focus, .select-input:focus { border-color: var(--green); }
.modal-actions { display: flex; gap: 10px; margin-top: 1.5rem; }
.btn-outline-lg { flex: 1; background: transparent; border: 1px solid var(--border); color: var(--text2); padding: 11px; border-radius: 10px; font-size: 0.9rem; cursor: pointer; font-family: var(--font-body); }
.btn-primary-lg { flex: 1; background: var(--green); color: #0a0f0d; border: none; padding: 11px; border-radius: 10px; font-size: 0.9rem; font-weight: 700; cursor: pointer; font-family: var(--font-body); display: flex; align-items: center; justify-content: center; gap: 6px; }
.token-box { display: flex; flex-direction: column; align-items: center; text-align: center; background: var(--surface2); border-radius: 14px; padding: 1.5rem; margin-bottom: 1rem; }
.token-code { word-break: break-all; font-size: 0.78rem; color: var(--green); background: #0f2e17; padding: 10px 14px; border-radius: 8px; margin-bottom: 0.75rem; width: 100%; text-align: left; }
.btn-copy { background: var(--surface); border: 1px solid var(--border); color: var(--text); padding: 7px 14px; border-radius: 8px; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; gap: 5px; font-family: var(--font-body); }
.info-box { background: var(--surface2); border-radius: 12px; padding: 1rem; font-size: 0.8rem; }
.info-box strong { display: block; margin-bottom: 6px; color: var(--text2); }
.info-box code { display: block; margin-top: 4px; color: var(--cyan); word-break: break-all; }
.code-block { background: #0d1117; border-radius: 12px; padding: 1rem; overflow-x: auto; }
.code-block pre { font-size: 0.72rem; color: #e6edf3; line-height: 1.6; white-space: pre-wrap; }
.spin { animation: spin 1s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 640px) { .page { padding: 1rem; } }
</style>
