// ============================================================================
// SISTEMA DE TRADUÇÃO (i18n)
// ============================================================================
// Implementação simples de internacionalização sem bibliotecas externas.
// `currentLang` é um ref REATIVO E COMPARTILHADO entre todos os componentes
// que importam este módulo - por isso é declarado fora da função useI18n().
//
// Uso:
//   const { t, currentLang, setLang } = useI18n()
//   t('dashboard')      -> "Dashboard" / "Dashboard" / "Panel"
//   setLang('en-US')    -> troca o idioma globalmente
// ============================================================================

import { ref } from 'vue'

const translations: Record<string, Record<string, string>> = {
  'pt-BR': {
    dashboard: 'Dashboard', fazendas: 'Fazendas', sensores: 'Sensores',
    irrigacao: 'Irrigação', relatorios: 'Relatórios', alertas: 'Alertas',
    documentos: 'Documentos',
    financeiro: 'Financeiro', // NOVO
    assistente: 'Assistente', planos: 'Planos', perfil: 'Configurações',
    sair: 'Sair', inicio: 'Início',
    'modo-claro': 'Modo claro', 'modo-escuro': 'Modo escuro',
    salvar: 'Salvar alterações', cancelar: 'Cancelar', criar: 'Criar',
    editar: 'Editar', deletar: 'Deletar', ver: 'Ver', fechar: 'Fechar',
    'bem-vindo': 'Bem-vindo', 'nova-fazenda': 'Nova Fazenda',
    'sem-fazendas': 'Nenhuma fazenda cadastrada',
    'adicionar-fazenda': 'Adicione sua primeira fazenda para começar.',
    'carregando': 'Carregando dados...', 'ver-todos': 'Ver todos →',
    'novo-sensor': 'Novo Sensor', 'sem-sensores': 'Nenhum sensor cadastrado',
    'sem-alertas': 'Nenhum alerta', 'nao-lidos': 'não lidos',
    'marcar-lidos': 'Marcar todos como lidos', 'ativar-notificacoes': 'Ativar notificações',
    'notificacoes-ativas': 'Notificações ativas',
    'nova-zona': 'Nova Zona', 'sem-zonas': 'Nenhuma zona de irrigação',
    'info-pessoal': 'Informações pessoais', 'alterar-senha': 'Alterar senha',
    'nome-completo': 'Nome completo', 'senha-atual': 'Senha atual',
    'nova-senha': 'Nova senha', 'confirmar-senha': 'Confirmar senha',
    online: 'Online', offline: 'Offline', instavel: 'Instável',
  },
  'en-US': {
    dashboard: 'Dashboard', fazendas: 'Farms', sensores: 'Sensors',
    irrigacao: 'Irrigation', relatorios: 'Reports', alertas: 'Alerts',
    documentos: 'Documents',
    financeiro: 'Finance', // NEW
    assistente: 'Assistant', planos: 'Plans', perfil: 'Settings',
    sair: 'Logout', inicio: 'Home',
    'modo-claro': 'Light mode', 'modo-escuro': 'Dark mode',
    salvar: 'Save changes', cancelar: 'Cancel', criar: 'Create',
    editar: 'Edit', deletar: 'Delete', ver: 'View', fechar: 'Close',
    'bem-vindo': 'Welcome', 'nova-fazenda': 'New Farm',
    'sem-fazendas': 'No farms registered',
    'adicionar-fazenda': 'Add your first farm to start monitoring.',
    'carregando': 'Loading data...', 'ver-todos': 'View all →',
    'novo-sensor': 'New Sensor', 'sem-sensores': 'No sensors registered',
    'sem-alertas': 'No alerts', 'nao-lidos': 'unread',
    'marcar-lidos': 'Mark all as read', 'ativar-notificacoes': 'Enable notifications',
    'notificacoes-ativas': 'Notifications active',
    'nova-zona': 'New Zone', 'sem-zonas': 'No irrigation zones',
    'info-pessoal': 'Personal information', 'alterar-senha': 'Change password',
    'nome-completo': 'Full name', 'senha-atual': 'Current password',
    'nova-senha': 'New password', 'confirmar-senha': 'Confirm password',
    online: 'Online', offline: 'Offline', instavel: 'Unstable',
  },
  'es-ES': {
    dashboard: 'Panel', fazendas: 'Granjas', sensores: 'Sensores',
    irrigacao: 'Irrigación', relatorios: 'Informes', alertas: 'Alertas',
    documentos: 'Documentos',
    financeiro: 'Finanzas', // NUEVO
    assistente: 'Asistente', planos: 'Planes', perfil: 'Configuración',
    sair: 'Salir', inicio: 'Inicio',
    'modo-claro': 'Modo claro', 'modo-escuro': 'Modo oscuro',
    salvar: 'Guardar cambios', cancelar: 'Cancelar', criar: 'Crear',
    editar: 'Editar', deletar: 'Eliminar', ver: 'Ver', fechar: 'Cerrar',
    'bem-vindo': 'Bienvenido', 'nova-fazenda': 'Nueva Granja',
    'sem-fazendas': 'Sin granjas registradas',
    'adicionar-fazenda': 'Agrega tu primera granja para comenzar.',
    'carregando': 'Cargando datos...', 'ver-todos': 'Ver todos →',
    'novo-sensor': 'Nuevo Sensor', 'sem-sensores': 'Sin sensores registrados',
    'sem-alertas': 'Sin alertas', 'nao-lidos': 'no leídos',
    'marcar-lidos': 'Marcar todos como leídos', 'ativar-notificacoes': 'Activar notificaciones',
    'notificacoes-ativas': 'Notificaciones activas',
    'nova-zona': 'Nueva Zona', 'sem-zonas': 'Sin zonas de irrigación',
    'info-pessoal': 'Información personal', 'alterar-senha': 'Cambiar contraseña',
    'nome-completo': 'Nombre completo', 'senha-atual': 'Contraseña actual',
    'nova-senha': 'Nueva contraseña', 'confirmar-senha': 'Confirmar contraseña',
    online: 'En línea', offline: 'Fuera de línea', instavel: 'Inestable',
  }
}

// Ref compartilhado globalmente - garante que ao trocar o idioma em
// qualquer tela, TODAS as telas reajam imediatamente.
export const currentLang = ref(localStorage.getItem('agro_language') || 'pt-BR')

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
