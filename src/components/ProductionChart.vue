<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from 'chart.js'

import { Line } from 'vue-chartjs'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
)

const chartData = {
  labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
  datasets: [
    {
      label: 'Produção',
      data: [12, 19, 15, 25, 32, 40],
      borderColor: '#4ade80',
      backgroundColor: '#4ade80',
      tension: 0.4
    }
  ]
}

const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      labels: {
        color: 'white'
      }
    }
  },
  scales: {
    x: {
      ticks: {
        color: 'white'
      }
    },
    y: {
      ticks: {
        color: 'white'
      }
    }
  }
}
</script>

<template>

  <div
    class="bg-slate-900 p-8 rounded-[32px] border border-slate-800"
  >

    <h2 class="text-3xl font-black mb-8">
      Produção Mensal
    </h2>

    <Line
      :data="chartData"
      :options="chartOptions"
    />

  </div>

</template>