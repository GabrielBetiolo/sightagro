/**
 * router/index.ts — SightAgro (versão completa com Mapa)
 */

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const LandingView        = () => import('../views/LandingView.vue')
const LoginView          = () => import('../views/LoginView.vue')
const RegisterView       = () => import('../views/RegisterView.vue')
const ForgotPasswordView = () => import('../views/ForgotPasswordView.vue')
const ResetPasswordView  = () => import('../views/ResetPasswordView.vue')

const AppLayout          = () => import('../components/AppLayout.vue')
const DashboardView      = () => import('../views/DashboardView.vue')
const FazendasView       = () => import('../views/FazendasView.vue')
const SensoresView       = () => import('../views/SensoresView.vue')
const IrrigacaoView      = () => import('../views/IrrigacaoView.vue')
const AlertasView        = () => import('../views/AlertasView.vue')
const RelatoriosView     = () => import('../views/RelatoriosView.vue')
const PerfilView         = () => import('../views/PerfilView.vue')
const PlanosView         = () => import('../views/PlanosView.vue')
const AssistenteView     = () => import('../views/AssistenteView.vue')
const DocumentosView     = () => import('../views/DocumentosView.vue')
const FinanceiroView     = () => import('../views/FinanceiroView.vue')
const ColaboradoresView  = () => import('../views/ColaboradoresView.vue')
const EstoqueView        = () => import('../views/EstoqueView.vue')
const PecuariaView       = () => import('../views/PecuariaView.vue')
const AquiculturaView    = () => import('../views/AquiculturaView.vue')
const PragasView         = () => import('../views/PragasView.vue')
const MapaView           = () => import('../views/MapaView.vue')   // ← NOVO

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/',               component: LandingView },
    { path: '/login',          component: LoginView },
    { path: '/register',       component: RegisterView },
    { path: '/forgot-password',component: ForgotPasswordView },
    { path: '/reset-password', component: ResetPasswordView },

    {
      path: '/app',
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        { path: 'dashboard',     component: DashboardView },
        { path: 'fazendas',      component: FazendasView },
        { path: 'sensores',      component: SensoresView },
        { path: 'irrigacao',     component: IrrigacaoView },
        { path: 'alertas',       component: AlertasView },
        { path: 'relatorios',    component: RelatoriosView },
        { path: 'pragas',        component: PragasView },
        { path: 'mapa',          component: MapaView },        // ← NOVO
        { path: 'documentos',    component: DocumentosView },
        { path: 'financeiro',    component: FinanceiroView },
        { path: 'colaboradores', component: ColaboradoresView },
        { path: 'estoque',       component: EstoqueView },
        { path: 'pecuaria',      component: PecuariaView },
        { path: 'aquicultura',   component: AquiculturaView },
        { path: 'assistente',    component: AssistenteView },
        { path: 'planos',        component: PlanosView },
        { path: 'perfil',        component: PerfilView },
        { path: '', redirect: 'dashboard' },
      ],
    },

    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.token) {
    return { path: '/login' }
  }
})

export default router
