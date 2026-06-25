<!--
============================================================================
  APP LAYOUT
============================================================================
  Layout principal do painel autenticado (/app/*).
============================================================================
-->
<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useThemeStore } from '../stores/theme'
import { useI18n } from '../composables/useI18n'

const auth = useAuthStore()
const theme = useThemeStore()
const { t } = useI18n()
const route = useRoute()
const sidebarOpen = ref(true)
const mobileOpen = ref(false)

// Itens do menu principal (sidebar desktop)
// NOVO: item "colaboradores" adicionado entre Financeiro e Assistente
const navItems = [
  { path: '/app/dashboard', icon: 'ti-layout-dashboard', key: 'dashboard' },
  { path: '/app/fazendas', icon: 'ti-map', key: 'fazendas' },
  { path: '/app/sensores', icon: 'ti-activity', key: 'sensores' },
  { path: '/app/irrigacao', icon: 'ti-droplet', key: 'irrigacao' },
  { path: '/app/relatorios', icon: 'ti-chart-bar', key: 'relatorios' },
  { path: '/app/alertas', icon: 'ti-bell', key: 'alertas' },
  { path: '/app/documentos', icon: 'ti-file-certificate', key: 'documentos' },
  { path: '/app/financeiro', icon: 'ti-cash', key: 'financeiro' },
  { path: '/app/colaboradores', icon: 'ti-users', key: 'colaboradores' },
  { path: '/app/estoque', icon: 'ti-package', key: 'estoque' },
  { path: '/app/pecuaria', icon: 'ti-paw', key: 'pecuaria' },
  { path: '/app/aquicultura', icon: 'ti-fish', key: 'aquicultura' }, // NOVO
  { path: '/app/assistente', icon: 'ti-robot', key: 'assistente' },
  { path: '/app/planos', icon: 'ti-crown', key: 'planos' },
]

const bottomNavItems = [
  { path: '/app/dashboard', icon: 'ti-layout-dashboard', key: 'dashboard' },
  { path: '/app/fazendas', icon: 'ti-map', key: 'fazendas' },
  { path: '/app/sensores', icon: 'ti-activity', key: 'sensores' },
  { path: '/app/alertas', icon: 'ti-bell', key: 'alertas' },
  { path: '/app/assistente', icon: 'ti-robot', key: 'assistente' },
]

const isActive = (path: string) => route.path === path
</script>

<template>
  <div class="layout">
    <div v-if="mobileOpen" class="mobile-overlay" @click="mobileOpen = false"></div>

    <aside class="sidebar" :class="{ collapsed: !sidebarOpen, 'mobile-open': mobileOpen }">
      <div class="sidebar-top">
        <div class="logo">
          <i class="ti ti-leaf"></i>
          <span v-if="sidebarOpen" class="logo-text">AgroSmart</span>
        </div>
        <button class="collapse-btn desktop-only" @click="sidebarOpen = !sidebarOpen">
          <i :class="['ti', sidebarOpen ? 'ti-chevron-left' : 'ti-chevron-right']"></i>
        </button>
      </div>

      <nav class="nav">
        <RouterLink
          v-for="item in navItems" :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
          @click="mobileOpen = false"
        >
          <i :class="['ti', item.icon]"></i>
          <span v-if="sidebarOpen">{{ t(item.key) }}</span>
          <div v-if="!sidebarOpen" class="tooltip">{{ t(item.key) }}</div>
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <button class="nav-item theme-btn" @click="theme.toggle()">
          <i :class="['ti', theme.dark ? 'ti-sun' : 'ti-moon']"></i>
          <span v-if="sidebarOpen">{{ theme.dark ? t('modo-claro') : t('modo-escuro') }}</span>
        </button>
        <RouterLink to="/app/perfil" class="nav-item" :class="{ active: isActive('/app/perfil') }" @click="mobileOpen = false">
          <div v-if="auth.user?.avatar" class="avatar-sm"><img :src="auth.user.avatar" alt="avatar" /></div>
          <i v-else class="ti ti-user-circle"></i>
          <span v-if="sidebarOpen">{{ t('perfil') }}</span>
        </RouterLink>
        <button class="nav-item logout-btn" @click="auth.logout()">
          <i class="ti ti-logout"></i>
          <span v-if="sidebarOpen">{{ t('sair') }}</span>
        </button>
      </div>
    </aside>

    <div class="main-wrap">
      <header class="mobile-header">
        <button class="hamburger" @click="mobileOpen = !mobileOpen">
          <i class="ti ti-menu-2"></i>
        </button>
        <div class="logo-mobile"><i class="ti ti-leaf"></i> AgroSmart</div>
        <div style="display:flex;gap:8px">
          <button class="icon-btn-header" @click="theme.toggle()">
            <i :class="['ti', theme.dark ? 'ti-sun' : 'ti-moon']"></i>
          </button>
          <RouterLink to="/app/perfil" class="icon-btn-header">
            <div v-if="auth.user?.avatar" class="avatar-xs"><img :src="auth.user.avatar" /></div>
            <i v-else class="ti ti-user-circle"></i>
          </RouterLink>
        </div>
      </header>

      <main class="main-content">
        <RouterView />
      </main>

      <nav class="bottom-nav">
        <RouterLink
          v-for="item in bottomNavItems" :key="item.path"
          :to="item.path"
          class="bottom-nav-item"
          :class="{ active: isActive(item.path) }"
        >
          <i :class="['ti', item.icon]"></i>
          <span>{{ t(item.key) }}</span>
        </RouterLink>
      </nav>
    </div>
  </div>
</template>

<style scoped>
.layout { display: flex; min-height: 100vh; background: var(--bg); color: var(--text); font-family: var(--font-body); }
.mobile-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 49; }
.sidebar { width: 220px; background: var(--surface); border-right: 1px solid var(--border); padding: 1.5rem 1rem; display: flex; flex-direction: column; gap: 1.5rem; transition: width 0.3s; flex-shrink: 0; position: relative; z-index: 50; }
.sidebar.collapsed { width: 68px; }
.sidebar-top { display: flex; align-items: center; justify-content: space-between; }
.logo { font-family: var(--font-display); font-size: 1.1rem; font-weight: 800; color: var(--green); display: flex; align-items: center; gap: 8px; overflow: hidden; }
.logo .ti { font-size: 22px; flex-shrink: 0; }
.logo-text { white-space: nowrap; overflow: hidden; }
.collapse-btn { background: none; border: none; color: var(--text3); cursor: pointer; font-size: 16px; padding: 4px; border-radius: 6px; transition: all 0.2s; flex-shrink: 0; }
.collapse-btn:hover { background: var(--surface2); color: var(--text); }
.nav { display: flex; flex-direction: column; gap: 2px; flex: 1; overflow-y: auto; }
.nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px; font-size: 0.88rem; color: var(--text3); cursor: pointer; transition: all 0.2s; text-decoration: none; white-space: nowrap; background: none; border: none; width: 100%; font-family: var(--font-body); position: relative; overflow: visible; }
.nav-item:hover, .nav-item.active { background: var(--surface2); color: var(--text); }
.nav-item.active { border-left: 2px solid var(--green); color: var(--green); }
.nav-item .ti { font-size: 18px; flex-shrink: 0; }
.tooltip { position: absolute; left: 100%; margin-left: 8px; background: var(--surface); border: 1px solid var(--border); color: var(--text); padding: 4px 10px; border-radius: 6px; font-size: 0.78rem; white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity 0.2s; z-index: 100; }
.nav-item:hover .tooltip { opacity: 1; }
.avatar-sm { width: 22px; height: 22px; border-radius: 50%; overflow: hidden; flex-shrink: 0; }
.avatar-sm img { width: 100%; height: 100%; object-fit: cover; }
.sidebar-footer { display: flex; flex-direction: column; gap: 2px; border-top: 1px solid var(--border); padding-top: 1rem; }
.theme-btn { color: var(--text3); }
.logout-btn { color: var(--red) !important; }
.logout-btn:hover { background: #1a0a0a !important; }
.main-wrap { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.mobile-header { display: none; align-items: center; justify-content: space-between; padding: 0.875rem 1.25rem; background: var(--surface); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 40; }
.hamburger { background: none; border: none; color: var(--text); font-size: 22px; cursor: pointer; }
.logo-mobile { font-family: var(--font-display); font-weight: 800; color: var(--green); display: flex; align-items: center; gap: 6px; font-size: 1rem; }
.icon-btn-header { background: none; border: none; color: var(--text); font-size: 20px; cursor: pointer; width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; text-decoration: none; }
.avatar-xs { width: 28px; height: 28px; border-radius: 50%; overflow: hidden; }
.avatar-xs img { width: 100%; height: 100%; object-fit: cover; }
.main-content { flex: 1; overflow: auto; }
.bottom-nav { display: none; position: fixed; bottom: 0; left: 0; right: 0; background: var(--surface); border-top: 1px solid var(--border); z-index: 40; padding: 0.5rem 0 calc(0.5rem + env(safe-area-inset-bottom)); justify-content: space-around; }
.bottom-nav-item { display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 6px 12px; border-radius: 10px; color: var(--text3); text-decoration: none; font-size: 0.65rem; transition: color 0.2s; min-width: 56px; }
.bottom-nav-item .ti { font-size: 20px; }
.bottom-nav-item.active { color: var(--green); }
@media (max-width: 768px) {
  .sidebar { position: fixed; left: -220px; top: 0; bottom: 0; transition: left 0.3s; height: 100vh; }
  .sidebar.mobile-open { left: 0; }
  .sidebar.collapsed { width: 220px; left: -220px; }
  .sidebar.collapsed.mobile-open { left: 0; width: 220px; }
  .collapse-btn { display: none; }
  .mobile-overlay { display: block; }
  .mobile-header { display: flex; }
  .bottom-nav { display: flex; }
  .main-content { padding-bottom: 70px; }
}
</style>
