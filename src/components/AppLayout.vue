<script setup lang="ts">
/**
 * AppLayout.vue — Layout principal com sidebar completa (inclui Mapa)
 */

import { ref } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useThemeStore } from '../stores/theme'

const auth   = useAuthStore()
const theme  = useThemeStore()
const route  = useRoute()
const router = useRouter()

const sidebarAberta = ref(false)

const navItems = [
  { path: '/app/dashboard',     icon: '🏠', label: 'Dashboard'     },
  { path: '/app/fazendas',      icon: '🌾', label: 'Fazendas'      },
  { path: '/app/mapa',          icon: '🗺️',  label: 'Mapa'          }, // ← NOVO
  { path: '/app/sensores',      icon: '📡', label: 'Sensores'      },
  { path: '/app/irrigacao',     icon: '💧', label: 'Irrigação'     },
  { path: '/app/alertas',       icon: '🔔', label: 'Alertas'       },
  { path: '/app/relatorios',    icon: '📊', label: 'Relatórios'    },
  { path: '/app/pragas',        icon: '🐛', label: 'Pragas'        },
  { path: '/app/documentos',    icon: '📄', label: 'Documentos'    },
  { path: '/app/financeiro',    icon: '💰', label: 'Financeiro'    },
  { path: '/app/colaboradores', icon: '👥', label: 'Colaboradores' },
  { path: '/app/estoque',       icon: '📦', label: 'Estoque'       },
  { path: '/app/pecuaria',      icon: '🐄', label: 'Pecuária'      },
  { path: '/app/aquicultura',   icon: '🐟', label: 'Aquicultura'   },
  { path: '/app/assistente',    icon: '🤖', label: 'Assistente IA' },
  { path: '/app/planos',        icon: '💎', label: 'Planos'        },
  { path: '/app/perfil',        icon: '👤', label: 'Perfil'        },
]

// Bottom nav mobile — os mais usados
const bottomNavItems = [
  { path: '/app/dashboard', icon: '🏠', label: 'Home'    },
  { path: '/app/alertas',   icon: '🔔', label: 'Alertas' },
  { path: '/app/mapa',      icon: '🗺️',  label: 'Mapa'   },  // ← NOVO
  { path: '/app/fazendas',  icon: '🌾', label: 'Fazendas'},
  { path: '/app/assistente',icon: '🤖', label: 'IA'      },
]

function isActive(path: string) {
  return route.path === path || route.path.startsWith(path + '/')
}

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <div :class="['flex h-screen overflow-hidden', theme.isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900']">

    <!-- Overlay mobile -->
    <div v-if="sidebarAberta" class="fixed inset-0 bg-black/50 z-20 md:hidden" @click="sidebarAberta = false" />

    <!-- ── Sidebar ────────────────────────────────────────────────────── -->
    <aside :class="[
      'fixed md:static inset-y-0 left-0 z-30 flex flex-col w-64 border-r overflow-y-auto transition-transform duration-300',
      theme.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
      sidebarAberta ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
    ]">
      <div class="flex items-center gap-3 p-5 border-b border-gray-700/50">
        <span class="text-2xl">🌿</span>
        <div>
          <p class="font-bold text-green-400 leading-none">SightAgro</p>
          <p class="text-xs text-gray-400">Gestão Rural</p>
        </div>
      </div>

      <nav class="flex-1 py-4 px-3 space-y-0.5">
        <RouterLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          @click="sidebarAberta = false"
          :class="[
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
            isActive(item.path)
              ? 'bg-green-600/20 text-green-400 border border-green-500/30'
              : theme.isDark ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-gray-100',
          ]"
        >
          <span class="text-base">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="p-4 border-t border-gray-700/50 space-y-2">
        <button
          @click="theme.toggle()"
          :class="['w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all', theme.isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100']"
        >
          <span>{{ theme.isDark ? '☀️' : '🌙' }}</span>
          <span>{{ theme.isDark ? 'Modo Claro' : 'Modo Escuro' }}</span>
        </button>
        <button
          @click="logout"
          class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-all"
        >
          <span>🚪</span><span>Sair</span>
        </button>
      </div>
    </aside>

    <!-- ── Conteúdo ───────────────────────────────────────────────────── -->
    <div class="flex-1 flex flex-col min-h-0 overflow-hidden">
      <header :class="['flex items-center justify-between px-4 py-3 border-b md:hidden', theme.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200']">
        <button @click="sidebarAberta = !sidebarAberta" class="text-2xl">☰</button>
        <span class="font-bold text-green-400">🌿 SightAgro</span>
        <RouterLink to="/app/perfil" class="text-xl">👤</RouterLink>
      </header>

      <!-- O mapa precisa de h-full, por isso usamos h-full no RouterView -->
      <main class="flex-1 overflow-y-auto pb-20 md:pb-0 [&_.mapa-fullheight]:!h-full">
        <RouterView />
      </main>
    </div>

    <!-- ── Bottom nav mobile ──────────────────────────────────────────── -->
    <nav :class="['fixed bottom-0 left-0 right-0 z-20 flex md:hidden border-t', theme.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200']">
      <RouterLink
        v-for="item in bottomNavItems"
        :key="item.path"
        :to="item.path"
        :class="['flex-1 flex flex-col items-center justify-center py-2 text-xs transition-colors', isActive(item.path) ? 'text-green-400' : theme.isDark ? 'text-gray-400' : 'text-gray-500']"
      >
        <span class="text-xl mb-0.5">{{ item.icon }}</span>
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>
  </div>
</template>
