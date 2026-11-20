/**
 * SOSSEO CRM - Engine Comercial para Agência (Sites, Tráfego & CRM)
 * Documento de análise em ANALISE_PROJETO.md
 */
const STORAGE_KEY = 'sosseo_agency_crm_v3_clean';
const DELETED_IDS_KEY = STORAGE_KEY + '_deleted_ids';
const CLEARED_AT_KEY = STORAGE_KEY + '_cleared_at';
const SESSION_KEY = 'sosseo_user_session';
const COLUMNS = ['novo', 'respondido', 'reuniao', 'proposta', 'rejeitou', 'ganho'];

function getDeletedIds() {
  try { return JSON.parse(localStorage.getItem(DELETED_IDS_KEY) || '[]'); } catch(e) { return []; }
}
function addDeletedId(id) {
  if (!id) return;
  const list = getDeletedIds();
  const s = String(id);
  if (!list.includes(s)) {
    list.push(s);
    localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(list.slice(-1000)));
  }
}
function getClearedAt() {
  return Number(localStorage.getItem(CLEARED_AT_KEY) || '0') || 0;
}
function setClearedAt(ts) {
  localStorage.setItem(CLEARED_AT_KEY, String(ts));
}
function isDeletedOrClearedLead(l) {
  if (!l || isDemoLead(l)) return true;
  const deletedSet = new Set(getDeletedIds().map(String));
  if (l.id && deletedSet.has(String(l.id))) return true;
  const clearedAt = getClearedAt();
  if (clearedAt > 0 && l.createdAt) {
    const ts = new Date(l.createdAt).getTime();
    if (!isNaN(ts) && ts <= clearedAt) return true;
  }
  return false;
}

const STATUS_LABELS = {
  novo: '1. Novo Lead',
  respondido: '2. Respondido',
  reuniao: '3. Reunião / Diagnóstico',
  proposta: '4. Proposta Enviada',
  rejeitou: '5. Rejeitou',
  ganho: '6. Contrato Fechado'
};

// Sem leads fictícios de demonstração (100% limpo para produção)
const SEED_DATA = [];

let leads = [];
let currentUser = null;
let auditLogsCache = [];
let isDraggingCard = false;
let pendingLossDropLeadId = null;
let tempLeadHistory = [];

// ==========================================
// 1. AUTENTICAÇÃO E SESSÃO
// ==========================================
function checkSession() {
  const saved = localStorage.getItem(SESSION_KEY);
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
      updateUserHeaderUI();
      return true;
    } catch (e) {
      currentUser = null;
    }
  }
  showLoginModal();
  return false;
}

function showLoginModal() {
  const modal = document.getElementById('login-modal');
  if (modal) modal.style.display = 'flex';
  const err = document.getElementById('login-error');
  if (err) err.style.display = 'none';
}

function updateUserHeaderUI() {
  if (!currentUser) return;
  const loginModal = document.getElementById('login-modal');
  if (loginModal) loginModal.style.display = 'none';

  // Atualizar ID do usuário visível ao lado de + Novo Lead
  const idEl = document.getElementById('badge-user-id');
  if (idEl) idEl.textContent = currentUser.username || currentUser.id;

  const roleEl = document.getElementById('badge-role');
  if (roleEl) {
    roleEl.textContent = (currentUser.role || 'USER').toUpperCase();
    if (currentUser.role === 'admin') {
      roleEl.classList.add('admin');
    } else {
      roleEl.classList.remove('admin');
    }
  }

  // Exibir botão de gerenciar usuários apenas se for Administrador
  const btnUsers = document.getElementById('btn-manage-users');
  if (btnUsers) {
    btnUsers.style.display = currentUser.role === 'admin' ? 'inline-flex' : 'none';
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value.trim();
  const errDiv = document.getElementById('login-error');

  try {
    const res = await fetch('https://sosseo-crm.sosseosites.workers.dev/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (res.ok && data.success && data.user) {
      currentUser = data.user;
      localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
      updateUserHeaderUI();
      initCRMData();
    } else {
      errDiv.textContent = data.error || 'Usuário ou senha inválidos';
      errDiv.style.display = 'block';
    }
  } catch (err) {
    // Sem fallback local: a autenticação é feita SOMENTE pelo Worker central (sosseo-crm).
    errDiv.textContent = 'Erro ao conectar ao servidor de autenticação';
    errDiv.style.display = 'block';
  }
}

function logout() {
  if (confirm('Deseja realmente sair do CRM?')) {
    addAuditLog('logout', `Usuário '${currentUser?.username || ''}' encerrou a sessão.`);
    localStorage.removeItem(SESSION_KEY);
    currentUser = null;
    showLoginModal();
  }
}

// ==========================================
// 2. LOGS DE AUDITORIA (EXPIRAÇÃO DE 30 DIAS)
// ==========================================
async function addAuditLog(action, details) {
  if (!currentUser) return;
  const logData = {
    userId: currentUser.id,
    userName: currentUser.name || currentUser.username,
    action,
    details
  };

  try {
    fetch('https://sosseo-crm.sosseosites.workers.dev/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData)
    }).catch(() => {});
  } catch (e) {}
}

async function fetchAndRenderLogs() {
  const container = document.getElementById('logs-list-container');
  if (!container) return;
  container.innerHTML = '<div style="font-size: 12px; color: var(--text-muted); padding: 12px;">Carregando histórico...</div>';

  try {
    const res = await fetch('https://sosseo-crm.sosseosites.workers.dev/api/logs');
    if (res.ok) {
      const data = await res.json();
      auditLogsCache = Array.isArray(data.logs) ? data.logs : [];
    }
  } catch (e) {
    // fallback
  }

  renderLogsList();
}

function renderLogsList() {
  const container = document.getElementById('logs-list-container');
  if (!container) return;

  const query = (document.getElementById('logs-search')?.value || '').toLowerCase();
  const filtered = auditLogsCache.filter(log => {
    return (log.userName && log.userName.toLowerCase().includes(query)) ||
           (log.action && log.action.toLowerCase().includes(query)) ||
           (log.details && log.details.toLowerCase().includes(query));
  });

  if (filtered.length === 0) {
    container.innerHTML = '<div style="font-size: 12px; color: var(--text-muted); padding: 12px; text-align: center;">Nenhum registro de alteração encontrado nos últimos 30 dias.</div>';
    return;
  }

  container.innerHTML = filtered.map(log => {
    const dateStr = log.timestamp ? new Date(log.timestamp).toLocaleString('pt-BR') : 'Data não informada';
    return `
      <div class="log-item">
        <div class="log-item-header">
          <span class="log-item-user">👤 ${escapeHtml(log.userName || log.userId)}</span>
          <span class="log-item-time">🕒 ${dateStr}</span>
        </div>
        <div class="log-item-details">${escapeHtml(log.details)}</div>
      </div>
    `;
  }).join('');
}

function openLogsModal() {
  document.getElementById('logs-modal').style.display = 'flex';
  fetchAndRenderLogs();
}

// ==========================================
// 3. GERENCIAMENTO DE USUÁRIOS (APENAS ADMIN)
// ==========================================
async function openUsersModal() {
  if (!currentUser || currentUser.role !== 'admin') {
    alert('Acesso restrito: apenas Administradores podem gerenciar usuários.');
    return;
  }
  document.getElementById('users-modal').style.display = 'flex';
  fetchAndRenderUsers();
}

async function fetchAndRenderUsers() {
  const container = document.getElementById('users-table-container');
  if (!container) return;
  container.innerHTML = '<div style="font-size: 12px; color: var(--text-muted);">Carregando usuários...</div>';

  try {
    const res = await fetch('https://sosseo-crm.sosseosites.workers.dev/api/users');
    if (res.ok) {
      const data = await res.json();
      const users = Array.isArray(data.users) ? data.users : [];

      if (users.length === 0) {
        container.innerHTML = '<div style="font-size: 12px; color: var(--text-muted);">Nenhum usuário cadastrado.</div>';
        return;
      }

      container.innerHTML = users.map(u => {
        const isSelf = u.id === currentUser.id;
        const roleLabel = u.role === 'admin' ? '⭐ Administrador' : '👤 Usuário Comum';
        const deleteButton = (!isSelf && currentUser.role === 'admin')
          ? `<button class="btn-delete-user" onclick="deleteUser('${u.id}', '${escapeHtml(u.username)}')">🗑️ Excluir</button>`
          : `<span style="font-size: 11px; color: var(--text-muted); font-style: italic;">${isSelf ? '(Seu usuário)' : ''}</span>`;

        return `
          <div class="user-item-row">
            <div class="user-item-info">
              <span class="user-item-name">${escapeHtml(u.name)} (@${escapeHtml(u.username)})</span>
              <span class="user-item-meta">${roleLabel} &bull; ID: ${escapeHtml(u.id)}</span>
            </div>
            <div>${deleteButton}</div>
          </div>
        `;
      }).join('');
    }
  } catch (err) {
    container.innerHTML = '<div style="font-size: 12px; color: #b91c1c;">Erro ao carregar lista de usuários.</div>';
  }
}

async function handleCreateUser(e) {
  e.preventDefault();
  if (!currentUser || currentUser.role !== 'admin') {
    alert('Apenas administradores podem cadastrar usuários.');
    return;
  }

  const name = document.getElementById('new-user-name').value.trim();
  const username = document.getElementById('new-user-username').value.trim();
  const password = document.getElementById('new-user-password').value.trim();
  const role = document.getElementById('new-user-role').value;

  try {
    const res = await fetch('https://sosseo-crm.sosseosites.workers.dev/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        username,
        password,
        role,
        requesterRole: currentUser.role
      })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      alert(`Usuário '${username}' criado com sucesso com papel de ${role === 'admin' ? 'Administrador' : 'Usuário Comum'}!`);
      document.getElementById('new-user-form').reset();
      addAuditLog('usuario_criado', `Admin criou o usuário '${username}' com papel '${role}'.`);
      fetchAndRenderUsers();
    } else {
      alert(data.error || 'Erro ao criar usuário');
    }
  } catch (err) {
    alert('Erro de conexão ao criar usuário');
  }
}

async function deleteUser(userId, username) {
  if (!currentUser || currentUser.role !== 'admin') {
    alert('Apenas administradores podem excluir usuários.');
    return;
  }

  if (!confirm(`Tem certeza que deseja excluir o usuário '@${username}'? Esta ação removerá o acesso desta pessoa ao CRM.`)) {
    return;
  }

  try {
    const res = await fetch('https://sosseo-crm.sosseosites.workers.dev/api/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: userId,
        requesterRole: currentUser.role
      })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      alert(`Usuário '@${username}' excluído com sucesso!`);
      addAuditLog('usuario_excluido', `Admin excluiu o usuário '${username}' (ID: ${userId}).`);
      fetchAndRenderUsers();
    } else {
      alert(data.error || 'Erro ao excluir usuário');
    }
  } catch (err) {
    alert('Erro de conexão ao excluir usuário');
  }
}

// ==========================================
// 4. LIMPEZA DE CACHE & SINCRONIZAÇÃO
// ==========================================
function clearCacheAndSync() {
  if (confirm('Deseja limpar o cache local do navegador e sincronizar com o banco em nuvem da Cloudflare?')) {
    localStorage.removeItem(STORAGE_KEY);
    syncWithServer(true);
    alert('Cache local limpo! O CRM acabou de baixar os dados mais recentes diretamente da Cloudflare.');
  }
}

function clearAllCRMLeads() {
  if (!confirm('ATENÇÃO: Deseja excluir PERMANENTEMENTE todos os leads deste CRM (local e na nuvem Cloudflare)?')) {
    return;
  }
  const nowTs = Date.now();
  setClearedAt(nowTs);
  leads.forEach(l => { if (l && l.id) addDeletedId(l.id); });
  leads = [];
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  renderBoard();
  fetch('https://sosseo-crm.sosseosites.workers.dev/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'clear' })
  }).catch(() => {});
  addAuditLog('limpeza_total', 'Limpou todos os leads do CRM permanentemente.');
  alert('Todos os leads foram excluídos permanentemente do CRM e da nuvem!');
}

// ==========================================
// 5. INICIALIZAÇÃO E GESTÃO DE LEADS
// ==========================================
function normalizeLead(lead) {
  if (!lead) return lead;
  lead.company = String(lead.company || lead.nome || 'Sem Empresa');
  lead.contact = String(lead.contact || lead.nome || 'Visitante');
  lead.phone = String(lead.phone || lead.telefone || '');
  lead.service = String(lead.service || lead.servico || 'Criação de Site');
  if (lead.status === 'qualificacao') lead.status = 'respondido';
  if (lead.status === 'negociacao') lead.status = 'rejeitou';
  if (!COLUMNS.includes(lead.status)) lead.status = 'novo';

  // Garantir que o histórico exista como array independente (cópia isolada)
  if (!Array.isArray(lead.history)) {
    lead.history = [
      {
        id: 'hist-' + (lead.id || Date.now()),
        timestamp: lead.createdAt || new Date().toISOString(),
        user: 'Sistema',
        type: 'created',
        text: `Lead registrado no CRM (Origem: ${lead.source || 'Site'}).`
      }
    ];
  } else {
    lead.history = [...lead.history];
  }
  return lead;
}

function isDemoLead(l) {
  return !l || ["lead-1","lead-2","lead-3","lead-4","lead-5","lead-1791292021620"].includes(l.id);
}

function initCRMData() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      leads = JSON.parse(stored).filter(l => !isDeletedOrClearedLead(l)).map(normalizeLead);
    } catch (e) {
      leads = [];
    }
  } else {
    leads = [];
  }
  renderBoard();
  setupColumnDragAndDrop();
  setupModalEventListeners();
  syncWithServer();
  setInterval(syncWithServer, 20000); // Sincroniza a cada 20 segundos
}

function setupModalEventListeners() {
  // Alternar campo de motivo da perda quando o status for alterado no select do lead
  const statusSelect = document.getElementById('lead-status');
  if (statusSelect) {
    statusSelect.addEventListener('change', () => {
      const wrapLoss = document.getElementById('wrap-loss-reason');
      if (wrapLoss) {
        wrapLoss.style.display = statusSelect.value === 'rejeitou' ? 'grid' : 'none';
      }
    });
  }

  // Permitir registrar nota com Enter no campo de ação rápida
  const newHistInput = document.getElementById('new-history-text');
  if (newHistInput) {
    newHistInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addManualHistoryAction();
      }
    });
  }
}

async function syncWithServer(forceRender = false) {
  try {
    const res = await fetch('https://sosseo-crm.sosseosites.workers.dev/api/leads');
    if (res.ok) {
      const data = await res.json();
      if (data.meta) {
        if (Array.isArray(data.meta.deletedIds)) {
          data.meta.deletedIds.forEach(id => addDeletedId(id));
        }
        if (Number(data.meta.clearedAt) > getClearedAt()) {
          setClearedAt(Number(data.meta.clearedAt));
        }
      }
      if (Array.isArray(data.leads)) {
        const cleanServerLeads = data.leads.filter(l => !isDeletedOrClearedLead(l)).map(normalizeLead);
        const serverJson = JSON.stringify(cleanServerLeads);
        const localJson = JSON.stringify(leads);
        if (serverJson !== localJson || forceRender) {
          leads = cleanServerLeads;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
          renderBoard();
        }
      }
    }
  } catch (err) {}
}

function deleteCurrentLead() {
  const id = document.getElementById('lead-id').value;
  if (!id) return;

  const lead = leads.find(l => l.id === id);
  const companyName = lead ? lead.company : 'este lead';

  if (!confirm(`Deseja realmente excluir o lead "${companyName}"? Esta ação removerá a oportunidade permanentemente.`)) {
    return;
  }

  addDeletedId(id);
  leads = leads.filter(l => l.id !== id);
  fetch('https://sosseo-crm.sosseosites.workers.dev/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete', id })
  }).catch(() => {});
  saveToStorage();
  closeModal('lead-modal');
  renderBoard();
  addAuditLog('lead_excluido', `Excluiu permanentemente o lead '${companyName}'.`);
  alert(`Lead "${companyName}" foi excluído com sucesso!`);
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
  fetch('https://sosseo-crm.sosseosites.workers.dev/api/leads', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ leads })
  }).catch(() => {});
}

// Renderização do Kanban e Métricas
function renderBoard() {
  COLUMNS.forEach(col => {
    const el = document.getElementById(`cards-${col}`);
    if (el) el.innerHTML = '';
    const countEl = document.getElementById(`count-${col}`);
    if (countEl) countEl.textContent = '0';
  });

  const searchTerm = (document.getElementById('search-input')?.value || '').toLowerCase();
  const serviceFilter = document.getElementById('filter-service')?.value || 'all';

  let totalPropostasValue = 0;
  let countPropostas = 0;
  let countReuniaoEProposta = 0;
  let countFechados = 0;
  let countRejeitados = 0;

  leads.forEach(lead => {
    normalizeLead(lead);

    const val = Number(lead.value) || 0;
    if (lead.status === 'proposta') {
      countPropostas++;
      totalPropostasValue += val;
    }
    if (lead.status === 'reuniao' || lead.status === 'proposta') {
      countReuniaoEProposta++;
    }
    if (lead.status === 'ganho') {
      countFechados++;
    }
    if (lead.status === 'rejeitou') {
      countRejeitados++;
    }

    const matchesSearch = lead.company.toLowerCase().includes(searchTerm) ||
                          lead.contact.toLowerCase().includes(searchTerm) ||
                          (lead.notes && lead.notes.toLowerCase().includes(searchTerm)) ||
                          (lead.lossReason && lead.lossReason.toLowerCase().includes(searchTerm));
    const matchesService = (serviceFilter === 'all') || (lead.service === serviceFilter);

    if (!matchesSearch || !matchesService) return;

    const container = document.getElementById(`cards-${lead.status}`);
    if (container) {
      const card = createCardElement(lead);
      container.appendChild(card);
    }
  });

  COLUMNS.forEach(col => {
    const container = document.getElementById(`cards-${col}`);
    const countEl = document.getElementById(`count-${col}`);
    if (container && countEl) {
      countEl.textContent = container.children.length;
    }
  });

  // Atualizar as 5 Métricas
  const elTotal = document.getElementById('metric-total');
  if (elTotal) elTotal.textContent = leads.length;

  const elPropostas = document.getElementById('metric-propostas');
  if (elPropostas) {
    elPropostas.textContent = totalPropostasValue > 0
      ? totalPropostasValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : (countPropostas > 0 ? `${countPropostas}` : 'R$ 0,00');
    elPropostas.title = `${countPropostas} proposta(s) no pipeline`;
  }

  const elReunioes = document.getElementById('metric-reunioes');
  if (elReunioes) elReunioes.textContent = countReuniaoEProposta;

  const elFechados = document.getElementById('metric-fechados');
  if (elFechados) elFechados.textContent = countFechados;

  const elRejeitados = document.getElementById('metric-rejeitados');
  if (elRejeitados) elRejeitados.textContent = countRejeitados;
}

function createCardElement(lead) {
  normalizeLead(lead);
  const div = document.createElement('div');
  div.className = 'lead-card';
  div.draggable = true;
  div.dataset.id = lead.id;

  div.addEventListener('dragstart', (e) => {
    isDraggingCard = true;
    e.dataTransfer.setData('text/plain', lead.id);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => div.classList.add('dragging'), 0);
  });

  div.addEventListener('dragend', () => {
    div.classList.remove('dragging');
    setTimeout(() => { isDraggingCard = false; }, 80);
  });

  div.onclick = () => {
    if (isDraggingCard) return;
    openEditLeadModal(lead.id);
  };

  const sourceTagClass = lead.source === 'WhatsApp' ? 'tag-whatsapp' : (lead.source === 'Site' ? 'tag-site' : 'tag-indicacao');
  const formattedVal = (Number(lead.value) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const historyList = Array.isArray(lead.history) ? lead.history : [];
  const notesCount = historyList.filter(h => h.type === 'note').length;
  const historyCount = historyList.length;

  // Tag visual de motivo de perda se estiver rejeitado
  const lossTagHtml = (lead.status === 'rejeitou' && lead.lossReason)
    ? `<div class="card-loss-tag" title="${escapeHtml(lead.lossDetail ? `${lead.lossReason} - ${lead.lossDetail}` : lead.lossReason)}">❌ ${escapeHtml(lead.lossReason)}</div>`
    : '';

  const badgeHtml = notesCount > 0
    ? `<span class="card-notes-badge" title="${notesCount} anotação(ões) exclusiva(s) deste lead (${historyCount} eventos no histórico)">💬 ${notesCount} nota${notesCount > 1 ? 's' : ''}</span>`
    : `<span class="card-history-badge" title="${historyCount} registro(s) de atividade no histórico deste cliente">📋 ${historyCount}</span>`;

  div.innerHTML = `
    <div class="card-top">
      <div class="card-company">${escapeHtml(lead.company)}</div>
      <span class="card-source-tag ${sourceTagClass}">${escapeHtml(lead.source)}</span>
    </div>
    <div class="card-contact">
      👤 ${escapeHtml(lead.contact)} &bull; ${escapeHtml(lead.phone)}
    </div>
    <div class="card-service">
      🚀 ${escapeHtml(lead.service)}
    </div>
    ${lossTagHtml}
    <div class="card-footer">
      <span class="card-value">${formattedVal}</span>
      <div style="display: flex; align-items: center; gap: 8px;">
        ${badgeHtml}
        <span style="font-size: 10px; color: var(--accent-blue); font-weight: 600;">▾</span>
      </div>
    </div>
  `;
  return div;
}

function setupColumnDragAndDrop() {
  const columns = document.querySelectorAll('.kanban-column');
  columns.forEach(col => {
    const cardsContainer = col.querySelector('.column-cards');
    if (!cardsContainer) return;

    col.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      cardsContainer.classList.add('drag-over');
    });

    col.addEventListener('dragleave', (e) => {
      if (!col.contains(e.relatedTarget)) {
        cardsContainer.classList.remove('drag-over');
      }
    });

    col.addEventListener('drop', (e) => {
      e.preventDefault();
      cardsContainer.classList.remove('drag-over');
      const leadId = e.dataTransfer.getData('text/plain');
      const targetStatus = col.dataset.status;

      if (!leadId || !targetStatus) return;

      const lead = leads.find(l => l.id === leadId);
      if (!lead) return;

      // Se soltar na mesma coluna, nada faz
      if (lead.status === targetStatus) return;

      // Interceptação: se for arrastado para 'rejeitou', abrir modal obrigatório de motivo de perda!
      if (targetStatus === 'rejeitou') {
        openLossPrompt(leadId);
        return;
      }

      // Mudança normal para outras colunas
      const oldStatus = lead.status;
      lead.status = targetStatus;
      normalizeLead(lead);

      const currentUserName = currentUser?.name || currentUser?.username || 'Usuário';
      lead.history.unshift({
        id: 'hist-' + Date.now(),
        timestamp: new Date().toISOString(),
        user: currentUserName,
        type: 'status',
        text: `Moveu o lead da etapa '${STATUS_LABELS[oldStatus] || oldStatus}' para '${STATUS_LABELS[targetStatus] || targetStatus}'.`
      });

      saveToStorage();
      renderBoard();
      addAuditLog('lead_movido', `Moveu o lead '${lead.company}' da etapa '${oldStatus}' para '${targetStatus}'.`);
    });
  });
}

// ==========================================
// 6. PROMPT RÁPIDO DE MOTIVO DA PERDA (DRAG & DROP)
// ==========================================
function openLossPrompt(leadId) {
  const lead = leads.find(l => l.id === leadId);
  if (!lead) return;

  pendingLossDropLeadId = leadId;
  const modal = document.getElementById('loss-prompt-modal');
  const infoEl = document.getElementById('loss-prompt-lead-info');
  const reasonSelect = document.getElementById('prompt-loss-reason');
  const detailInput = document.getElementById('prompt-loss-detail');

  if (infoEl) {
    infoEl.innerHTML = `Lead: <strong>${escapeHtml(lead.company)}</strong> &bull; Decisor: ${escapeHtml(lead.contact)}`;
  }
  if (reasonSelect) reasonSelect.value = lead.lossReason || '';
  if (detailInput) detailInput.value = lead.lossDetail || '';

  if (modal) modal.style.display = 'flex';
}

function closeLossPrompt(confirmed = false) {
  const modal = document.getElementById('loss-prompt-modal');
  if (modal) modal.style.display = 'none';
  if (!confirmed) {
    pendingLossDropLeadId = null;
  }
}

function confirmLossPrompt() {
  if (!pendingLossDropLeadId) return;

  const lead = leads.find(l => l.id === pendingLossDropLeadId);
  if (!lead) {
    closeLossPrompt(false);
    return;
  }

  const reasonSelect = document.getElementById('prompt-loss-reason');
  const detailInput = document.getElementById('prompt-loss-detail');
  const reason = reasonSelect ? reasonSelect.value : '';
  const detail = detailInput ? detailInput.value.trim() : '';

  if (!reason) {
    alert('Por favor, selecione o motivo da rejeição/perda para confirmar.');
    if (reasonSelect) reasonSelect.focus();
    return;
  }

  const oldStatus = lead.status;
  lead.status = 'rejeitou';
  lead.lossReason = reason;
  lead.lossDetail = detail;
  normalizeLead(lead);

  const currentUserName = currentUser?.name || currentUser?.username || 'Usuário';
  lead.history.unshift({
    id: 'hist-' + Date.now(),
    timestamp: new Date().toISOString(),
    user: currentUserName,
    type: 'loss',
    text: `Lead movido para '5. Rejeitou'. Motivo: ${reason}${detail ? ' (' + detail + ')' : ''}.`
  });

  saveToStorage();
  renderBoard();
  addAuditLog('lead_rejeitado', `Moveu o lead '${lead.company}' para Rejeitado. Motivo: ${reason}.`);

  closeLossPrompt(true);
  pendingLossDropLeadId = null;
}

// ==========================================
// 7. MANIPULAÇÃO DE LEADS NO MODAL PRINCIPAL
// ==========================================
function openNewLeadModal() {
  document.getElementById('modal-lead-title').textContent = 'Novo Lead Comercial';
  const targetCompanyEl = document.getElementById('lead-history-target-company');
  if (targetCompanyEl) targetCompanyEl.textContent = '(Novo Lead)';

  document.getElementById('lead-form').reset();
  document.getElementById('lead-id').value = '';
  document.getElementById('lead-status').value = 'novo';
  document.getElementById('lead-loss-reason').value = '';
  document.getElementById('lead-loss-detail').value = '';

  const wrapLoss = document.getElementById('wrap-loss-reason');
  if (wrapLoss) wrapLoss.style.display = 'none';

  const newHistInput = document.getElementById('new-history-text');
  if (newHistInput) newHistInput.value = '';

  tempLeadHistory = [];
  renderLeadHistoryTimeline({ history: tempLeadHistory });

  // Ocultar botão de excluir em criação
  const btnDelete = document.getElementById('btn-delete-lead');
  if (btnDelete) btnDelete.style.display = 'none';

  document.getElementById('lead-modal').style.display = 'flex';
}

function openEditLeadModal(id) {
  const lead = leads.find(l => l.id === id);
  if (!lead) return;

  normalizeLead(lead);

  // Limpar campo de nova anotação para não herdar de outro lead
  const newHistInput = document.getElementById('new-history-text');
  if (newHistInput) newHistInput.value = '';
  tempLeadHistory = [];

  document.getElementById('modal-lead-title').textContent = 'Editar Lead - ' + lead.company;
  const targetCompanyEl = document.getElementById('lead-history-target-company');
  if (targetCompanyEl) targetCompanyEl.textContent = lead.company;

  document.getElementById('lead-id').value = lead.id;
  document.getElementById('lead-company').value = lead.company;
  document.getElementById('lead-contact').value = lead.contact;
  document.getElementById('lead-phone').value = lead.phone;
  document.getElementById('lead-email').value = lead.email || '';
  document.getElementById('lead-service').value = lead.service;
  document.getElementById('lead-value').value = lead.value || '';
  document.getElementById('lead-status').value = lead.status;
  document.getElementById('lead-source').value = lead.source || 'Site';
  document.getElementById('lead-notes').value = lead.notes || '';

  // Motivo de Perda
  document.getElementById('lead-loss-reason').value = lead.lossReason || '';
  document.getElementById('lead-loss-detail').value = lead.lossDetail || '';

  const wrapLoss = document.getElementById('wrap-loss-reason');
  if (wrapLoss) {
    wrapLoss.style.display = lead.status === 'rejeitou' ? 'grid' : 'none';
  }

  // Renderizar linha do tempo de ações exclusiva deste lead
  renderLeadHistoryTimeline(lead);

  // Exibir botão de excluir na edição
  const btnDelete = document.getElementById('btn-delete-lead');
  if (btnDelete) btnDelete.style.display = 'inline-flex';

  document.getElementById('lead-modal').style.display = 'flex';
}

function saveLead(e) {
  e.preventDefault();
  const id = document.getElementById('lead-id').value;
  const newStatus = document.getElementById('lead-status').value;
  const lossReason = document.getElementById('lead-loss-reason').value;
  const lossDetail = document.getElementById('lead-loss-detail').value.trim();

  // Validação obrigatória se for Rejeitado
  if (newStatus === 'rejeitou' && !lossReason) {
    alert('Atenção: Por favor, selecione o Motivo da Rejeição / Perda para concluir.');
    document.getElementById('lead-loss-reason').focus();
    return;
  }

  const leadData = {
    company: document.getElementById('lead-company').value.trim(),
    contact: document.getElementById('lead-contact').value.trim(),
    phone: document.getElementById('lead-phone').value.trim(),
    email: document.getElementById('lead-email').value.trim(),
    service: document.getElementById('lead-service').value,
    value: Number(document.getElementById('lead-value').value) || 0,
    status: newStatus,
    source: document.getElementById('lead-source').value,
    notes: document.getElementById('lead-notes').value.trim(),
    lossReason: newStatus === 'rejeitou' ? lossReason : '',
    lossDetail: newStatus === 'rejeitou' ? lossDetail : ''
  };

  const currentUserName = currentUser?.name || currentUser?.username || 'Usuário';

  // Se o usuário digitou uma ação ou nota rápida e clicou diretamente em "Salvar Lead"
  const pendingInput = document.getElementById('new-history-text');
  const pendingActionText = (pendingInput?.value || '').trim();

  if (id) {
    const idx = leads.findIndex(l => l.id === id);
    if (idx !== -1) {
      const existing = leads[idx];
      normalizeLead(existing);
      const oldStatus = existing.status;
      const oldLossReason = existing.lossReason;

      // Se havia nota digitada no input rápido, registrar no histórico exclusivo deste lead
      if (pendingActionText) {
        existing.history.unshift({
          id: 'hist-' + Date.now(),
          timestamp: new Date().toISOString(),
          user: currentUserName,
          type: 'note',
          text: pendingActionText
        });
        addAuditLog('acao_registrada', `Registrou ação no lead '${leadData.company}': "${pendingActionText.slice(0, 60)}..."`);
        if (pendingInput) pendingInput.value = '';
      }

      // Registrar mudança de status na timeline do lead
      if (oldStatus !== newStatus) {
        if (newStatus === 'rejeitou') {
          existing.history.unshift({
            id: 'hist-' + (Date.now() + 1),
            timestamp: new Date().toISOString(),
            user: currentUserName,
            type: 'loss',
            text: `Status alterado para '5. Rejeitou'. Motivo: ${lossReason}${lossDetail ? ' (' + lossDetail + ')' : ''}.`
          });
        } else {
          existing.history.unshift({
            id: 'hist-' + (Date.now() + 1),
            timestamp: new Date().toISOString(),
            user: currentUserName,
            type: 'status',
            text: `Status alterado de '${STATUS_LABELS[oldStatus] || oldStatus}' para '${STATUS_LABELS[newStatus] || newStatus}'.`
          });
        }
      } else if (newStatus === 'rejeitou' && oldLossReason !== lossReason) {
        existing.history.unshift({
          id: 'hist-' + (Date.now() + 1),
          timestamp: new Date().toISOString(),
          user: currentUserName,
          type: 'loss',
          text: `Motivo de perda atualizado para: ${lossReason}${lossDetail ? ' (' + lossDetail + ')' : ''}.`
        });
      }

      leads[idx] = { ...existing, ...leadData, updatedAt: new Date().toISOString() };
      addAuditLog('lead_editado', `Atualizou o lead '${leadData.company}' (Status: ${STATUS_LABELS[leadData.status] || leadData.status}, Valor: R$ ${leadData.value}).`);
    }
  } else {
    // Lead novo
    const initialHistory = [
      {
        id: 'hist-' + Date.now(),
        timestamp: new Date().toISOString(),
        user: currentUserName,
        type: 'created',
        text: `Lead cadastrado manualmente no sistema (Origem: ${leadData.source}).`
      },
      ...(Array.isArray(tempLeadHistory) ? tempLeadHistory : [])
    ];

    if (pendingActionText) {
      initialHistory.unshift({
        id: 'hist-' + (Date.now() + 1),
        timestamp: new Date().toISOString(),
        user: currentUserName,
        type: 'note',
        text: pendingActionText
      });
      if (pendingInput) pendingInput.value = '';
    }

    if (newStatus === 'rejeitou') {
      initialHistory.unshift({
        id: 'hist-' + (Date.now() + 2),
        timestamp: new Date().toISOString(),
        user: currentUserName,
        type: 'loss',
        text: `Lead cadastrado diretamente como Rejeitado. Motivo: ${lossReason}${lossDetail ? ' (' + lossDetail + ')' : ''}.`
      });
    }

    const newLead = {
      id: 'lead-' + Date.now(),
      ...leadData,
      history: initialHistory,
      createdAt: new Date().toISOString()
    };
    leads.unshift(newLead);
    addAuditLog('lead_criado', `Cadastrou o novo lead '${leadData.company}' (Serviço: ${leadData.service}, Valor: R$ ${leadData.value}).`);
  }

  if (pendingInput) pendingInput.value = '';
  tempLeadHistory = [];
  saveToStorage();
  closeModal('lead-modal');
  renderBoard();
}

// ==========================================
// 8. HISTÓRICO & LINHA DO TEMPO DO LEAD
// ==========================================
function addManualHistoryAction() {
  const input = document.getElementById('new-history-text');
  const actionText = (input?.value || '').trim();
  if (!actionText) {
    alert('Por favor, digite a descrição da ação ou nota antes de registrar.');
    if (input) input.focus();
    return;
  }

  const leadId = document.getElementById('lead-id').value;
  const currentUserName = currentUser?.name || currentUser?.username || 'Usuário';

  const newEntry = {
    id: 'hist-' + Date.now(),
    timestamp: new Date().toISOString(),
    user: currentUserName,
    type: 'note',
    text: actionText
  };

  if (leadId) {
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      normalizeLead(lead);
      lead.history.unshift(newEntry);
      saveToStorage();
      renderLeadHistoryTimeline(lead);
      addAuditLog('acao_registrada', `Registrou ação no lead '${lead.company}': "${actionText.slice(0, 60)}..."`);
      renderBoard(); // Atualiza o contador de histórico no card
    }
  } else {
    // Lead novo antes de salvar
    if (!tempLeadHistory) tempLeadHistory = [];
    tempLeadHistory.unshift(newEntry);
    renderLeadHistoryTimeline({ history: tempLeadHistory });
  }

  input.value = '';
}

function renderLeadHistoryTimeline(lead) {
  const container = document.getElementById('lead-history-timeline');
  const countEl = document.getElementById('history-entries-count');
  if (!container) return;

  const history = Array.isArray(lead?.history) ? lead.history : [];
  if (countEl) countEl.textContent = `${history.length} registro(s)`;

  if (history.length === 0) {
    container.innerHTML = `
      <div style="font-size: 11.5px; color: var(--text-muted); padding: 12px; text-align: center; border: 1px dashed var(--border-color); border-radius: 6px;">
        Nenhuma atividade registrada ainda.<br>Toda alteração de etapa e ações comerciais adicionadas acima são gravadas automaticamente com data e horário.
      </div>
    `;
    return;
  }

  // Ordenar decrescente: ação mais recente sempre no topo
  const sorted = [...history].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  container.innerHTML = sorted.map(item => {
    const d = item.timestamp ? new Date(item.timestamp) : new Date();
    const dateFormatted = d.toLocaleDateString('pt-BR');
    const timeFormatted = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const fullDateStr = `${dateFormatted} às ${timeFormatted}`;

    let icon = '💬';
    let typeClass = 'type-note';
    if (item.type === 'loss') {
      icon = '❌';
      typeClass = 'type-loss';
    } else if (item.type === 'status') {
      icon = '🔄';
      typeClass = 'type-status';
    } else if (item.type === 'created') {
      icon = '🚀';
      typeClass = 'type-created';
    }

    return `
      <div class="history-item ${typeClass}">
        <div class="history-item-icon">${icon}</div>
        <div class="history-item-body">
          <div class="history-item-header">
            <span class="history-item-author">👤 ${escapeHtml(item.user || 'Usuário')}</span>
            <span class="history-item-time">🕒 ${fullDateStr}</span>
          </div>
          <div class="history-item-text">${escapeHtml(item.text)}</div>
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================
// 9. CONFIGURAÇÃO DE WHATSAPP (CALLMEBOT)
// ==========================================
async function openWhatsAppModal() {
  const modal = document.getElementById('whatsapp-modal');
  if (!modal) return;
  modal.style.display = 'flex';

  // Buscar configurações salvas do servidor
  try {
    const res = await fetch('https://sosseo-crm.sosseosites.workers.dev/api/settings/whatsapp');
    if (res.ok) {
      const data = await res.json();
      const phoneInput = document.getElementById('whatsapp-phone');
      const apikeyInput = document.getElementById('whatsapp-apikey');
      const enabledCheckbox = document.getElementById('whatsapp-enabled');

      if (phoneInput && data.phone) phoneInput.value = data.phone;
      if (apikeyInput && data.hasApiKey) {
        apikeyInput.placeholder = 'Chave configurada na nuvem (deixe em branco para manter)';
      }
      if (enabledCheckbox) enabledCheckbox.checked = data.enabled !== false;
    }
  } catch (e) {
    console.warn('Erro ao carregar configurações de WhatsApp:', e);
  }
}

async function saveWhatsAppSettings(e) {
  e.preventDefault();
  const phone = (document.getElementById('whatsapp-phone')?.value || '').trim();
  const apikey = (document.getElementById('whatsapp-apikey')?.value || '').trim();
  const enabled = document.getElementById('whatsapp-enabled')?.checked ?? true;

  if (!phone) {
    alert('Por favor, informe seu número de WhatsApp.');
    return;
  }

  try {
    const res = await fetch('https://sosseo-crm.sosseosites.workers.dev/api/settings/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, apikey, enabled })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      alert('Configurações de alerta no WhatsApp salvas com sucesso na nuvem!');
      closeModal('whatsapp-modal');
      addAuditLog('whatsapp_config', `Atualizou as configurações de alerta instantâneo no WhatsApp.`);
    } else {
      alert(data.error || 'Erro ao salvar configurações.');
    }
  } catch (err) {
    alert('Erro de conexão ao salvar configurações de WhatsApp.');
  }
}

async function testWhatsAppNotification() {
  const phone = (document.getElementById('whatsapp-phone')?.value || '').trim();
  if (!phone) {
    alert('Por favor, informe seu número de WhatsApp com DDD antes de testar.');
    return;
  }

  try {
    // Se preencheu nova apikey ou mudou status, salva primeiro
    const apikey = (document.getElementById('whatsapp-apikey')?.value || '').trim();
    const enabled = document.getElementById('whatsapp-enabled')?.checked ?? true;
    if (apikey || phone) {
      await fetch('https://sosseo-crm.sosseosites.workers.dev/api/settings/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, apikey, enabled })
      });
    }

    const res = await fetch('https://sosseo-crm.sosseosites.workers.dev/api/settings/whatsapp/test', { method: 'POST' });
    const data = await res.json();
    if (res.ok && data.success) {
      alert('✅ Mensagem de teste disparada com sucesso! Verifique seu WhatsApp.');
    } else {
      alert('Erro ao disparar teste: ' + (data.error || 'Verifique se seu número e ApiKey estão corretos.'));
    }
  } catch (err) {
    alert('Erro de conexão ao disparar teste de WhatsApp.');
  }
}

// ==========================================
// 10. UTILITÁRIOS E EXPORTAÇÃO
// ==========================================
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.style.display = 'none';
  if (modalId === 'lead-modal') {
    const newHistInput = document.getElementById('new-history-text');
    if (newHistInput) newHistInput.value = '';
    tempLeadHistory = [];
  }
}

function filterCards() {
  renderBoard();
}

function exportToCSV() {
  let csv = 'ID,Empresa,Contato,Telefone,Email,Servico,Valor,Status,MotivoPerda,Origem,AcoesRegistradas,Data\n';
  leads.forEach(l => {
    const histCount = Array.isArray(l.history) ? l.history.length : 0;
    csv += `"${l.id}","${l.company}","${l.contact}","${l.phone}","${l.email || ''}","${l.service}","${l.value}","${l.status}","${l.lossReason || ''}","${l.source}","${histCount}","${l.createdAt}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `leads_sosseo_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  addAuditLog('export_csv', `Exportou relatório de leads em CSV com histórico e motivos de perda.`);
}

function openIntegrationModal() {
  document.getElementById('integration-modal').style.display = 'flex';
}

function copyIntegrationCode() {
  const code = document.getElementById('script-code').innerText;
  navigator.clipboard.writeText(code).then(() => {
    alert('Código copiado com sucesso! Basta colar no seu WordPress.');
  });
}

function simulateIncomingLead() {
  const randomCompanies = ['Clínica Médica BellaVida', 'Escritório Contábil Souza & Ramos', 'Indústria de Embalagens PackSul', 'AutoPeças Central'];
  const randomServices = ['Criação de Site', 'Gestão de Tráfego & SEO', 'Implantação de CRM', 'Solução Completa'];
  const randomCompany = randomCompanies[Math.floor(Math.random() * randomCompanies.length)];
  const randomService = randomServices[Math.floor(Math.random() * randomServices.length)];

  const simLead = {
    id: 'sim-' + Date.now(),
    company: randomCompany,
    contact: 'Decisor Comercial (Clique no WhatsApp)',
    phone: '(11) 98555-1234',
    email: 'contato@' + randomCompany.toLowerCase().replace(/[^a-z]/g, '') + '.com.br',
    service: randomService,
    value: Math.floor(Math.random() * 4000) + 2500,
    status: 'novo',
    source: 'WhatsApp',
    notes: 'Lead simulado: visitante clicou no botão do WhatsApp na página da SOSSEO buscando ' + randomService + '.',
    history: [
      {
        id: 'hist-' + Date.now(),
        timestamp: new Date().toISOString(),
        user: 'Sistema',
        type: 'created',
        text: 'Lead recebido através de clique no botão de WhatsApp do site sosseo.com.br.'
      }
    ],
    createdAt: new Date().toISOString()
  };

  leads.unshift(simLead);
  saveToStorage();
  closeModal('integration-modal');
  renderBoard();
  addAuditLog('lead_simulado', `Lead de teste recebido da ${randomCompany}.`);
  alert(`Novo lead da ${randomCompany} recebido com sucesso no CRM!`);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, function(m) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  });
}

// Iniciar ao carregar com verificação de login
window.addEventListener('DOMContentLoaded', () => {
  if (checkSession()) {
    initCRMData();
  }
});

// ==========================================
// 11. SITES MONITORADOS (fonte: /js/sites-sosseo.js)
// Consulta somente leitura em cada site. Nenhum token é versionado:
// o operador digita e o valor fica no localStorage deste navegador.
// ==========================================
const SITE_TOKEN_PREFIX = 'sosseo_site_token_';
let currentSiteKey = null;
let currentSiteLeads = [];
let siteStatusCache = {};

function getPanelSites() {
  return Array.isArray(window.SOSSEO_SITES) ? window.SOSSEO_SITES : [];
}

function getSiteToken(key) {
  try { return localStorage.getItem(SITE_TOKEN_PREFIX + key) || ''; } catch (e) { return ''; }
}

function storeSiteToken(key, value) {
  try {
    if (value) localStorage.setItem(SITE_TOKEN_PREFIX + key, value);
    else localStorage.removeItem(SITE_TOKEN_PREFIX + key);
  } catch (e) {}
}

function siteAuthLabel(site) {
  if (site.auth === 'public') return 'Endpoint público';
  if (site.auth === 'token') return 'Token no parâmetro (?token=)';
  return 'Token Bearer (Authorization)';
}

function openSitesModal() {
  const modal = document.getElementById('sites-modal');
  if (!modal) return;
  modal.style.display = 'flex';
  renderSitesList();
  refreshSitesStatus();
}

function renderSitesList() {
  const wrap = document.getElementById('sites-list');
  if (!wrap) return;
  const sites = getPanelSites();
  wrap.innerHTML = '';

  sites.forEach(function (site) {
    const card = document.createElement('div');
    card.className = 'site-card';
    card.id = 'site-card-' + site.key;

    const temToken = !!getSiteToken(site.key);
    const precisaToken = site.auth !== 'public';
    const painelLink = site.painelUrl
      ? '<a class="btn btn-secondary" href="' + escapeHtml(site.painelUrl) + '" target="_blank" rel="noopener" title="Abrir o CRM deste site">CRM do site ↗</a>'
      : '';

    card.innerHTML =
      '<div class="site-card-head">' +
        '<span class="site-dot" id="site-dot-' + site.key + '"></span>' +
        '<div class="site-ident">' +
          '<div class="site-name">' + escapeHtml(site.nome) + '</div>' +
          '<a class="site-domain" href="' + escapeHtml(site.siteUrl) + '" target="_blank" rel="noopener">' + escapeHtml(site.dominio) + '</a>' +
        '</div>' +
      '</div>' +
      '<div class="site-meta">' + escapeHtml(site.segmento || '') + ' · ' + escapeHtml(siteAuthLabel(site)) + '</div>' +
      (precisaToken
        ? '<div class="site-token-row">' +
            '<input type="password" class="form-control site-token-input" id="site-token-' + site.key + '" autocomplete="off" ' +
              'placeholder="' + (temToken ? '•••••• token salvo neste navegador' : 'Token de leitura (exigido pelo site)') + '">' +
            '<button type="button" class="btn btn-secondary" onclick="saveSiteToken(\'' + site.key + '\')" title="Salvar o token apenas neste navegador">Salvar</button>' +
            (temToken ? '<button type="button" class="btn btn-secondary" onclick="clearSiteToken(\'' + site.key + '\')" title="Remover o token deste navegador">Limpar</button>' : '') +
          '</div>'
        : '') +
      '<div class="site-actions">' +
        painelLink +
        '<button type="button" class="btn btn-primary" onclick="loadSiteLeads(\'' + site.key + '\')">Ver leads</button>' +
      '</div>' +
      '<div class="site-status" id="site-status-' + site.key + '">Aguardando verificação…</div>';

    wrap.appendChild(card);
  });

  const summary = document.getElementById('sites-summary');
  if (summary) {
    summary.textContent = sites.length + ' sites cadastrados · ' +
      sites.filter(function (s) { return s.auth === 'public'; }).length + ' sem token · ' +
      sites.filter(function (s) { return s.auth !== 'public'; }).length + ' com token de leitura';
  }
}

function saveSiteToken(key) {
  const input = document.getElementById('site-token-' + key);
  if (!input) return;
  const valor = (input.value || '').trim();
  if (!valor) {
    alert('Digite o token de leitura antes de salvar.');
    return;
  }
  storeSiteToken(key, valor);
  input.value = '';
  input.placeholder = '•••••• token salvo neste navegador';
  renderSitesList();
  refreshSitesStatus();
  addAuditLog('site_token', 'Configurou token local de leitura do site ' + key + '.');
}

function clearSiteToken(key) {
  storeSiteToken(key, '');
  renderSitesList();
  refreshSitesStatus();
  addAuditLog('site_token', 'Removeu o token local de leitura do site ' + key + '.');
}

function setSiteStatus(key, state, text) {
  const dot = document.getElementById('site-dot-' + key);
  const label = document.getElementById('site-status-' + key);
  const map = { online: 'on', auth: 'warn', invalid: 'err', offline: 'err', pending: 'wait' };
  if (dot) dot.className = 'site-dot ' + (map[state] || 'wait');
  if (label) {
    label.textContent = text;
    label.className = 'site-status ' + (state === 'online' ? 'ok' : (state === 'auth' || state === 'pending' ? 'warn' : 'err'));
  }
}

function buildSiteRequestUrl(site, token) {
  const url = site.leadsApi;
  if (site.auth === 'token' && token) {
    return url + (url.indexOf('?') === -1 ? '?' : '&') + 'token=' + encodeURIComponent(token);
  }
  return url;
}

async function fetchSiteLeads(site, timeoutMs) {
  const token = getSiteToken(site.key);
  if (site.auth !== 'public' && !token) {
    const erro = new Error('token-ausente');
    erro.code = 'token';
    throw erro;
  }

  const ctrl = new AbortController();
  const timer = setTimeout(function () { ctrl.abort(); }, timeoutMs || 12000);
  const opts = { signal: ctrl.signal, headers: {}, cache: 'no-store' };
  if (site.auth === 'bearer' && token) opts.headers.Authorization = 'Bearer ' + token;

  try {
    const res = await fetch(buildSiteRequestUrl(site, token), opts);
    if (res.status === 401 || res.status === 403) {
      const erro = new Error('nao-autorizado');
      erro.code = 'invalid';
      throw erro;
    }
    if (!res.ok) {
      const erro = new Error('HTTP ' + res.status);
      erro.code = 'http';
      throw erro;
    }
    const json = await res.json();
    const lista = Array.isArray(json) ? json : (Array.isArray(json.leads) ? json.leads : []);
    return lista.filter(function (l) { return l && typeof l === 'object'; });
  } catch (erro) {
    if (erro.name === 'AbortError') {
      const e = new Error('timeout');
      e.code = 'offline';
      throw e;
    }
    throw erro;
  } finally {
    clearTimeout(timer);
  }
}

async function refreshSitesStatus() {
  const sites = getPanelSites();
  await Promise.all(sites.map(async function (site) {
    if (site.auth !== 'public' && !getSiteToken(site.key)) {
      siteStatusCache[site.key] = { state: 'auth', total: 0 };
      setSiteStatus(site.key, 'auth', 'Token não configurado — cole o token acima para consultar.');
      return;
    }
    setSiteStatus(site.key, 'pending', 'Verificando conexão…');
    try {
      const lista = await fetchSiteLeads(site, 10000);
      siteStatusCache[site.key] = { state: 'online', total: lista.length };
      setSiteStatus(site.key, 'online', 'Online · ' + lista.length + ' lead(s) na origem.');
    } catch (erro) {
      if (erro.code === 'invalid') {
        siteStatusCache[site.key] = { state: 'invalid', total: 0 };
        setSiteStatus(site.key, 'invalid', 'Token inválido ou expirado (401).');
      } else if (erro.code === 'token') {
        siteStatusCache[site.key] = { state: 'auth', total: 0 };
        setSiteStatus(site.key, 'auth', 'Token não configurado.');
      } else {
        siteStatusCache[site.key] = { state: 'offline', total: 0 };
        setSiteStatus(site.key, 'offline', 'Sem resposta agora (' + (erro.message === 'timeout' ? 'timeout' : erro.message) + ').');
      }
    }
  }));
}

function siteLeadDate(value) {
  if (!value) return '';
  const d = typeof value === 'number' ? new Date(value) : new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function normalizeSiteLead(site, l) {
  const veiculo = [l.veiculo || l.vehicle || '', l.ano || ''].filter(Boolean).join(' ');
  return {
    site: site.nome,
    siteKey: site.key,
    id: String(l.id || ''),
    nome: String(l.nome || l.contact || l.company || 'Sem nome'),
    telefone: String(l.whatsapp || l.telefone || l.phone || ''),
    cidade: String(l.cidade || l.bairro || ''),
    unidade: String(l.unidadeNome || l.unidade || ''),
    veiculo: String(veiculo),
    servico: String(l.servico || l.service || ''),
    sintoma: String(l.sintoma || ''),
    mensagem: String(l.mensagem || l.observacao || l.notes || ''),
    origem: String(l.origem || ''),
    data: siteLeadDate(l.criadoEm || l.timestamp || l.createdAt || l.data)
  };
}

async function loadSiteLeads(key) {
  const site = getPanelSites().find(function (s) { return s.key === key; });
  if (!site) return;

  const panel = document.getElementById('site-leads-panel');
  const wrap = document.getElementById('site-leads-table-wrap');
  const titulo = document.getElementById('site-leads-title');
  const sub = document.getElementById('site-leads-sub');
  if (!panel || !wrap) return;

  panel.style.display = 'block';
  if (titulo) titulo.textContent = 'Leads · ' + site.nome;
  if (sub) sub.textContent = site.dominio + ' — consulta somente leitura (' + siteLeadAuthTexto(site) + ')';
  wrap.innerHTML = '<div class="site-leads-empty">Buscando leads em ' + escapeHtml(site.dominio) + '…</div>';
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  try {
    const lista = await fetchSiteLeads(site, 15000);
    currentSiteKey = key;
    currentSiteLeads = lista.map(function (l) { return normalizeSiteLead(site, l); });
    setSiteStatus(key, 'online', 'Online · ' + lista.length + ' lead(s) na origem.');
    renderSiteLeadsTable();
    addAuditLog('site_leads', 'Consultou ' + lista.length + ' lead(s) do site ' + site.dominio + '.');
  } catch (erro) {
    currentSiteKey = key;
    currentSiteLeads = [];
    let msg = 'Não foi possível consultar este site agora.';
    if (erro.code === 'token') msg = 'Este site exige token de leitura. Salve o token no cartão acima e tente novamente.';
    else if (erro.code === 'invalid') msg = 'Token inválido ou expirado (HTTP 401). Atualize o token no cartão acima.';
    else if (erro.message === 'timeout') msg = 'O site não respondeu no tempo esperado (timeout).';
    else if (erro.message) msg = 'Falha na consulta: ' + erro.message;
    wrap.innerHTML = '<div class="site-leads-empty err">' + escapeHtml(msg) + '</div>';
    setSiteStatus(key, erro.code === 'invalid' ? 'invalid' : (erro.code === 'token' ? 'auth' : 'offline'), msg);
  }
}

function siteLeadAuthTexto(site) {
  if (site.auth === 'public') return 'endpoint público';
  if (site.auth === 'token') return 'token no parâmetro';
  return 'token Bearer';
}

function renderSiteLeadsTable() {
  const wrap = document.getElementById('site-leads-table-wrap');
  if (!wrap) return;

  if (!currentSiteLeads.length) {
    wrap.innerHTML = '<div class="site-leads-empty">Nenhum lead registrado na origem deste site.</div>';
    return;
  }

  const limite = 200;
  const visiveis = currentSiteLeads.slice(0, limite);
  let html = '<table class="site-leads-table"><thead><tr>' +
    '<th>Data</th><th>Nome</th><th>Telefone</th><th>Cidade / Unidade</th><th>Veículo / Serviço</th><th>Sintoma / Mensagem</th>' +
    '</tr></thead><tbody>';

  visiveis.forEach(function (l) {
    const local = [l.cidade, l.unidade].filter(Boolean).join(' · ');
    const alvo = [l.veiculo, l.servico].filter(Boolean).join(' · ');
    const texto = [l.sintoma, l.mensagem].filter(Boolean).join(' — ');
    html += '<tr>' +
      '<td class="nowrap">' + escapeHtml(l.data || '—') + '</td>' +
      '<td><strong>' + escapeHtml(l.nome) + '</strong>' + (l.origem ? '<div class="site-lead-origem">' + escapeHtml(l.origem) + '</div>' : '') + '</td>' +
      '<td class="nowrap">' + escapeHtml(l.telefone || '—') + '</td>' +
      '<td>' + escapeHtml(local || '—') + '</td>' +
      '<td>' + escapeHtml(alvo || '—') + '</td>' +
      '<td class="site-lead-msg">' + escapeHtml(texto || '—') + '</td>' +
      '</tr>';
  });

  html += '</tbody></table>';
  if (currentSiteLeads.length > limite) {
    html += '<div class="site-leads-empty">Exibindo os ' + limite + ' primeiros de ' + currentSiteLeads.length + ' leads. O CSV do site inclui todos.</div>';
  }
  wrap.innerHTML = html;
}

function closeSiteLeadsPanel() {
  const panel = document.getElementById('site-leads-panel');
  if (panel) panel.style.display = 'none';
  currentSiteKey = null;
  currentSiteLeads = [];
}

function csvSafe(value) {
  return '"' + String(value == null ? '' : value).replace(/"/g, '""') + '"';
}

function exportSiteLeadsCSV() {
  if (!currentSiteLeads.length) {
    alert('Consulte os leads de um site antes de exportar.');
    return;
  }
  const site = getPanelSites().find(function (s) { return s.key === currentSiteKey; });
  const nomeSite = site ? site.dominio : currentSiteKey;

  let csv = 'Site,Data,Nome,Telefone,Cidade,Unidade,Veiculo,Servico,Sintoma,Mensagem,Origem\n';
  currentSiteLeads.forEach(function (l) {
    csv += [l.site, l.data, l.nome, l.telefone, l.cidade, l.unidade, l.veiculo, l.servico, l.sintoma, l.mensagem, l.origem]
      .map(csvSafe).join(',') + '\n';
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', 'leads_' + currentSiteKey + '_' + new Date().toISOString().slice(0, 10) + '.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  addAuditLog('site_leads_csv', 'Exportou CSV com ' + currentSiteLeads.length + ' lead(s) do site ' + nomeSite + '.');
}




