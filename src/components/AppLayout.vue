<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const route = useRoute()
const sidebarOpen = ref(true)

const navItems = [
  { path: '/app/dashboard', icon: 'ti-layout-dashboard', label: 'Dashboard' },
  { path: '/app/fazendas', icon: 'ti-map', label: 'Fazendas' },
  { path: '/app/sensores', icon: 'ti-activity', label: 'Sensores' },
  { path: '/app/irrigacao', icon: 'ti-droplet', label: 'Irrigação' },
  { path: '/app/relatorios', icon: 'ti-chart-bar', label: 'Relatórios' },
  { path: '/app/alertas', icon: 'ti-bell', label: 'Alertas' }
]
</script>

<template>
  <div class="layout">
    <aside class="sidebar" :class="{ collapsed: !sidebarOpen }">
      <div class="logo">
        <i class="ti ti-leaf"></i>
        <span v-if="sidebarOpen">AgroSmart</span>
      </div>

      <nav class="nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: route.path === item.path }"
        >
          <i :class="['ti', item.icon]"></i>
          <span v-if="sidebarOpen">{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <RouterLink to="/perfil" class="nav-item" :class="{ active: route.path === '/perfil' }">
          <i class="ti ti-user-circle"></i>
          <span v-if="sidebarOpen">{{ auth.user?.name || 'Perfil' }}</span>
        </RouterLink>
        <button class="nav-item logout-btn" @click="auth.logout()">
          <i class="ti ti-logout"></i>
          <span v-if="sidebarOpen">Sair</span>
        </button>
      </div>
    </aside>

    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:ital,wght@0,400;0,500;1,400&display=swap');
@import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css');

:root {
  --bg: #0a0f0d;
  --surface: #111a14;
  --surface2: #172110;
  --border: #1e3020;
  --green: #4ade80;
  --green2: #22c55e;
  --muted: #6b7280;
  --subtle: #374151;
  --text: #f0fdf4;
}

.layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: 'DM Sans', sans-serif;
}

.sidebar {
  width: 220px;
  background: var(--surface);
  border-right: 1px solid var(--border);
  padding: 1.75rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  transition: width 0.3s;
  flex-shrink: 0;
}

.sidebar.collapsed { width: 68px; }

.logo {
  font-family: 'Syne', sans-serif;
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--green);
  display: flex;
  align-items: center;
  gap: 10px;
  letter-spacing: -0.02em;
  padding: 0 4px;
}

.logo .ti { font-size: 22px; }

.nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 0.88rem;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  white-space: nowrap;
  background: none;
  border: none;
  width: 100%;
  font-family: 'DM Sans', sans-serif;
}

.nav-item:hover, .nav-item.active {
  background: var(--surface2);
  color: var(--text);
}

.nav-item.active {
  border-left: 2px solid var(--green);
  color: var(--green);
}

.nav-item .ti { font-size: 18px; flex-shrink: 0; }

.sidebar-footer {
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-top: 1px solid var(--border);
  padding-top: 1rem;
}

.logout-btn { color: #f87171 !important; }
.logout-btn:hover { background: #1a0a0a !important; }

.main-content {
  flex: 1;
  overflow: hidden;
}
</style>
