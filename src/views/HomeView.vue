<template>
  <div class="min-h-screen bg-slate-900 text-white">

    <nav class="flex justify-between items-center p-6 border-b border-slate-700">
      <h1 class="text-2xl font-bold text-green-400">
        AgroVision
      </h1>

      <button class="bg-green-500 px-4 py-2 rounded-lg hover:bg-green-600 transition">
        Entrar
      </button>
    </nav>

    <section class="flex flex-col items-center justify-center text-center mt-32 px-4">

      <h2 class="text-6xl font-bold max-w-4xl leading-tight">
        Tecnologia inteligente para o agro moderno
      </h2>

      <p class="text-slate-400 mt-6 max-w-2xl text-lg">
        Monitore clima, sensores, irrigação e produtividade em tempo real.
      </p>

      <router-link
        to="/dashboard"
        class="mt-10 bg-green-500 hover:bg-green-600 transition px-8 py-4 rounded-xl text-lg font-semibold"
      >
        Acessar Dashboard
      </router-link>

    </section>

  </div>
</template>