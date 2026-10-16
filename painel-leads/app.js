// SOSSEO CRM - Engine Comercial para Agência (Sites, Tráfego & CRM)
const STORAGE_KEY = 'sosseo_agency_crm_v2';
const SESSION_KEY = 'sosseo_user_session';
const COLUMNS = ['novo', 'respondido', 'reuniao', 'proposta', 'rejeitou', 'ganho'];

const STATUS_LABELS = {
  novo: '1. Novo Lead',
  respondido: '2. Respondido',
  reuniao: '3. Reunião / Diagnóstico',
  proposta: '4. Proposta Enviada',
  rejeitou: '5. Rejeitou',
  ganho: '6. Contrato Fechado'
};

// Leads de demonstração da SOSSEO
const SEED_DATA = [
  {
    id: 'lead-1',
    company: 'Indústria Metalúrgica Aliança',
    contact: 'Carlos Eduardo (Diretor Comercial)',
    phone: '(11) 98122-3344',
    email: 'carlos@metalurgicaalianca.com.br',
    service: 'Solução Completa',
    value: 6500,
    status: 'proposta',
    source: 'WhatsApp',
    notes: 'Quer reformular o site industrial da fábrica com foco em SEO e rodar tráfego no Google Ads para atrair cotações de usinagem.',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    history: [
      {
        id: 'hist-1-1',
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
        user: 'Sistema',
        type: 'created',
        text: 'Lead cadastrado via Botão do WhatsApp no site SOSSEO.'
      },
      {
        id: 'hist-1-2',
        timestamp: new Date(Date.now() - 86400000 * 1.5).toISOString(),
        user: 'admin',
        type: 'status',
        text: "Moveu de '1. Novo Lead' para '2. Respondido'. Primeiro contato efetuado com Carlos."
      },
      {
        id: 'hist-1-3',
        timestamp: new Date(Date.now() - 86400000 * 1).toISOString(),
        user: 'admin',
        type: 'note',
        text: 'Reunião de diagnóstico realizada com Carlos e engenharia. Apresentada estratégia de posicionamento técnico B2B.'
      },
      {
        id: 'hist-1-4',
        timestamp: new Date(Date.now() - 86400000 * 0.5).toISOString(),
        user: 'admin',
        type: 'status',
        text: "Moveu de '3. Reunião / Diagnóstico' para '4. Proposta Enviada'. Proposta comercial de R$ 6.500 entregue."
      }
    ]
  },
  {
    id: 'lead-2',
    company: 'DermatoClean Estética & Saúde',
    contact: 'Dra. Vanessa Meirelles',
    phone: '(19) 99234-5566',
    email: 'contato@dermatoclean.com.br',
    service: 'Gestão de Tráfego & SEO',
    value: 2800,
    status: 'reuniao',
    source: 'Site',
    notes: 'Reunião de diagnóstico marcada para amanhã às 14h via Google Meet. Foco em campanhas locais de alta conversão.',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    history: [
      {
        id: 'hist-2-1',
        timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
        user: 'Sistema',
        type: 'created',
        text: 'Lead cadastrado via formulário de contato do site.'
      },
      {
        id: 'hist-2-2',
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
        user: 'admin',
        type: 'status',
        text: "Moveu para '3. Reunião / Diagnóstico'. Agendada reunião de diagnóstico estratégico."
      }
    ]
  },
  {
    id: 'lead-3',
    company: 'Distribuidora LogiFast SP',
    contact: 'Marcos Aurélio',
    phone: '(11) 97788-9900',
    email: 'marcos@logifastsp.com.br',
    service: 'Implantação de CRM',
    value: 3500,
    status: 'novo',
    source: 'WhatsApp',
    notes: 'Entrou pelo botão do WhatsApp perguntando como organizar os orçamentos que chegam da equipe comercial.',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    history: [
      {
        id: 'hist-3-1',
        timestamp: new Date(Date.now() - 86400000 * 1).toISOString(),
        user: 'Sistema',
        type: 'created',
        text: 'Lead cadastrado via WhatsApp solicitando implantação de CRM.'
      }
    ]
  },
  {
    id: 'lead-4',
    company: 'Engenharia & Obras Paulistana',
    contact: 'Eng. Fernando Souza',
    phone: '(11) 99111-2233',
    email: 'diretoria@paulistanaeng.com.br',
    service: 'Criação de Site',
    value: 4200,
    status: 'ganho',
    source: 'Indicação',
    notes: 'Contrato assinado! Criação de site institucional moderno e veloz em WordPress com otimização Core Web Vitals.',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    history: [
      {
        id: 'hist-4-1',
        timestamp: new Date(Date.now() - 86400000 * 7).toISOString(),
        user: 'admin',
        type: 'created',
        text: 'Lead criado por indicação de parceiro.'
      },
      {
        id: 'hist-4-2',
        timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
        user: 'admin',
        type: 'status',
        text: "Moveu para '6. Contrato Fechado 🚀'. Assinatura de contrato confirmada e entrada paga!"
      }
    ]
  },
  {
    id: 'lead-5',
    company: 'Usinagem Precision Parts',
    contact: 'Márcio Silveira (Gerente Industrial)',
    phone: '(19) 98877-6655',
    email: 'marcio@precisionparts.ind.br',
    service: 'Solução Completa',
    value: 5500,
    status: 'rejeitou',
    source: 'Site',
    notes: 'Empresa procurou solução completa mas adiou investimento até o fechamento do orçamento fiscal do próximo ano.',
    lossReason: 'Projeto Adiado / Sem Previsão',
    lossDetail: 'Diretoria congelou investimentos até o 1º trimestre de 2027.',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    history: [
      {
        id: 'hist-5-1',
        timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
        user: 'Sistema',
        type: 'created',
        text: 'Lead cadastrado via formulário técnico do site SOSSEO.'
      },
      {
        id: 'hist-5-2',
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
        user: 'admin',
        type: 'loss',
        text: 'Lead movido para 5. Rejeitou. Motivo: Projeto Adiado / Sem Previsão (Diretoria congelou investimentos até o 1º trimestre de 2027).'
      }
    ]
  }
];

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
    // Fallback offline caso API esteja indisponível
    if (username.toLowerCase() === 'admin' && (password === '123' || password === 'admin')) {
      currentUser = { id: 'admin', name: 'Administrador SOSSEO', username: 'admin', role: 'admin' };
      localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
      updateUserHeaderUI();
      initCRMData();
    } else {
      errDiv.textContent = 'Erro ao conectar ao servidor de autenticação';
      errDiv.style.display = 'block';
    }
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

// ==========================================
// 5. INICIALIZAÇÃO E GESTÃO DE LEADS
// ==========================================
function normalizeLead(lead) {
  if (!lead) return lead;
  if (lead.status === 'qualificacao') lead.status = 'respondido';
  if (lead.status === 'negociacao') lead.status = 'rejeitou';

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

function initCRMData() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      leads = JSON.parse(stored).map(normalizeLead);
    } catch (e) {
      leads = JSON.parse(JSON.stringify(SEED_DATA)).map(normalizeLead);
    }
  } else {
    leads = JSON.parse(JSON.stringify(SEED_DATA)).map(normalizeLead);
    saveToStorage(false);
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
      if (Array.isArray(data.leads) && data.leads.length > 0) {
        const normalizedServerLeads = data.leads.map(normalizeLead);
        let hasChanges = false;

        normalizedServerLeads.forEach(serverLead => {
          const localIdx = leads.findIndex(l => l.id === serverLead.id);
          if (localIdx === -1) {
            leads.unshift(serverLead);
            hasChanges = true;
          } else {
            const serverHistLen = Array.isArray(serverLead.history) ? serverLead.history.length : 0;
            const localHistLen = Array.isArray(leads[localIdx].history) ? leads[localIdx].history.length : 0;
            if (serverLead.updatedAt !== leads[localIdx].updatedAt || serverHistLen > localHistLen) {
              leads[localIdx] = serverLead;
              hasChanges = true;
            }
          }
        });

        if (hasChanges || forceRender) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
          renderBoard();
        }
      } else if (leads.length > 0) {
        fetch('https://sosseo-crm.sosseosites.workers.dev/api/leads', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leads })
        }).catch(() => {});
      }
    }
  } catch (err) {}
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

function deleteCurrentLead() {
  const id = document.getElementById('lead-id').value;
  if (!id) return;

  const lead = leads.find(l => l.id === id);
  const companyName = lead ? lead.company : 'este lead';

  if (!confirm(`Deseja realmente excluir o lead "${companyName}"? Esta ação removerá a oportunidade permanentemente.`)) {
    return;
  }

  leads = leads.filter(l => l.id !== id);
  saveToStorage();
  closeModal('lead-modal');
  renderBoard();
  addAuditLog('lead_excluido', `Excluiu permanentemente o lead '${companyName}'.`);
  alert(`Lead "${companyName}" foi excluído com sucesso!`);
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
