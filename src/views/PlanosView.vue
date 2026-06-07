<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { api } from '../composables/useApi'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const loading = ref(false)
const cancelando = ref(false)
const showSuccess = ref(false)
const showCancelConfirm = ref(false)

onMounted(() => {
  if (route.query.status === 'success') showSuccess.value = true
})

const plans = [
  {
    id: 'free',
    name: 'Grátis',
    price: 'R$ 0',
    period: 'para sempre',
    color: '#6b7280',
    features: ['1 fazenda', 'Até 4 sensores', 'Dashboard básico', 'Alertas por e-mail'],
    cta: 'Plano atual',
    highlight: false
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'R$ 49,90',
    period: 'por mês',
    color: '#4ade80',
    features: ['Até 5 fazendas', 'Sensores ilimitados', 'Relatórios completos', 'Suporte prioritário', 'Dados históricos'],
    cta: 'Assinar Pro',
    highlight: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'R$ 149,90',
    period: 'por mês',
    color: '#a78bfa',
    features: ['Fazendas ilimitadas', 'Sensores ilimitados', 'API de integração', 'Multi-usuários', 'Suporte 24/7', 'Onboarding dedicado'],
    cta: 'Assinar Enterprise',
    highlight: false
  }
]

const currentPlan = auth.user?.plan || 'free'

async function assinar(planId: string) {
  if (planId === 'free' || planId === currentPlan) return
  loading.value = true
  try {
    const data = await api.post('/pagamentos/assinar', { planId })
    if (data.init_point) window.location.href = data.init_point
  } catch (e: any) {
    alert(e.message || 'Erro ao iniciar pagamento')
  } finally {
    loading.value = false
  }
}

async function cancelarAssinatura() {
  cancelando.value = true
  try {
    await api.post('/pagamentos/cancelar', {})
    await auth.fetchMe()
    showCancelConfirm.value = false
  } catch (e: any) {
    alert(e.message || 'Erro ao cancelar')
  } finally {
    cancelando.value = false
  }
}

function planLabel(plan: string) {
  if (plan === 'free') return 'Grátis'
  if (plan === 'pro') return 'Pro'
  return 'Enterprise'
}
</script>

<template>
  <div class="page">
    <!-- SUCCESS BANNER -->
    <div v-if="showSuccess" class="success-banner">
      <i class="ti ti-circle-check"></i>
      Pagamento confirmado! Seu plano foi ativado com sucesso.
      <button @click="showSuccess = false"><i class="ti ti-x"></i></button>
    </div>

    <div class="header">
      <h1 class="page-title">Planos</h1>
      <p class="page-sub">Escolha o plano ideal para sua operação</p>
    </div>

    <!-- PLANO ATUAL -->
    <div class="current-plan-banner">
      <div class="cp-info">
        <div class="cp-label">Seu plano atual</div>
        <div class="cp-name">{{ planLabel(currentPlan) }}</div>
        <div v-if="auth.user?.planExpiresAt" class="cp-expires">
          Renova em {{ new Date(auth.user.planExpiresAt).toLocaleDateString('pt-BR') }}
        </div>
      </div>
      <button v-if="currentPlan !== 'free'" class="btn-cancel" @click="showCancelConfirm = true">
        Cancelar assinatura
      </button>
    </div>

    <!-- PLANOS -->
    <div class="plans-grid">
      <div v-for="p in plans" :key="p.id" class="plan-card" :class="{ highlight: p.highlight, current: p.id === currentPlan }">
        <div v-if="p.highlight" class="plan-badge">Mais popular</div>
        <div v-if="p.id === currentPlan" class="current-badge"><i class="ti ti-check"></i> Ativo</div>

        <div class="plan-name">{{ p.name }}</div>
        <div class="plan-price">
          <strong>{{ p.price }}</strong>
          <span>{{ p.period }}</span>
        </div>

        <ul class="plan-features">
          <li v-for="f in p.features" :key="f">
            <i class="ti ti-check" :style="`color:${p.color}`"></i> {{ f }}
          </li>
        </ul>

        <button
          class="plan-cta"
          :style="p.highlight && p.id !== currentPlan ? 'background:#4ade80;color:#0a0f0d' : ''"
          :disabled="p.id === currentPlan || loading"
          @click="assinar(p.id)"
        >
          <i v-if="loading && p.id !== 'free'" class="ti ti-loader-2 spin"></i>
          <span v-else-if="p.id === currentPlan">Plano atual</span>
          <span v-else>{{ p.cta }}</span>
        </button>
      </div>
    </div>

    <!-- COMPARATIVO -->
    <div class="comparison">
      <h3>Comparativo completo</h3>
      <table>
        <thead>
          <tr>
            <th>Recurso</th>
            <th>Grátis</th>
            <th class="highlight-col">Pro</th>
            <th>Enterprise</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in [
            ['Fazendas', '1', '5', 'Ilimitadas'],
            ['Sensores', '4', 'Ilimitados', 'Ilimitados'],
            ['Relatórios', 'Básico', 'Completo', 'Completo'],
            ['Dados históricos', '7 dias', '1 ano', 'Ilimitado'],
            ['Suporte', 'E-mail', 'Prioritário', '24/7'],
            ['API de integração', '—', '—', '✓'],
            ['Multi-usuários', '—', '—', '✓'],
          ]" :key="row[0]">
            <td>{{ row[0] }}</td>
            <td>{{ row[1] }}</td>
            <td class="highlight-col">{{ row[2] }}</td>
            <td>{{ row[3] }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- MODAL CANCELAR -->
    <div v-if="showCancelConfirm" class="modal-overlay" @click.self="showCancelConfirm = false">
      <div class="modal">
        <div class="modal-icon"><i class="ti ti-alert-triangle"></i></div>
        <h3>Cancelar assinatura?</h3>
        <p>Você perderá acesso aos recursos do plano {{ planLabel(currentPlan) }} ao final do período atual.</p>
        <div class="modal-actions">
          <button class="btn-outline" @click="showCancelConfirm = false">Manter plano</button>
          <button class="btn-danger" @click="cancelarAssinatura" :disabled="cancelando">
            <span v-if="cancelando"><i class="ti ti-loader-2 spin"></i></span>
            <span v-else>Confirmar cancelamento</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { padding: 2.5rem; background: var(--bg); min-height: 100vh; color: var(--text); font-family: var(--font-body); }
.success-banner { background: #0f2e17; border: 1px solid var(--green); color: var(--green); padding: 12px 16px; border-radius: 12px; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 10px; font-size: 0.9rem; }
.success-banner button { margin-left: auto; background: none; border: none; color: var(--green); cursor: pointer; font-size: 16px; }
.header { margin-bottom: 2rem; }
.page-title { font-family: var(--font-display); font-size: 2.5rem; font-weight: 800; letter-spacing: -0.03em; }
.page-sub { color: var(--text3); font-size: 0.9rem; margin-top: 4px; }

.current-plan-banner { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
.cp-label { font-size: 0.78rem; color: var(--text3); margin-bottom: 3px; }
.cp-name { font-family: var(--font-display); font-size: 1.2rem; font-weight: 800; color: var(--green); }
.cp-expires { font-size: 0.78rem; color: var(--text3); margin-top: 2px; }
.btn-cancel { background: none; border: 1px solid #3b1515; color: var(--red); padding: 8px 16px; border-radius: 10px; font-size: 0.82rem; cursor: pointer; font-family: var(--font-body); transition: all 0.2s; }
.btn-cancel:hover { background: #1a0a0a; }

.plans-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; margin-bottom: 3rem; }
.plan-card { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 2rem; position: relative; transition: border-color 0.2s; }
.plan-card.highlight { border-color: var(--green); }
.plan-card.current { border-color: var(--green); background: var(--surface2); }
.plan-badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: var(--green); color: #0a0f0d; font-size: 0.72rem; font-weight: 700; padding: 4px 14px; border-radius: 20px; white-space: nowrap; }
.current-badge { display: inline-flex; align-items: center; gap: 4px; background: #1a2e1a; color: var(--green); font-size: 0.72rem; padding: 3px 10px; border-radius: 20px; margin-bottom: 0.75rem; }
.plan-name { font-family: var(--font-display); font-size: 1.2rem; font-weight: 800; margin-bottom: 0.75rem; }
.plan-price strong { font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; }
.plan-price span { font-size: 0.85rem; color: var(--text3); margin-left: 4px; }
.plan-features { list-style: none; margin: 1.5rem 0; display: flex; flex-direction: column; gap: 10px; }
.plan-features li { display: flex; align-items: center; gap: 8px; font-size: 0.88rem; color: var(--text2); }
.plan-cta { width: 100%; background: var(--surface2); border: 1px solid var(--border); color: var(--text); padding: 12px; border-radius: 12px; font-family: var(--font-body); font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; }
.plan-cta:hover:not(:disabled) { opacity: 0.85; }
.plan-cta:disabled { opacity: 0.5; cursor: not-allowed; }

.comparison { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 2rem; }
.comparison h3 { font-family: var(--font-display); font-size: 1.1rem; font-weight: 800; margin-bottom: 1.5rem; }
table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
th { padding: 10px 16px; text-align: left; color: var(--text3); font-size: 0.78rem; border-bottom: 1px solid var(--border); }
td { padding: 12px 16px; border-bottom: 1px solid var(--surface2); color: var(--text2); }
tr:last-child td { border-bottom: none; }
.highlight-col { color: var(--green) !important; font-weight: 500; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal { background: var(--surface); border: 1px solid var(--border); border-radius: 24px; padding: 2rem; width: 100%; max-width: 420px; text-align: center; }
.modal-icon { width: 56px; height: 56px; background: #2a1500; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 24px; color: var(--yellow); margin: 0 auto 1.25rem; }
.modal h3 { font-family: var(--font-display); font-size: 1.3rem; font-weight: 800; margin-bottom: 0.75rem; }
.modal p { color: var(--text3); font-size: 0.9rem; line-height: 1.6; margin-bottom: 1.5rem; }
.modal-actions { display: flex; gap: 10px; }
.btn-outline { flex: 1; background: none; border: 1px solid var(--border); color: var(--text); padding: 12px; border-radius: 12px; font-size: 0.9rem; cursor: pointer; font-family: var(--font-body); }
.btn-danger { flex: 1; background: #7f1d1d; border: none; color: #fca5a5; padding: 12px; border-radius: 12px; font-size: 0.9rem; cursor: pointer; font-family: var(--font-body); }

.spin { animation: spin 1s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .plans-grid { grid-template-columns: 1fr; }
  .current-plan-banner { flex-direction: column; gap: 1rem; align-items: flex-start; }
  .comparison { overflow-x: auto; }
}
</style>
