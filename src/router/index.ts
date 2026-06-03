import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/LoginView.vue'),
      meta: { public: true }
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('../views/RegisterView.vue'),
      meta: { public: true }
    },
    {
      path: '/',
      component: () => import('../components/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: '/dashboard'
        },
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('../views/DashboardView.vue')
        },
        {
          path: 'fazendas',
          name: 'Fazendas',
          component: () => import('../views/FazendasView.vue')
        },
        {
          path: 'sensores',
          name: 'Sensores',
          component: () => import('../views/SensoresView.vue')
        },
        {
          path: 'irrigacao',
          name: 'Irrigacao',
          component: () => import('../views/IrrigacaoView.vue')
        },
        {
          path: 'relatorios',
          name: 'Relatorios',
          component: () => import('../views/RelatoriosView.vue')
        },
        {
          path: 'alertas',
          name: 'Alertas',
          component: () => import('../views/AlertasView.vue')
        },
        {
          path: 'perfil',
          name: 'Perfil',
          component: () => import('../views/PerfilView.vue')
        }
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/dashboard'
    }
  ]
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (!to.meta.public && !auth.token) {
    return { name: 'Login' }
  }
  if (to.meta.public && auth.token) {
    return { name: 'Dashboard' }
  }
})

export default router
