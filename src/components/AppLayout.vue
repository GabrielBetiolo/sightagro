<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useThemeStore } from '../stores/theme'

const auth = useAuthStore()
const theme = useThemeStore()
const route = useRoute()
const sidebarOpen = ref(true)
const mobileOpen = ref(false)

const navItems = [
  { path: '/app/dashboard', icon: 'ti-layout-dashboard', label: 'Dashboard' },
  { path: '/app/fazendas', icon: 'ti-map', label: 'Fazendas' },
  { path: '/app/sensores', icon: 'ti-activity', label: 'Sensores' },
  { path: '/app/irrigacao', icon: 'ti-droplet', label: 'Irrigação' },
  { path: '/app/relatorios', icon: 'ti-chart-bar', label: 'Relatórios' },
  { path: '/app/alertas', icon: 'ti-bell', label: 'Alertas' },
  { path: '/app/planos', icon: 'ti-crown', label: 'Planos' }
]

const isActive = (path: string) => route.path === path
</script>

<template>
  <div class="layout" :class="{ light: !theme.dark }">
    <!-- MOBILE OVERLAY -->
    <div v-if="mobileOpen" class="mobile-overlay" @click="mobileOpen = false"></div>

    <!-- SIDEBAR -->
    <aside class="sidebar" :class="{ collapsed: !sidebarOpen, 'mobile-open': mobileOpen }">
      <div class="sidebar-top">
        <div class="logo">
          <i class="ti ti-leaf"></i>
          <span v-if="sidebarOpen" class="logo-text">AgroSmart</span>
        </div>
        <button class="collapse-btn" @click="sidebarOpen = !sidebarOpen">
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
          <span v-if="sidebarOpen">{{ item.label }}</span>
          <div v-if="!sidebarOpen" class="tooltip">{{ item.label }}</div>
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <button class="nav-item theme-btn" @click="theme.toggle()">
          <i :class="['ti', theme.dark ? 'ti-sun' : 'ti-moon']"></i>
          <span v-if="sidebarOpen">{{ theme.dark ? 'Modo claro' : 'Modo escuro' }}</span>
        </button>
        <RouterLink to="/app/perfil" class="nav-item" :class="{ active: isActive('/app/perfil') }" @click="mobileOpen = false">
          <div v-if="auth.user?.avatar" class="avatar-sm">
            <img :src="auth.user.avatar" alt="avatar" />
          </div>
          <i v-else class="ti ti-user-circle"></i>
          <span v-if="sidebarOpen">{{ auth.user?.name || 'Perfil' }}</span>
        </RouterLink>
        <button class="nav-item logout-btn" @click="auth.logout()">
          <i class="ti ti-logout"></i>
          <span v-if="sidebarOpen">Sair</span>
        </button>
      </div>
    </aside>

    <!-- MAIN -->
    <div class="main-wrap">
      <!-- MOBILE HEADER -->
      <header class="mobile-header">
        <button class="hamburger" @click="mobileOpen = !mobileOpen">
          <i class="ti ti-menu-2"></i>
        </button>
        <div class="logo-mobile"><i class="ti ti-leaf"></i> AgroSmart</div>
        <button class="theme-toggle-mobile" @click="theme.toggle()">
          <i :class="['ti', theme.dark ? 'ti-sun' : 'ti-moon']"></i>
        </button>
      </header>

      <main class="main-content">
        <RouterView />
      </main>
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

.nav { display: flex; flex-direction: column; gap: 2px; flex: 1; }
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
.theme-btn:hover { background: var(--surface2); color: var(--text); }
.logout-btn { color: var(--red) !important; }
.logout-btn:hover { background: #1a0a0a !important; }

.main-wrap { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.mobile-header { display: none; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; background: var(--surface); border-bottom: 1px solid var(--border); }
.hamburger, .theme-toggle-mobile { background: none; border: none; color: var(--text); font-size: 22px; cursor: pointer; }
.logo-mobile { font-family: var(--font-display); font-weight: 800; color: var(--green); display: flex; align-items: center; gap: 6px; font-size: 1rem; }
.main-content { flex: 1; overflow: auto; }

@media (max-width: 768px) {
  .sidebar { position: fixed; left: -220px; top: 0; bottom: 0; transition: left 0.3s; }
  .sidebar.mobile-open { left: 0; }
  .sidebar.collapsed { width: 220px; left: -220px; }
  .sidebar.collapsed.mobile-open { left: 0; }
  .collapse-btn { display: none; }
  .mobile-overlay { display: block; }
  .mobile-header { display: flex; }
}
</style>
