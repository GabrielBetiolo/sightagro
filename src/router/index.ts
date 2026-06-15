// ============================================================================
// ROTAS DA APLICAÇÃO (Vue Router)
// ============================================================================
// - Rotas públicas (acessíveis sem login): landing, login, registro, etc.
// - Rotas privadas (sob /app/*): exigem token de autenticação válido.
// ============================================================================

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    // ---------------- ROTAS PÚBLICAS ----------------
    { path: '/', name: 'Landing', component: () => import('../views/LandingView.vue'), meta: { public: true } },
    { path: '/login', name: 'Login', component: () => import('../views/LoginView.vue'), meta: { public: true } },
    { path: '/register', name: 'Register', component: () => import('../views/RegisterView.vue'), meta: { public: true } },
    { path: '/forgot-password', name: 'ForgotPassword', component: () => import('../views/ForgotPasswordView.vue'), meta: { public: true } },
    { path: '/reset-password', name: 'ResetPassword', component: () => import('../views/ResetPasswordView.vue'), meta: { public: true } },

    // ---------------- ROTAS PRIVADAS (painel) ----------------
    {
      path: '/app',
      component: () => import('../components/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: '/app/dashboard' },
        { path: 'dashboard', name: 'Dashboard', component: () => import('../views/DashboardView.vue') },
        { path: 'fazendas', name: 'Fazendas', component: () => import('../views/FazendasView.vue') },
        { path: 'sensores', name: 'Sensores', component: () => import('../views/SensoresView.vue') },
        { path: 'irrigacao', name: 'Irrigacao', component: () => import('../views/IrrigacaoView.vue') },
        { path: 'relatorios', name: 'Relatorios', component: () => import('../views/RelatoriosView.vue') },
        { path: 'alertas', name: 'Alertas', component: () => import('../views/AlertasView.vue') },
        { path: 'documentos', name: 'Documentos', component: () => import('../views/DocumentosView.vue') },
        { path: 'financeiro', name: 'Financeiro', component: () => import('../views/FinanceiroView.vue') }, // NOVO
        { path: 'assistente', name: 'Assistente', component: () => import('../views/AssistenteView.vue') },
        { path: 'planos', name: 'Planos', component: () => import('../views/PlanosView.vue') },
        { path: 'perfil', name: 'Perfil', component: () => import('../views/PerfilView.vue') },
      ]
    },

    // Qualquer rota desconhecida volta para a landing page
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
})

// Guard global: protege rotas privadas e redireciona usuários já logados
// que tentam acessar páginas públicas (exceto a landing)
router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.token) return { name: 'Login' }
  if (to.meta.public && auth.token && to.name !== 'Landing') return { path: '/app/dashboard' }
})

export default router
