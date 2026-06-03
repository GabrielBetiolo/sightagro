<script setup lang="ts">
import {
  LayoutDashboard,
  CloudSun,
  Tractor,
  LineChart,
  Settings,
  Map,
  Bell,
  ChevronLeft
} from 'lucide-vue-next'
</script>

<template>

  <aside
    class="w-72 min-h-screen bg-slate-900 border-r border-slate-800 p-6 flex flex-col"
  >

    <!-- LOGO -->

    <div class="flex items-center justify-between mb-12">

      <div>
        <h1 class="text-3xl font-black text-green-400">
          SightAgro
        </h1>

        <p class="text-slate-500 text-sm">
          Smart Farming
        </p>
      </div>

      <button
        class="bg-slate-800 p-2 rounded-xl hover:bg-slate-700 transition"
      >
        <ChevronLeft :size="20" />
      </button>

    </div>

    <!-- MENU -->

    <nav class="flex flex-col gap-3">

      <button
        class="flex items-center gap-4 bg-green-500/10 text-green-400 p-4 rounded-2xl border border-green-500/20"
      >
        <LayoutDashboard :size="22" />
        Dashboard
      </button>

      <button
        class="flex items-center gap-4 text-slate-300 hover:bg-slate-800 hover:text-white transition p-4 rounded-2xl"
      >
        <CloudSun :size="22" />
        Clima
      </button>

      <button
        class="flex items-center gap-4 text-slate-300 hover:bg-slate-800 hover:text-white transition p-4 rounded-2xl"
      >
        <Tractor :size="22" />
        Máquinas
      </button>

      <button
        class="flex items-center gap-4 text-slate-300 hover:bg-slate-800 hover:text-white transition p-4 rounded-2xl"
      >
        <LineChart :size="22" />
        Produção
      </button>

      <button
        class="flex items-center gap-4 text-slate-300 hover:bg-slate-800 hover:text-white transition p-4 rounded-2xl"
      >
        <Map :size="22" />
        Mapa
      </button>

      <button
        class="flex items-center gap-4 text-slate-300 hover:bg-slate-800 hover:text-white transition p-4 rounded-2xl"
      >
        <Bell :size="22" />
        Alertas
      </button>

      <button
        class="flex items-center gap-4 text-slate-300 hover:bg-slate-800 hover:text-white transition p-4 rounded-2xl"
      >
        <Settings :size="22" />
        Configurações
      </button>

    </nav>

    <!-- USER -->

    <div
      class="mt-auto bg-slate-800 p-4 rounded-2xl border border-slate-700"
    >

      <div class="flex items-center gap-4">

        <div
          class="w-12 h-12 rounded-full bg-green-400"
        ></div>

        <div>
          <h2 class="font-bold">
            Gabriel
          </h2>

          <p class="text-slate-400 text-sm">
            Administrador
          </p>
        </div>

      </div>

    </div>

  </aside>

</template>