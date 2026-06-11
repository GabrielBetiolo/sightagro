import { ref, computed } from 'vue'

const translations: Record<string, Record<string, string>> = {
  'pt-BR': {
    dashboard: 'Dashboard', fazendas: 'Fazendas', sensores: 'Sensores',
    irrigacao: 'Irrigação', relatorios: 'Relatórios', alertas: 'Alertas',
    assistente: 'Assistente', planos: 'Planos', perfil: 'Configurações',
    sair: 'Sair', 'modo-claro': 'Modo claro', 'modo-escuro': 'Modo escuro',
    'bem-vindo': 'Bem-vindo', 'nova-fazenda': 'Nova Fazenda',
    'sem-fazendas': 'Nenhuma fazenda cadastrada',
    'adicionar-fazenda': 'Adicione sua primeira fazenda para começar o monitoramento.',
    salvar: 'Salvar alterações', cancelar: 'Cancelar',
    online: 'Online', offline: 'Offline', instavel: 'Instável',
  },
  'en-US': {
    dashboard: 'Dashboard', fazendas: 'Farms', sensores: 'Sensors',
    irrigacao: 'Irrigation', relatorios: 'Reports', alertas: 'Alerts',
    assistente: 'Assistant', planos: 'Plans', perfil: 'Settings',
    sair: 'Logout', 'modo-claro': 'Light mode', 'modo-escuro': 'Dark mode',
    'bem-vindo': 'Welcome', 'nova-fazenda': 'New Farm',
    'sem-fazendas': 'No farms registered',
    'adicionar-fazenda': 'Add your first farm to start monitoring.',
    salvar: 'Save changes', cancelar: 'Cancel',
    online: 'Online', offline: 'Offline', instavel: 'Unstable',
  },
  'es-ES': {
    dashboard: 'Panel', fazendas: 'Granjas', sensores: 'Sensores',
    irrigacao: 'Irrigación', relatorios: 'Informes', alertas: 'Alertas',
    assistente: 'Asistente', planos: 'Planes', perfil: 'Configuración',
    sair: 'Salir', 'modo-claro': 'Modo claro', 'modo-escuro': 'Modo oscuro',
    'bem-vindo': 'Bienvenido', 'nova-fazenda': 'Nueva Granja',
    'sem-fazendas': 'Sin granjas registradas',
    'adicionar-fazenda': 'Agrega tu primera granja para comenzar el monitoreo.',
    salvar: 'Guardar cambios', cancelar: 'Cancelar',
    online: 'En línea', offline: 'Fuera de línea', instavel: 'Inestable',
  }
}

const currentLang = ref(localStorage.getItem('agro_language') || 'pt-BR')

export function useI18n() {
  function t(key: string): string {
    return translations[currentLang.value]?.[key] || translations['pt-BR'][key] || key
  }

  function setLang(lang: string) {
    currentLang.value = lang
    localStorage.setItem('agro_language', lang)
    document.documentElement.lang = lang.split('-')[0]
  }

  return { t, currentLang, setLang }
}
