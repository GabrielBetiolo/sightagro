<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { api } from '../composables/useApi'

const auth = useAuthStore()
const messages = ref<{ role: string; content: string }[]>([])
const input = ref('')
const loading = ref(false)
const chatEl = ref<HTMLElement>()
const contexto = ref<any>({})

async function fetchContexto() {
  try {
    const [fazendas, sensores, alertas] = await Promise.all([
      api.get('/fazendas'),
      api.get('/sensores'),
      api.get('/alertas')
    ])
    contexto.value = { fazendas, sensores, alertas: alertas.slice(0, 10) }
  } catch {}
}

async function enviar() {
  if (!input.value.trim() || loading.value) return
  const msg = input.value.trim()
  input.value = ''
  messages.value.push({ role: 'user', content: msg })
  loading.value = true
  await scroll()

  try {
    const systemPrompt = `Você é o assistente agrícola do AgroSmart, um sistema de monitoramento de fazendas. 
Seja direto, prático e use linguagem simples para agricultores brasileiros.
Responda sempre em português do Brasil.

Dados atuais do usuário ${auth.user?.name}:
- Fazendas: ${JSON.stringify(contexto.value.fazendas?.map((f: any) => ({ nome: f.nome, localizacao: f.localizacao, cultura: f.cultura })))}
- Sensores: ${JSON.stringify(contexto.value.sensores?.map((s: any) => ({ codigo: s.codigo, tipo: s.tipo, status: s.status, ultimaLeitura: s.leituras?.[0] })))}
- Alertas recentes: ${JSON.stringify(contexto.value.alertas?.map((a: any) => ({ tipo: a.tipo, titulo: a.titulo, fazenda: a.fazenda?.nome })))}

Responda com base nesses dados reais. Se não tiver informação suficiente, sugira que o usuário adicione sensores ou fazendas.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages: messages.value.map(m => ({ role: m.role, content: m.content }))
      })
    })
    const data = await response.json()
    const resposta = data.content?.[0]?.text || 'Desculpe, não consegui processar sua pergunta.'
    messages.value.push({ role: 'assistant', content: resposta })
  } catch {
    messages.value.push({ role: 'assistant', content: 'Erro ao conectar com o assistente. Tente novamente.' })
  } finally {
    loading.value = false
    await scroll()
  }
}

async function scroll() {
  await nextTick()
  if (chatEl.value) chatEl.value.scrollTop = chatEl.value.scrollHeight
}

function sugestao(text: string) {
  input.value = text
  enviar()
}

onMounted(() => {
  fetchContexto()
  messages.value.push({
    role: 'assistant',
    content: `Olá, ${auth.user?.name?.split(' ')[0]}! 👋 Sou o assistente agrícola do AgroSmart. Posso ajudar com informações sobre suas fazendas, sensores, alertas e recomendações agrícolas. Como posso ajudar?`
  })
})
</script>

<template>
  <div class="assistente">
    <div class="header">
      <div class="header-info">
        <div class="ai-avatar"><i class="ti ti-robot"></i></div>
        <div>
          <h1 class="page-title">Assistente AgroSmart</h1>
          <p class="page-sub">Powered by Claude AI · Dados em tempo real</p>
        </div>
      </div>
    </div>

    <div class="chat-wrap">
      <div class="chat-messages" ref="chatEl">
        <div v-for="(m, i) in messages" :key="i" class="message" :class="m.role">
          <div v-if="m.role === 'assistant'" class="msg-avatar"><i class="ti ti-robot"></i></div>
          <div class="msg-bubble">{{ m.content }}</div>
          <div v-if="m.role === 'user'" class="msg-avatar user-avatar">
            {{ (auth.user?.name || 'U').charAt(0).toUpperCase() }}
          </div>
        </div>
        <div v-if="loading" class="message assistant">
          <div class="msg-avatar"><i class="ti ti-robot"></i></div>
          <div class="msg-bubble typing">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>

      <div class="sugestoes">
        <button v-for="s in ['Como estão meus sensores?','Tem algum alerta crítico?','Devo irrigar hoje?','Resumo das minhas fazendas']"
          :key="s" class="sugestao-btn" @click="sugestao(s)">{{ s }}</button>
      </div>

      <div class="input-area">
        <input
          v-model="input"
          type="text"
          placeholder="Pergunte sobre suas fazendas, sensores ou alertas..."
          @keyup.enter="enviar"
          :disabled="loading"
        />
        <button class="send-btn" @click="enviar" :disabled="loading || !input.trim()">
          <i v-if="!loading" class="ti ti-send"></i>
          <i v-else class="ti ti-loader-2 spin"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.assistente { padding: 2rem; background: var(--bg); min-height: 100vh; color: var(--text); font-family: var(--font-body); display: flex; flex-direction: column; gap: 1.5rem; }
.header { display: flex; justify-content: space-between; align-items: center; }
.header-info { display: flex; align-items: center; gap: 1rem; }
.ai-avatar { width: 48px; height: 48px; background: linear-gradient(135deg, #1a2e1a, #0e2a2e); border: 1px solid var(--green); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 22px; color: var(--green); }
.page-title { font-family: var(--font-display); font-size: 1.8rem; font-weight: 800; letter-spacing: -0.02em; }
.page-sub { color: var(--text3); font-size: 0.82rem; margin-top: 2px; }
.chat-wrap { flex: 1; background: var(--surface); border: 1px solid var(--border); border-radius: 20px; display: flex; flex-direction: column; overflow: hidden; min-height: 0; height: calc(100vh - 200px); }
.chat-messages { flex: 1; overflow-y: auto; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
.message { display: flex; gap: 10px; align-items: flex-end; }
.message.user { flex-direction: row-reverse; }
.msg-avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--surface2); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 14px; color: var(--green); flex-shrink: 0; }
.user-avatar { background: var(--green); color: #0a0f0d; font-family: var(--font-display); font-weight: 800; font-size: 13px; border: none; }
.msg-bubble { background: var(--surface2); border: 1px solid var(--border); border-radius: 16px; padding: 12px 16px; font-size: 0.88rem; line-height: 1.6; max-width: 75%; white-space: pre-wrap; }
.message.user .msg-bubble { background: var(--green); color: #0a0f0d; border-color: var(--green); }
.typing { display: flex; gap: 4px; align-items: center; padding: 14px 18px; }
.typing span { width: 6px; height: 6px; background: var(--text3); border-radius: 50%; animation: bounce 1.2s infinite; }
.typing span:nth-child(2) { animation-delay: 0.2s; }
.typing span:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }
.sugestoes { padding: 0 1.5rem 1rem; display: flex; gap: 8px; flex-wrap: wrap; }
.sugestao-btn { background: var(--surface2); border: 1px solid var(--border); color: var(--text2); padding: 6px 14px; border-radius: 20px; font-size: 0.78rem; cursor: pointer; font-family: var(--font-body); transition: all 0.2s; white-space: nowrap; }
.sugestao-btn:hover { border-color: var(--green); color: var(--green); }
.input-area { padding: 1rem 1.5rem; border-top: 1px solid var(--border); display: flex; gap: 10px; }
.input-area input { flex: 1; background: var(--surface2); border: 1px solid var(--border); color: var(--text); padding: 12px 16px; border-radius: 12px; font-size: 0.9rem; font-family: var(--font-body); outline: none; }
.input-area input:focus { border-color: var(--green); }
.input-area input:disabled { opacity: 0.6; }
.send-btn { background: var(--green); color: #0a0f0d; border: none; width: 44px; height: 44px; border-radius: 12px; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0; }
.send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.send-btn:hover:not(:disabled) { background: var(--green2); }
.spin { animation: spin 1s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 640px) { .assistente { padding: 1rem; } .chat-wrap { height: calc(100vh - 160px); } .msg-bubble { max-width: 90%; } }
</style>
