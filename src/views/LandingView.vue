<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const menuOpen = ref(false)

const features = [
  { icon: 'ti-activity', color: '#4ade80', title: 'Sensores em Tempo Real', desc: 'Monitore temperatura, umidade, solo e irrigação de qualquer lugar, direto no celular ou computador.' },
  { icon: 'ti-droplets', color: '#22d3ee', title: 'Irrigação Inteligente', desc: 'Automatize a irrigação com base nos dados dos sensores e economize até 40% no consumo de água.' },
  { icon: 'ti-chart-bar', color: '#a78bfa', title: 'Relatórios Detalhados', desc: 'Acompanhe a evolução da sua produção com gráficos e relatórios exportáveis em CSV.' },
  { icon: 'ti-bell', color: '#facc15', title: 'Alertas Instantâneos', desc: 'Receba notificações imediatas sobre condições críticas antes que virem prejuízo.' },
  { icon: 'ti-map', color: '#fb923c', title: 'Multi-Fazendas', desc: 'Gerencie todas as suas propriedades em um único painel, com visão consolidada.' },
  { icon: 'ti-sun', color: '#f87171', title: 'Energia Solar', desc: 'Monitore geração e consumo de energia fotovoltaica e maximize seu retorno.' },
]

const plans = [
  {
    name: 'Grátis',
    price: 'R$ 0',
    period: 'para sempre',
    color: '#4b5563',
    features: ['1 fazenda', 'Até 4 sensores', 'Dashboard básico', 'Alertas por e-mail'],
    cta: 'Começar grátis',
    highlight: false
  },
  {
    name: 'Pro',
    price: 'R$ 49',
    period: 'por mês',
    color: '#4ade80',
    features: ['Até 5 fazendas', 'Sensores ilimitados', 'Relatórios completos', 'Suporte prioritário', 'Dados históricos'],
    cta: 'Assinar Pro',
    highlight: true
  },
  {
    name: 'Enterprise',
    price: 'R$ 149',
    period: 'por mês',
    color: '#a78bfa',
    features: ['Fazendas ilimitadas', 'Sensores ilimitados', 'API de integração', 'Multi-usuários', 'Suporte 24/7', 'Onboarding dedicado'],
    cta: 'Falar com vendas',
    highlight: false
  }
]

const testimonials = [
  { name: 'João Mendes', role: 'Produtor de Soja — MT', text: 'Reduzi o consumo de água em 35% no primeiro mês. O sistema de alertas me salvou de uma geada que teria destruído metade da safra.', avatar: 'JM' },
  { name: 'Ana Paula Costa', role: 'Pecuarista — GO', text: 'Gerencio 3 fazendas pelo celular enquanto estou viajando. Nunca fui tão produtiva com tão pouco esforço.', avatar: 'AC' },
  { name: 'Carlos Ribeiro', role: 'Produtor de Milho — PR', text: 'A produção aumentou 18% depois que comecei a usar os relatórios para tomar decisões. Vale cada centavo.', avatar: 'CR' },
]

const stats = [
  { value: '340+', label: 'Fazendas ativas' },
  { value: '12.000+', label: 'Sensores conectados' },
  { value: '98%', label: 'Uptime garantido' },
  { value: 'R$ 2M+', label: 'Economizados pelos clientes' },
]
</script>

<template>
  <div class="landing">

    <!-- NAV -->
    <nav class="nav">
      <div class="nav-inner">
        <div class="logo" @click="router.push('/')">
          <i class="ti ti-leaf"></i> AgroSmart
        </div>
        <div class="nav-links" :class="{ open: menuOpen }">
          <a href="#features">Funcionalidades</a>
          <a href="#plans">Planos</a>
          <a href="#testimonials">Depoimentos</a>
          <button class="btn-login" @click="router.push('/login')">Entrar</button>
          <button class="btn-cta-sm" @click="router.push('/register')">Começar grátis</button>
        </div>
        <button class="hamburger" @click="menuOpen = !menuOpen">
          <i :class="['ti', menuOpen ? 'ti-x' : 'ti-menu-2']"></i>
        </button>
      </div>
    </nav>

    <!-- HERO -->
    <section class="hero">
      <div class="hero-badge"><i class="ti ti-sparkles"></i> Agricultura do futuro, disponível hoje</div>
      <h1 class="hero-title">
        Monitore sua fazenda<br/>
        <span class="gradient-text">de qualquer lugar</span>
      </h1>
      <p class="hero-sub">
        Controle sensores, automatize irrigação e tome decisões baseadas em dados reais.
        Aumente sua produtividade sem sair do escritório.
      </p>
      <div class="hero-actions">
        <button class="btn-hero-primary" @click="router.push('/register')">
          Começar gratuitamente <i class="ti ti-arrow-right"></i>
        </button>
        <button class="btn-hero-secondary" @click="router.push('/login')">
          Ver demonstração
        </button>
      </div>
      <div class="hero-img">
        <div class="dashboard-preview">
          <div class="preview-header">
            <div class="preview-dot" style="background:#f87171"></div>
            <div class="preview-dot" style="background:#facc15"></div>
            <div class="preview-dot" style="background:#4ade80"></div>
            <span>AgroSmart Dashboard</span>
          </div>
          <div class="preview-cards">
            <div class="preview-card" v-for="(s, i) in [
              {l:'Temperatura', v:'24°C', c:'#4ade80'},
              {l:'Umidade', v:'78%', c:'#22d3ee'},
              {l:'Irrigação', v:'ON', c:'#facc15'},
              {l:'Produção', v:'+12%', c:'#a78bfa'}
            ]" :key="i">
              <span class="pc-label">{{ s.l }}</span>
              <span class="pc-val" :style="`color:${s.c}`">{{ s.v }}</span>
            </div>
          </div>
          <div class="preview-bars">
            <div v-for="h in [65,80,55,90,75,88,70]" :key="h" class="preview-bar" :style="`height:${h}%`"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- STATS -->
    <section class="stats">
      <div class="stats-inner">
        <div v-for="s in stats" :key="s.label" class="stat-item">
          <strong>{{ s.value }}</strong>
          <span>{{ s.label }}</span>
        </div>
      </div>
    </section>

    <!-- FEATURES -->
    <section class="features" id="features">
      <div class="section-label">Funcionalidades</div>
      <h2 class="section-title">Tudo que sua fazenda precisa</h2>
      <p class="section-sub">Uma plataforma completa para gestão agrícola inteligente</p>
      <div class="features-grid">
        <div v-for="f in features" :key="f.title" class="feature-card">
          <div class="feature-icon" :style="`background:${f.color}22;color:${f.color}`">
            <i :class="['ti', f.icon]"></i>
          </div>
          <h3>{{ f.title }}</h3>
          <p>{{ f.desc }}</p>
        </div>
      </div>
    </section>

    <!-- PLANS -->
    <section class="plans" id="plans">
      <div class="section-label">Planos</div>
      <h2 class="section-title">Simples e transparente</h2>
      <p class="section-sub">Comece de graça, escale quando precisar</p>
      <div class="plans-grid">
        <div v-for="p in plans" :key="p.name" class="plan-card" :class="{ highlight: p.highlight }">
          <div v-if="p.highlight" class="plan-badge">Mais popular</div>
          <div class="plan-name">{{ p.name }}</div>
          <div class="plan-price">
            <strong>{{ p.price }}</strong>
            <span>{{ p.period }}</span>
          </div>
          <ul class="plan-features">
            <li v-for="f in p.features" :key="f">
              <i class="ti ti-check" :style="`color:${p.color}`"></i> {{ f }}
            </li>
          </ul>
          <button class="plan-cta" :style="p.highlight ? 'background:#4ade80;color:#0a0f0d' : ''"
            @click="router.push('/register')">
            {{ p.cta }}
          </button>
        </div>
      </div>
    </section>

    <!-- TESTIMONIALS -->
    <section class="testimonials" id="testimonials">
      <div class="section-label">Depoimentos</div>
      <h2 class="section-title">Quem usa, recomenda</h2>
      <div class="testimonials-grid">
        <div v-for="t in testimonials" :key="t.name" class="testimonial-card">
          <p class="testimonial-text">"{{ t.text }}"</p>
          <div class="testimonial-author">
            <div class="testimonial-avatar">{{ t.avatar }}</div>
            <div>
              <div class="testimonial-name">{{ t.name }}</div>
              <div class="testimonial-role">{{ t.role }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA FINAL -->
    <section class="cta-final">
      <h2>Pronto para transformar sua fazenda?</h2>
      <p>Junte-se a mais de 340 produtores que já usam o AgroSmart.</p>
      <button class="btn-hero-primary" @click="router.push('/register')">
        Criar conta grátis <i class="ti ti-arrow-right"></i>
      </button>
    </section>

    <!-- FOOTER -->
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <div class="logo"><i class="ti ti-leaf"></i> AgroSmart</div>
          <p>Agricultura inteligente para o futuro do agro.</p>
        </div>
        <div class="footer-links">
          <div class="footer-col">
            <h4>Produto</h4>
            <a href="#features">Funcionalidades</a>
            <a href="#plans">Planos</a>
            <a href="#testimonials">Depoimentos</a>
          </div>
          <div class="footer-col">
            <h4>Conta</h4>
            <a @click="router.push('/login')">Entrar</a>
            <a @click="router.push('/register')">Criar conta</a>
          </div>
          <div class="footer-col">
            <h4>Contato</h4>
            <a href="mailto:contato@agrosmart.com.br">contato@agrosmart.com.br</a>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        © 2025 AgroSmart. Todos os direitos reservados.
      </div>
    </footer>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@400;500&display=swap');
@import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css');

* { box-sizing: border-box; margin: 0; padding: 0; }

.landing { background: #0a0f0d; color: #f0fdf4; font-family: 'DM Sans', sans-serif; overflow-x: hidden; }

/* NAV */
.nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; background: rgba(10,15,13,0.85); backdrop-filter: blur(12px); border-bottom: 1px solid #1e3020; }
.nav-inner { max-width: 1200px; margin: 0 auto; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; }
.logo { font-family: 'Syne', sans-serif; font-size: 1.2rem; font-weight: 800; color: #4ade80; display: flex; align-items: center; gap: 8px; cursor: pointer; }
.nav-links { display: flex; align-items: center; gap: 1.5rem; }
.nav-links a { color: #9ca3af; font-size: 0.9rem; text-decoration: none; cursor: pointer; transition: color 0.2s; }
.nav-links a:hover { color: #f0fdf4; }
.btn-login { background: none; border: 1px solid #1e3020; color: #9ca3af; padding: 8px 16px; border-radius: 8px; font-size: 0.85rem; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s; }
.btn-login:hover { border-color: #4ade80; color: #4ade80; }
.btn-cta-sm { background: #4ade80; color: #0a0f0d; border: none; padding: 8px 18px; border-radius: 8px; font-size: 0.85rem; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s; }
.btn-cta-sm:hover { background: #22c55e; }
.hamburger { display: none; background: none; border: none; color: #f0fdf4; font-size: 22px; cursor: pointer; }

/* HERO */
.hero { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 8rem 2rem 4rem; }
.hero-badge { display: inline-flex; align-items: center; gap: 6px; background: #172110; border: 1px solid #1e3020; color: #4ade80; padding: 6px 16px; border-radius: 20px; font-size: 0.82rem; margin-bottom: 1.5rem; }
.hero-title { font-family: 'Syne', sans-serif; font-size: clamp(2.5rem, 6vw, 5rem); font-weight: 800; letter-spacing: -0.03em; line-height: 1.05; margin-bottom: 1.5rem; }
.gradient-text { background: linear-gradient(135deg, #4ade80, #22d3ee); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.hero-sub { color: #9ca3af; font-size: 1.1rem; max-width: 560px; line-height: 1.7; margin-bottom: 2.5rem; }
.hero-actions { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; margin-bottom: 4rem; }
.btn-hero-primary { background: #4ade80; color: #0a0f0d; border: none; padding: 14px 28px; border-radius: 12px; font-family: 'DM Sans', sans-serif; font-weight: 700; font-size: 1rem; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s; }
.btn-hero-primary:hover { background: #22c55e; transform: translateY(-2px); }
.btn-hero-secondary { background: transparent; border: 1px solid #1e3020; color: #9ca3af; padding: 14px 28px; border-radius: 12px; font-family: 'DM Sans', sans-serif; font-size: 1rem; cursor: pointer; transition: all 0.2s; }
.btn-hero-secondary:hover { border-color: #4ade80; color: #4ade80; }

/* DASHBOARD PREVIEW */
.hero-img { width: 100%; max-width: 700px; }
.dashboard-preview { background: #111a14; border: 1px solid #1e3020; border-radius: 20px; padding: 1.5rem; text-align: left; }
.preview-header { display: flex; align-items: center; gap: 6px; margin-bottom: 1.25rem; font-size: 0.8rem; color: #4b5563; }
.preview-dot { width: 10px; height: 10px; border-radius: 50%; }
.preview-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 1.25rem; }
.preview-card { background: #172110; border-radius: 10px; padding: 10px 12px; }
.pc-label { display: block; font-size: 0.7rem; color: #6b7280; margin-bottom: 4px; }
.pc-val { font-family: 'Syne', sans-serif; font-size: 1.3rem; font-weight: 800; }
.preview-bars { display: flex; align-items: flex-end; gap: 6px; height: 80px; }
.preview-bar { flex: 1; background: linear-gradient(to top, #4ade80, #22c55e44); border-radius: 4px 4px 0 0; }

/* STATS */
.stats { background: #111a14; border-top: 1px solid #1e3020; border-bottom: 1px solid #1e3020; padding: 3rem 2rem; }
.stats-inner { max-width: 1000px; margin: 0 auto; display: grid; grid-template-columns: repeat(4, 1fr); gap: 2rem; text-align: center; }
.stat-item strong { display: block; font-family: 'Syne', sans-serif; font-size: 2.2rem; font-weight: 800; color: #4ade80; }
.stat-item span { font-size: 0.85rem; color: #6b7280; margin-top: 4px; display: block; }

/* SECTIONS */
.section-label { display: inline-block; background: #172110; border: 1px solid #1e3020; color: #4ade80; padding: 4px 14px; border-radius: 20px; font-size: 0.78rem; margin-bottom: 1rem; }
.section-title { font-family: 'Syne', sans-serif; font-size: clamp(1.8rem, 4vw, 3rem); font-weight: 800; letter-spacing: -0.02em; margin-bottom: 0.75rem; }
.section-sub { color: #6b7280; font-size: 1rem; margin-bottom: 3rem; }

/* FEATURES */
.features { max-width: 1200px; margin: 0 auto; padding: 6rem 2rem; text-align: center; }
.features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.25rem; text-align: left; }
.feature-card { background: #111a14; border: 1px solid #1e3020; border-radius: 20px; padding: 1.75rem; transition: border-color 0.2s; }
.feature-card:hover { border-color: #4ade80; }
.feature-icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 22px; margin-bottom: 1rem; }
.feature-card h3 { font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 800; margin-bottom: 0.5rem; }
.feature-card p { font-size: 0.88rem; color: #6b7280; line-height: 1.6; }

/* PLANS */
.plans { padding: 6rem 2rem; text-align: center; background: #0d1510; }
.plans-grid { max-width: 1000px; margin: 0 auto; display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; }
.plan-card { background: #111a14; border: 1px solid #1e3020; border-radius: 20px; padding: 2rem; position: relative; text-align: left; transition: border-color 0.2s; }
.plan-card.highlight { border-color: #4ade80; }
.plan-badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: #4ade80; color: #0a0f0d; font-size: 0.72rem; font-weight: 700; padding: 4px 14px; border-radius: 20px; white-space: nowrap; }
.plan-name { font-family: 'Syne', sans-serif; font-size: 1.1rem; font-weight: 800; margin-bottom: 1rem; }
.plan-price strong { font-family: 'Syne', sans-serif; font-size: 2.5rem; font-weight: 800; }
.plan-price span { font-size: 0.85rem; color: #6b7280; margin-left: 4px; }
.plan-features { list-style: none; margin: 1.5rem 0; display: flex; flex-direction: column; gap: 10px; }
.plan-features li { display: flex; align-items: center; gap: 8px; font-size: 0.88rem; color: #9ca3af; }
.plan-cta { width: 100%; background: #172110; border: 1px solid #1e3020; color: #f0fdf4; padding: 12px; border-radius: 12px; font-family: 'DM Sans', sans-serif; font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; }
.plan-cta:hover { opacity: 0.85; }

/* TESTIMONIALS */
.testimonials { max-width: 1200px; margin: 0 auto; padding: 6rem 2rem; text-align: center; }
.testimonials-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.25rem; text-align: left; }
.testimonial-card { background: #111a14; border: 1px solid #1e3020; border-radius: 20px; padding: 1.75rem; }
.testimonial-text { font-size: 0.92rem; color: #d1d5db; line-height: 1.7; margin-bottom: 1.5rem; font-style: italic; }
.testimonial-author { display: flex; align-items: center; gap: 12px; }
.testimonial-avatar { width: 42px; height: 42px; border-radius: 50%; background: #172110; border: 1px solid #1e3020; display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-weight: 800; color: #4ade80; font-size: 0.85rem; flex-shrink: 0; }
.testimonial-name { font-weight: 500; font-size: 0.9rem; }
.testimonial-role { font-size: 0.78rem; color: #6b7280; }

/* CTA FINAL */
.cta-final { background: linear-gradient(135deg, #14532d, #166534); padding: 6rem 2rem; text-align: center; }
.cta-final h2 { font-family: 'Syne', sans-serif; font-size: clamp(1.8rem, 4vw, 3rem); font-weight: 800; margin-bottom: 1rem; }
.cta-final p { color: rgba(255,255,255,0.7); font-size: 1rem; margin-bottom: 2.5rem; }

/* FOOTER */
.footer { background: #080d0a; border-top: 1px solid #1e3020; padding: 4rem 2rem 2rem; }
.footer-inner { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 2fr; gap: 4rem; margin-bottom: 3rem; }
.footer-brand p { color: #6b7280; font-size: 0.88rem; margin-top: 0.75rem; line-height: 1.6; max-width: 260px; }
.footer-links { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; }
.footer-col h4 { font-family: 'Syne', sans-serif; font-size: 0.85rem; font-weight: 800; margin-bottom: 1rem; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; }
.footer-col a { display: block; color: #6b7280; font-size: 0.88rem; text-decoration: none; margin-bottom: 8px; cursor: pointer; transition: color 0.2s; }
.footer-col a:hover { color: #4ade80; }
.footer-bottom { max-width: 1200px; margin: 0 auto; padding-top: 2rem; border-top: 1px solid #1e3020; text-align: center; font-size: 0.82rem; color: #4b5563; }

/* RESPONSIVE */
@media (max-width: 768px) {
  .nav-links { display: none; flex-direction: column; position: absolute; top: 100%; left: 0; right: 0; background: #0a0f0d; padding: 1.5rem; border-bottom: 1px solid #1e3020; gap: 1rem; }
  .nav-links.open { display: flex; }
  .hamburger { display: block; }
  .preview-cards { grid-template-columns: repeat(2, 1fr); }
  .stats-inner { grid-template-columns: repeat(2, 1fr); }
  .plans-grid { grid-template-columns: 1fr; }
  .footer-inner { grid-template-columns: 1fr; gap: 2rem; }
  .footer-links { grid-template-columns: repeat(2, 1fr); }
}
</style>
