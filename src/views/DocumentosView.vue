<!--
============================================================================
  DOCUMENTOS DA TERRA
============================================================================
  Tela para o produtor cadastrar e acompanhar documentos da propriedade:
  INCRA, ITR, CCIR, Matrícula, GTA (gado), etc.

  Fluxo de upload:
    1. Usuário escolhe um arquivo (PDF ou imagem)
    2. O arquivo é enviado DIRETAMENTE ao Cloudinary (upload "unsigned",
       mesmo padrão usado para a foto de perfil)
    3. A URL retornada pelo Cloudinary é enviada ao backend junto com os
       metadados (nome, tipo, datas)

  IMPORTANTE: para uploads de PDF funcionarem no Cloudinary, é necessário
  criar um "Upload Preset" UNSIGNED chamado "sightagro_documentos" que
  permita "raw" (qualquer tipo de arquivo). Veja a documentação anexa.
============================================================================
-->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '../composables/useApi'

// --------------------------------------------------------------------
// ESTADO
// --------------------------------------------------------------------
const documentos = ref<any[]>([])
const fazendas = ref<any[]>([])
const loading = ref(true)
const uploading = ref(false)
const showModal = ref(false)
const filtroFazenda = ref<number | 'todas'>('todas')
const filtroStatus = ref<'todos' | 'vencido' | 'vencendo' | 'valido' | 'sem_vencimento'>('todos')

// Formulário de novo documento
const form = ref({
  nome: '',
  tipo: 'INCRA',
  numero: '',
  dataEmissao: '',
  dataVencimento: '',
  fazendaId: '' as number | ''
})
const arquivoSelecionado = ref<File | null>(null)

// Tipos de documento disponíveis (com rótulos amigáveis)
const tiposDocumento = [
  { value: 'INCRA', label: 'INCRA (CCIR)' },
  { value: 'ITR', label: 'ITR - Imposto Territorial Rural' },
  { value: 'CCIR', label: 'CCIR - Certificado de Cadastro' },
  { value: 'MATRICULA', label: 'Matrícula do Imóvel' },
  { value: 'GTA', label: 'GTA - Guia de Trânsito Animal' },
  { value: 'OUTRO', label: 'Outro documento' }
]

// Mapas de exibição para status e cores
const statusInfo: Record<string, { label: string; color: string; icon: string }> = {
  vencido: { label: 'Vencido', color: '#f87171', icon: 'ti-alert-circle' },
  vencendo: { label: 'Vence em breve', color: '#facc15', icon: 'ti-alert-triangle' },
  valido: { label: 'Válido', color: '#4ade80', icon: 'ti-circle-check' },
  sem_vencimento: { label: 'Sem vencimento', color: '#6b7280', icon: 'ti-infinity' }
}

// --------------------------------------------------------------------
// CARREGAMENTO DE DADOS
// --------------------------------------------------------------------
async function fetchDados() {
  loading.value = true
  try {
    const [docs, fzs] = await Promise.all([
      api.get('/documentos'),
      api.get('/fazendas')
    ])
    documentos.value = docs
    fazendas.value = fzs
    if (fzs.length > 0 && !form.value.fazendaId) form.value.fazendaId = fzs[0].id

    // Verifica vencimentos e gera alertas automaticamente ao abrir a tela
    await api.post('/documentos/verificar-vencimentos', {})
  } finally {
    loading.value = false
  }
}

// --------------------------------------------------------------------
// FILTROS (computed)
// --------------------------------------------------------------------
const documentosFiltrados = computed(() => {
  return documentos.value.filter((d) => {
    const okFazenda = filtroFazenda.value === 'todas' || d.fazenda.id === filtroFazenda.value
    const okStatus = filtroStatus.value === 'todos' || d.status === filtroStatus.value
    return okFazenda && okStatus
  })
})

// Contadores para os badges de filtro de status
const contadores = computed(() => {
  const c = { vencido: 0, vencendo: 0, valido: 0, sem_vencimento: 0 }
  for (const d of documentos.value) {
    c[d.status as keyof typeof c]++
  }
  return c
})

// --------------------------------------------------------------------
// UPLOAD PARA O CLOUDINARY
// --------------------------------------------------------------------
// Envia o arquivo escolhido para o Cloudinary usando o preset "unsigned"
// dedicado a documentos (aceita PDF, JPG, PNG). Retorna a URL pública
// e o mime type do arquivo enviado.
// --------------------------------------------------------------------
async function uploadParaCloudinary(file: File): Promise<{ url: string; mime: string }> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', 'sightagro_documentos')

  // O endpoint "/auto/upload" detecta automaticamente o tipo do arquivo
  // (imagem ou "raw" para PDFs e outros formatos)
  const res = await fetch('https://api.cloudinary.com/v1_1/dkrpjfanu/auto/upload', {
    method: 'POST',
    body: formData
  })

  if (!res.ok) throw new Error('Falha ao enviar o arquivo. Tente novamente.')

  const data = await res.json()
  return { url: data.secure_url, mime: file.type || 'application/octet-stream' }
}

function handleFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  arquivoSelecionado.value = file || null
}

// --------------------------------------------------------------------
// SALVAR NOVO DOCUMENTO
// --------------------------------------------------------------------
async function salvarDocumento() {
  if (!form.value.nome || !form.value.fazendaId || !arquivoSelecionado.value) return

  uploading.value = true
  try {
    // 1. Faz upload do arquivo para o Cloudinary
    const { url, mime } = await uploadParaCloudinary(arquivoSelecionado.value)

    // 2. Envia os metadados + URL do arquivo para o backend
    await api.post('/documentos', {
      nome: form.value.nome,
      tipo: form.value.tipo,
      arquivoUrl: url,
      arquivoTipo: mime,
      numero: form.value.numero || undefined,
      dataEmissao: form.value.dataEmissao ? new Date(form.value.dataEmissao).toISOString() : undefined,
      dataVencimento: form.value.dataVencimento ? new Date(form.value.dataVencimento).toISOString() : undefined,
      fazendaId: Number(form.value.fazendaId)
    })

    // 3. Reseta o formulário e recarrega a lista
    showModal.value = false
    form.value = { nome: '', tipo: 'INCRA', numero: '', dataEmissao: '', dataVencimento: '', fazendaId: fazendas.value[0]?.id || '' }
    arquivoSelecionado.value = null
    await fetchDados()
  } catch (err: any) {
    alert(err.message || 'Erro ao salvar documento')
  } finally {
    uploading.value = false
  }
}

// --------------------------------------------------------------------
// DELETAR DOCUMENTO
// --------------------------------------------------------------------
async function deletarDocumento(id: number) {
  if (!confirm('Remover este documento? Esta ação não pode ser desfeita.')) return
  await api.delete(`/documentos/${id}`)
  documentos.value = documentos.value.filter((d) => d.id !== id)
}

function formatarData(data: string | null) {
  if (!data) return '—'
  return new Date(data).toLocaleDateString('pt-BR')
}

onMounted(fetchDados)
</script>

<template>
  <div class="page">
    <!-- CABEÇALHO -->
    <div class="header">
      <div>
        <h1 class="page-title">Documentos da Terra</h1>
        <p class="page-sub">INCRA, ITR, CCIR, matrícula, GTA e outros documentos da propriedade</p>
      </div>
      <button class="btn-primary" @click="showModal = true" :disabled="fazendas.length === 0">
        <i class="ti ti-upload"></i> Novo Documento
      </button>
    </div>

    <!-- AVISO SE NÃO HOUVER FAZENDAS -->
    <div v-if="!loading && fazendas.length === 0" class="alert-info">
      <i class="ti ti-info-circle"></i>
      Cadastre uma fazenda antes de adicionar documentos.
    </div>

    <!-- RESUMO DE STATUS -->
    <div v-if="documentos.length > 0" class="summary">
      <div class="sum-card" :style="`--c:${statusInfo.vencido.color}`">
        <i :class="['ti', statusInfo.vencido.icon]"></i>
        <div><strong>{{ contadores.vencido }}</strong><span>Vencidos</span></div>
      </div>
      <div class="sum-card" :style="`--c:${statusInfo.vencendo.color}`">
        <i :class="['ti', statusInfo.vencendo.icon]"></i>
        <div><strong>{{ contadores.vencendo }}</strong><span>Vencendo em breve</span></div>
      </div>
      <div class="sum-card" :style="`--c:${statusInfo.valido.color}`">
        <i :class="['ti', statusInfo.valido.icon]"></i>
        <div><strong>{{ contadores.valido }}</strong><span>Válidos</span></div>
      </div>
      <div class="sum-card" :style="`--c:${statusInfo.sem_vencimento.color}`">
        <i :class="['ti', statusInfo.sem_vencimento.icon]"></i>
        <div><strong>{{ contadores.sem_vencimento }}</strong><span>Sem vencimento</span></div>
      </div>
    </div>

    <!-- FILTROS -->
    <div v-if="documentos.length > 0" class="filtros">
      <select v-model="filtroFazenda" class="select-filtro">
        <option value="todas">Todas as fazendas</option>
        <option v-for="f in fazendas" :key="f.id" :value="f.id">{{ f.nome }}</option>
      </select>
      <div class="status-filtros">
        <button
          v-for="s in ['todos','vencido','vencendo','valido','sem_vencimento']" :key="s"
          class="status-btn" :class="{ active: filtroStatus === s }"
          @click="filtroStatus = s as any"
        >
          {{ s === 'todos' ? 'Todos' : statusInfo[s].label }}
        </button>
      </div>
    </div>

    <!-- LOADING -->
    <div v-if="loading" class="loading-state">
      <i class="ti ti-loader-2 spin"></i> Carregando documentos...
    </div>

    <!-- EMPTY STATE -->
    <div v-else-if="documentos.length === 0 && fazendas.length > 0" class="empty-state">
      <div class="empty-icon"><i class="ti ti-file-certificate"></i></div>
      <h3>Nenhum documento cadastrado</h3>
      <p>Adicione documentos como INCRA, ITR, CCIR, matrícula ou GTA para manter tudo organizado e receber alertas de vencimento.</p>
      <button class="btn-primary" @click="showModal = true"><i class="ti ti-upload"></i> Adicionar documento</button>
    </div>

    <!-- LISTA DE DOCUMENTOS -->
    <div v-else class="docs-grid">
      <div v-for="doc in documentosFiltrados" :key="doc.id" class="doc-card" :style="`--c:${statusInfo[doc.status].color}`">
        <div class="doc-top">
          <div class="doc-icon">
            <i :class="['ti', doc.arquivoTipo.includes('pdf') ? 'ti-file-type-pdf' : 'ti-photo']"></i>
          </div>
          <span class="doc-status" :style="`background:${statusInfo[doc.status].color}22;color:${statusInfo[doc.status].color}`">
            <i :class="['ti', statusInfo[doc.status].icon]"></i> {{ statusInfo[doc.status].label }}
          </span>
        </div>

        <h3 class="doc-name">{{ doc.nome }}</h3>
        <div class="doc-tag">{{ tiposDocumento.find(t => t.value === doc.tipo)?.label || doc.tipo }}</div>

        <div class="doc-meta">
          <div class="meta-row"><i class="ti ti-map-pin"></i> {{ doc.fazenda.nome }}</div>
          <div v-if="doc.numero" class="meta-row"><i class="ti ti-hash"></i> {{ doc.numero }}</div>
          <div v-if="doc.dataEmissao" class="meta-row"><i class="ti ti-calendar"></i> Emitido: {{ formatarData(doc.dataEmissao) }}</div>
          <div v-if="doc.dataVencimento" class="meta-row"><i class="ti ti-calendar-due"></i> Vence: {{ formatarData(doc.dataVencimento) }}</div>
        </div>

        <div class="doc-actions">
          <a :href="doc.arquivoUrl" target="_blank" class="btn-outline">
            <i class="ti ti-eye"></i> Ver arquivo
          </a>
          <button class="btn-outline danger" @click="deletarDocumento(doc.id)">
            <i class="ti ti-trash"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL NOVO DOCUMENTO -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>Novo Documento</h3>
          <button class="modal-close" @click="showModal = false"><i class="ti ti-x"></i></button>
        </div>

        <div class="field">
          <label>Nome do documento *</label>
          <input v-model="form.nome" type="text" placeholder="Ex: ITR 2025" />
        </div>

        <div class="field-row">
          <div class="field">
            <label>Tipo *</label>
            <select v-model="form.tipo" class="select-input">
              <option v-for="t in tiposDocumento" :key="t.value" :value="t.value">{{ t.label }}</option>
            </select>
          </div>
          <div class="field">
            <label>Fazenda *</label>
            <select v-model="form.fazendaId" class="select-input">
              <option v-for="f in fazendas" :key="f.id" :value="f.id">{{ f.nome }}</option>
            </select>
          </div>
        </div>

        <div class="field">
          <label>Número do registro (opcional)</label>
          <input v-model="form.numero" type="text" placeholder="Ex: 123.456.789-0" />
        </div>

        <div class="field-row">
          <div class="field">
            <label>Data de emissão (opcional)</label>
            <input v-model="form.dataEmissao" type="date" />
          </div>
          <div class="field">
            <label>Data de vencimento (opcional)</label>
            <input v-model="form.dataVencimento" type="date" />
            <span class="field-hint"><i class="ti ti-bell"></i> Gera alerta automático perto do vencimento</span>
          </div>
        </div>

        <div class="field">
          <label>Arquivo (PDF ou imagem) *</label>
          <label class="file-drop">
            <i class="ti ti-cloud-upload"></i>
            <span v-if="!arquivoSelecionado">Clique para selecionar um arquivo</span>
            <span v-else class="file-name">{{ arquivoSelecionado.name }}</span>
            <input type="file" accept="application/pdf,image/*" @change="handleFileChange" style="display:none" />
          </label>
        </div>

        <div class="modal-actions">
          <button class="btn-outline-lg" @click="showModal = false">Cancelar</button>
          <button
            class="btn-primary-lg"
            @click="salvarDocumento"
            :disabled="uploading || !form.nome || !arquivoSelecionado"
          >
            <i v-if="uploading" class="ti ti-loader-2 spin"></i>
            <span v-else>Salvar Documento</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { padding: 2rem; background: var(--bg); min-height: 100vh; color: var(--text); font-family: var(--font-body); }
.header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
.page-title { font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; letter-spacing: -0.03em; }
.page-sub { color: var(--text3); font-size: 0.9rem; margin-top: 4px; }
.btn-primary { background: var(--green); color: #0a0f0d; border: none; padding: 10px 18px; border-radius: 30px; font-family: var(--font-body); font-weight: 700; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 6px; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.alert-info { background: #0e2a2e; border: 1px solid #0e4a5e; color: #22d3ee; padding: 12px 16px; border-radius: 12px; font-size: 0.88rem; display: flex; align-items: center; gap: 8px; margin-bottom: 1rem; }

/* Resumo de status */
.summary { display: grid; grid-template-columns: repeat(4,1fr); gap: 1rem; margin-bottom: 1.25rem; }
.sum-card { background: var(--surface); border: 1px solid var(--border); border-left: 3px solid var(--c); border-radius: 14px; padding: 1rem 1.25rem; display: flex; align-items: center; gap: 0.75rem; }
.sum-card .ti { font-size: 22px; color: var(--c); }
.sum-card strong { display: block; font-family: var(--font-display); font-size: 1.4rem; font-weight: 800; }
.sum-card span { font-size: 0.75rem; color: var(--text3); }

/* Filtros */
.filtros { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
.select-filtro { background: var(--surface); border: 1px solid var(--border); color: var(--text); padding: 9px 14px; border-radius: 10px; font-size: 0.85rem; font-family: var(--font-body); outline: none; }
.status-filtros { display: flex; gap: 6px; flex-wrap: wrap; }
.status-btn { background: var(--surface); border: 1px solid var(--border); color: var(--text3); padding: 6px 14px; border-radius: 20px; font-size: 0.8rem; cursor: pointer; font-family: var(--font-body); transition: all 0.2s; }
.status-btn.active, .status-btn:hover { border-color: var(--green); color: var(--green); }

.loading-state { display: flex; align-items: center; gap: 8px; color: var(--text3); padding: 3rem; justify-content: center; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 4rem 2rem; text-align: center; background: var(--surface); border: 2px dashed var(--border); border-radius: 20px; }
.empty-icon { width: 64px; height: 64px; background: var(--surface2); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 28px; color: var(--text3); }
.empty-state h3 { font-family: var(--font-display); font-size: 1.2rem; font-weight: 800; }
.empty-state p { color: var(--text3); font-size: 0.88rem; max-width: 380px; line-height: 1.6; }

/* Grid de documentos */
.docs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px,1fr)); gap: 1.25rem; }
.doc-card { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: 1.5rem; border-top: 3px solid var(--c); transition: border-color 0.2s; }
.doc-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.doc-icon { width: 40px; height: 40px; background: var(--surface2); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; color: var(--text2); }
.doc-status { font-size: 0.7rem; padding: 4px 10px; border-radius: 20px; display: flex; align-items: center; gap: 4px; font-weight: 500; white-space: nowrap; }
.doc-name { font-family: var(--font-display); font-size: 1rem; font-weight: 800; margin-bottom: 6px; }
.doc-tag { display: inline-block; background: var(--surface2); color: var(--text2); font-size: 0.72rem; padding: 3px 10px; border-radius: 8px; margin-bottom: 1rem; }
.doc-meta { display: flex; flex-direction: column; gap: 6px; margin-bottom: 1.25rem; }
.meta-row { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: var(--text3); }
.doc-actions { display: flex; gap: 6px; }
.btn-outline { flex: 1; background: transparent; border: 1px solid var(--border); color: var(--text2); padding: 8px; border-radius: 10px; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px; font-family: var(--font-body); text-decoration: none; transition: all 0.2s; }
.btn-outline:hover { border-color: var(--green); color: var(--green); }
.btn-outline.danger { flex: 0; padding: 8px 12px; }
.btn-outline.danger:hover { border-color: var(--red); color: var(--red); }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 1rem; }
.modal { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 1.75rem; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
.modal-header h3 { font-family: var(--font-display); font-size: 1.2rem; font-weight: 800; }
.modal-close { background: none; border: none; color: var(--text3); font-size: 20px; cursor: pointer; }
.field { margin-bottom: 1rem; }
.field label { display: block; font-size: 0.82rem; color: var(--text2); margin-bottom: 5px; }
.field input, .select-input { width: 100%; background: var(--surface2); border: 1px solid var(--border); color: var(--text); padding: 10px 14px; border-radius: 10px; font-size: 0.9rem; font-family: var(--font-body); outline: none; }
.field input:focus, .select-input:focus { border-color: var(--green); }
.field-hint { font-size: 0.72rem; color: var(--text3); margin-top: 4px; display: flex; align-items: center; gap: 3px; }
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

/* Área de upload de arquivo */
.file-drop { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; border: 2px dashed var(--border); border-radius: 12px; padding: 1.5rem; cursor: pointer; color: var(--text3); font-size: 0.85rem; transition: all 0.2s; text-align: center; }
.file-drop:hover { border-color: var(--green); color: var(--green); }
.file-drop .ti { font-size: 28px; }
.file-name { color: var(--green); font-weight: 500; word-break: break-all; }

.modal-actions { display: flex; gap: 10px; margin-top: 1.5rem; }
.btn-outline-lg { flex: 1; background: transparent; border: 1px solid var(--border); color: var(--text2); padding: 11px; border-radius: 10px; font-size: 0.9rem; cursor: pointer; font-family: var(--font-body); }
.btn-primary-lg { flex: 1; background: var(--green); color: #0a0f0d; border: none; padding: 11px; border-radius: 10px; font-size: 0.9rem; font-weight: 700; cursor: pointer; font-family: var(--font-body); display: flex; align-items: center; justify-content: center; gap: 6px; }
.btn-primary-lg:disabled { opacity: 0.6; cursor: not-allowed; }

.spin { animation: spin 1s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .page { padding: 1rem; }
  .summary { grid-template-columns: repeat(2,1fr); }
  .filtros { flex-direction: column; align-items: stretch; }
  .field-row { grid-template-columns: 1fr; }
}
</style>
