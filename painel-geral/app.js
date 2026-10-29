/* ==========================================================================
   CRM GERAL SOSSEO — Coletor de Leads
   Puxa de cada portal via /api/triagem e organiza em colunas por site.
   ========================================================================== */

'use strict';

/* ----------------------------- FONTES DE DADOS ---------------------------- */

const SITES = [
  { key: 'cambio-campinas',  abv: 'Câmbio Camp',   full: 'Câmbio Automático Campinas',
    url: 'https://cambioautomaticocampinas.com.br/api/triagem' },
  { key: 'cambio-osasco',    abv: 'Câmbio Osasc',  full: 'Câmbio Automático Osasco',
    url: 'https://cambioautomaticoosasco.com.br/api/triagem' },
  { key: 'mecanica-campinas',abv: 'Mec. Camp',     full: 'Mecânica Campinas',
    url: 'https://mecanicacampinas.com.br/api/triagem' },
  { key: 'mecanica-osasco',  abv: 'Mec. Osasc',    full: 'Mecânica Osasco',
    url: 'https://mecanicaosasco.com.br/api/triagem' },
  { key: 'portal-molde',     abv: 'Molde Injeção', full: 'Portal Molde Injeção',
    url: 'https://portalmoldeinjecao.com.br/api/triagem' },
  { key: 'fgcar',            abv: 'FG Car',        full: 'FG Car Funilaria',
    url: 'https://sosseo-crm.sosseosites.workers.dev/api/fgcar-leads' },
  { key: 'sosseo',           abv: 'SOSSEO',        full: 'SOSSEO (Agência)',
    url: 'https://sosseo-crm.sosseosites.workers.dev/api/leads' },
  { key: 'psicanalise',      abv: 'Psi Alma',      full: 'Psicanálise Alma e Luz',
    url: 'https://psicanalisealmaeluz.com.br/api/triagem' }
];

const STORAGE_KEY = 'crm_geral_sosseo_v2';

// Autenticação: usa o MESMO backend do CRM SOSSEO (mesma senha).
// Se você trocar a senha no CRM SOSSEO, este painel passa a aceitar a nova.
const AUTH_API = 'https://sosseo-crm.sosseosites.workers.dev/api/auth/login';
const SESSION_KEY = 'crm_geral_sosseo_session';

// Período de retenção dos excluídos (6 meses). Itens mais velhos são removidos.
const TRASH_DAYS = 180;
const TRASH_MONTHS = 6;

/* ----------------------------- ESTADO LOCAL ------------------------------- */

function defaultState() {
  return { archived: {}, trash: {}, notes: {} };
}

// Normaliza o estado salvo no navegador:
// - reindexa os leads arquivados com o ID estável atual (migra estados antigos
//   em que o ID mudava a cada busca e gerava duplicatas na Entrada + colunas);
// - garante que archived/trash sejam objetos.
function migrateState(s) {
  if (!s || typeof s !== 'object') s = defaultState();
  if (!s.archived || typeof s.archived !== 'object') s.archived = {};
  if (!s.trash || typeof s.trash !== 'object') s.trash = {};
  if (!s.notes || typeof s.notes !== 'object') s.notes = {};

  var nextArc = {};
  Object.keys(s.archived).forEach(function (oldKey) {
    var l = s.archived[oldKey];
    if (!l || typeof l !== 'object') return;
    var st = siteOf(l);
    var fp = st.key + '::' + leadId(l);
    nextArc[fp] = Object.assign({}, l, { _id: fp, _siteKey: st.key });
  });
  s.archived = nextArc;
  return s;
}

function loadState() {
  var s = null;
  try { s = JSON.parse(localStorage.getItem(STORAGE_KEY)); }
  catch (e) { s = null; }
  return migrateState(s || defaultState());
}
function saveState(s) { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }

let state = loadState();

/* --------------------------- AUTENTICAÇÃO -------------------------------- */
// Valida usuário/senha no MESMO endpoint do CRM SOSSEO (mesma senha).
// Sem fallback offline de senha: só aceita credenciais validadas no servidor.

let currentUser = null;

function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return null;
}

function saveSession(user) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(user)); } catch (e) { /* ignore */ }
}

function clearSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
}

function showLoginScreen() {
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('loginError').classList.add('hidden');
  setTimeout(function () {
    const u = document.getElementById('loginUsername');
    if (u) u.focus();
  }, 50);
}

function hideLoginScreen() {
  document.getElementById('loginScreen').classList.add('hidden');
}

async function doLogin(e) {
  if (e) e.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  const errDiv = document.getElementById('loginError');

  if (!username || !password) {
    errDiv.textContent = 'Digite usuário e senha.';
    errDiv.classList.remove('hidden');
    return;
  }

  try {
    const res = await fetch(AUTH_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok && data.success && data.user) {
      currentUser = data.user;
      saveSession(currentUser);
      hideLoginScreen();
      toast('Bem-vindo, ' + (data.user.name || data.user.username || '') + '!');
      refreshAll();
    } else {
      errDiv.textContent = data.error || 'Usuário ou senha incorretos.';
      errDiv.classList.remove('hidden');
    }
  } catch (err) {
    // Sem fallback offline de senha (padrão de segurança igual ao CRM SOSSEO):
    // só aceita credenciais validadas no servidor.
    errDiv.textContent = 'Erro ao conectar ao servidor de autenticação. Verifique a internet e tente novamente.';
    errDiv.classList.remove('hidden');
  }
}

function doLogout() {
  if (!window.confirm('Deseja realmente sair do Painel Geral?')) return;
  clearSession();
  currentUser = null;
  showLoginScreen();
  document.getElementById('board').innerHTML = 'Carregando leads...';
}

/* ----------------------------- UTILITÁRIOS -------------------------------- */

function pad(n) { return String(n).padStart(2, '0'); }
function fmtDate(d) {
  return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + String(d.getFullYear()).slice(-2);
}
function fmtTime(d) { return pad(d.getHours()) + ':' + pad(d.getMinutes()); }

function parseTs(l) {
  if (l.timestamp) return Number(l.timestamp);
  if (l.createdAt) { const t = new Date(l.createdAt).getTime(); if (!isNaN(t)) return t; }
  if (l.data && l.hora) {
    const p = String(l.data).split('/');
    const h = String(l.hora).split(':');
    if (p.length === 3) return new Date(2000 + Number(p[2]), p[1] - 1, p[0], h[0] || 12, h[1] || 0).getTime();
  }
  return Date.now();
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function hash36(str) {
  var h = 5381;
  for (var i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

/* Timestamp "estável": retorna o MESMO valor sempre que os dados do lead forem
   os mesmos. NUNCA usa Date.now() como fallback (era isso que fazia o lead
   "voltar" para a Entrada com um ID novo a cada atualização). */
function stableTs(l) {
  if (l && l.timestamp) {
    var n = Number(l.timestamp);
    if (!isNaN(n) && n > 0) return String(n);
  }
  if (l && l.createdAt) {
    var t = new Date(l.createdAt).getTime();
    if (!isNaN(t)) return String(t);
  }
  if (l && l.data) {
    var p = String(l.data).split('/');
    var h = String(l.hora || '').split(':');
    if (p.length === 3) {
      var d = new Date(2000 + Number(p[2]), Number(p[1]) - 1, Number(p[0]), Number(h[0]) || 12, Number(h[1]) || 0);
      if (!isNaN(d.getTime())) return String(d.getTime());
    }
  }
  return null;
}

/* Identificador ESTÁVEL do lead. Prioridade: id do próprio site → nome+data →
   fingerprint de conteúdo (telefone/e-mail/página). Só depende dos dados. */
function leadId(l) {
  if (l && l.id) return String(l.id);
  var name = String(l.contact || l.nome || l.company || '').trim() || 'sem-nome';
  var ts = stableTs(l);
  if (ts) return name + '_' + ts;
  var phone = String(l.phone || l.telefone || '').replace(/\D/g, '');
  var email = String(l.email || '').trim().toLowerCase();
  var extras = [];
  if (phone) extras.push('tel:' + phone);
  if (email) extras.push('mail:' + email);
  if (l.pagina) extras.push('pag:' + String(l.pagina).trim().toLowerCase().replace(/\/+/g, '_'));
  if (l.tipo) extras.push('tip:' + String(l.tipo).trim().toLowerCase().replace(/\s+/g, '_'));
  if (extras.length) return 'sd|' + name.toLowerCase().replace(/\s+/g, '_') + '|' + extras.join('|');
  return 'sd|' + hash36(JSON.stringify(l));
}

/* "Assinatura" da pessoa (telefone + nome + e-mail): reconhece o MESMO cliente
   mesmo quando o site mudou o formato do ID. Exige telefone/e-mail, para nunca
   misturar leads diferentes só por conta do nome. */
function leadSig(l) {
  var phone = leadPhone(l).replace(/\D/g, '');
  if (!phone) return null;
  var name = String(leadName(l) || '').trim().toLowerCase();
  var parts = ['p' + phone];
  if (name && name !== '---') parts.push('n' + name.replace(/\s+/g, ''));
  var email = leadEmail(l).trim().toLowerCase();
  if (email) parts.push('e' + email);
  return parts.join('|');
}

function leadName(l) { return l.contact || l.nome || l.company || '---'; }
function leadPhone(l) { return l.phone || l.telefone || ''; }
function leadVehicle(l) { return l.company || l.veiculo || l.vehicle || ''; }
function leadService(l) { return l.service || l.servico || ''; }
function leadNotes(l) { return l.notes || l.detalhes || l.relato || ''; }
function leadRegion(l) { return l.bairro || l.region || l.cidade || ''; }
function leadEmail(l) { return l.email || ''; }

function siteOf(l) {
  if (l.siteKey) return SITES.find(s => s.key === l.siteKey) || SITES[0];
  if (l._siteKey) return SITES.find(s => s.key === l._siteKey) || SITES[0];
  const src = String(l.source || l.siteName || '').toLowerCase();
  if (src.includes('cambio') && src.includes('campinas')) return SITES[0];
  if (src.includes('cambio') && src.includes('osasco'))  return SITES[1];
  if (src.includes('mecanica') && src.includes('campinas')) return SITES[2];
  if (src.includes('mecanica') && src.includes('osasco'))  return SITES[3];
  if (src.includes('molde') || src.includes('injec'))     return SITES[4];
  if (src.includes('fg') || src.includes('funilaria'))    return SITES[5];
  if (src.includes('sosseo') || src.includes('agencia'))  return SITES[6];
  if (src.includes('psic') || src.includes('alma'))       return SITES[7];
  return SITES[0];
}

/* --------------------------- COLETA DE DADOS ------------------------------ */

let allLeads = [];
let sourceErrors = {};

async function fetchSource(site) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(site.url, { signal: ctrl.signal });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    let list = Array.isArray(json) ? json : (Array.isArray(json.leads) ? json.leads : []);
    // Se o próprio site já marcou IDs como excluídos (meta.deletedIds),
    // não traz esses leads de volta para a Entrada. Não altera nada no site.
    if (json && json.meta && Array.isArray(json.meta.deletedIds) && json.meta.deletedIds.length) {
      const del = {};
      json.meta.deletedIds.forEach(d => { del[String(d)] = true; });
      list = list.filter(l => !(l && l.id && del[String(l.id)]));
    }
    return list.map(l => ({ ...l, siteKey: site.key }));
  } catch (e) {
    sourceErrors[site.key] = e.name === 'AbortError' ? 'timeout' : e.message;
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/* Índice de assinaturas (telefone/nome) dos leads já arquivados/excluídos:
   serve para não deixar a MESMA pessoa voltar para a Entrada quando o site
   mudou o formato do ID entre uma busca e outra. */
function indexSigs(which) {
  const map = {};
  Object.keys(state[which] || {}).forEach(function (k) {
    const v = state[which][k];
    const l = (which === 'trash' && v && typeof v === 'object' && v.d) ? v.d : v;
    if (!l || typeof l !== 'object') return;
    const sig = leadSig(l);
    if (!sig) return;
    const st = siteOf(l);
    (map[st.key] = map[st.key] || new Set()).add(sig);
  });
  return map;
}

/* Rebuild dos leads a partir das listas já baixadas. Chamado de forma
   PROGRESSIVA: o board atualiza assim que cada fonte responde, em vez de
   segurar a tela até a mais lenta terminar. */
function applyLeads(perSite) {
  const raw = [];
  perSite.forEach(function (list, i) {
    (list || []).forEach(function (l) {
      if (l && typeof l === 'object') raw.push(Object.assign({}, l, { siteKey: SITES[i].key }));
    });
  });

  const arcSigs = indexSigs('archived');
  const trashSigs = indexSigs('trash');
  const seen = {};

  allLeads = raw
    .map(function (l) {
      const st = siteOf(l);
      return Object.assign({}, l, {
        _id: st.key + '::' + leadId(l),
        _ts: parseTs(l),
        _site: st
      });
    })
    .filter(function (l) {
      const id = l._id;
      if (state.archived && state.archived[id]) return false;
      if (state.trash && state.trash[id]) return false;
      const sig = leadSig(l);
      if (sig) {
        if (arcSigs[l._site.key] && arcSigs[l._site.key].has(sig)) return false;
        if (trashSigs[l._site.key] && trashSigs[l._site.key].has(sig)) return false;
      }
      if (seen[id]) return false; // remove duplicatas repetidas pela própria API
      seen[id] = true;
      return true;
    })
    .sort(function (a, b) { return b._ts - a._ts; });

  render();
}

async function refreshAll() {
  setStatus('Buscando leads...');
  sourceErrors = {};
  const perSite = SITES.map(function () { return null; });
  render(); // mostra o board imediatamente, sem segurar a tela

  try {
    await Promise.all(SITES.map(function (site, i) {
      return fetchSource(site).then(function (list) {
        perSite[i] = list;
        applyLeads(perSite); // atualiza assim que cada fonte responder
      });
    }));
  } catch (e) {
    const b = document.getElementById('errorBanner');
    if (b) { b.classList.remove('hidden'); b.textContent = 'Erro na coleta: ' + (e.message || e); }
  }

  const now = new Date();
  setStatus('Última atualização: ' + fmtDate(now) + ' ' + fmtTime(now) + ' — ' +
    allLeads.length + ' na Entrada');
}

/* ----------------------------- RENDER DO BOARD ---------------------------- */

function render() {
  const board = document.getElementById('board');
  board.innerHTML = '';

  // Colunas dos sites = SOMENTE leads arquivados (guardados com dados no state)
  const archivedBySite = {};
  Object.keys(state.archived || {}).forEach(id => {
    const l = state.archived[id];
    if (!l || !l._siteKey) return;
    archivedBySite[l._siteKey] = archivedBySite[l._siteKey] || [];
    archivedBySite[l._siteKey].push(l);
  });

  board.appendChild(buildEntradaColumn());
  SITES.forEach(site => {
    const leadsSite = archivedBySite[site.key] || [];
    board.appendChild(buildSiteColumn(site, leadsSite));
  });

  document.getElementById('statEntrada').textContent = allLeads.length;
  document.getElementById('statTotal').textContent = allLeads.length +
    Object.values(state.archived || {}).filter(Boolean).length;
  document.getElementById('statArquivados').textContent =
    Object.values(state.archived || {}).filter(Boolean).length;
}

function buildEntradaColumn() {
  const col = document.createElement('section');
  col.className = 'column entrada';
  col.innerHTML =
    '<header class="column-head"><h2>Nova Entrada</h2>' +
    '<span class="count">' + allLeads.length + '</span></header>';
  const body = document.createElement('div');
  body.className = 'column-body';

  if (allLeads.length === 0) {
    body.innerHTML = '<div class="empty-state">Nenhum lead novo. Aguardando...</div>';
  } else {
    allLeads.forEach(l => {
      const d = new Date(l._ts);
      const card = document.createElement('div');
      card.className = 'card entrada-card';
      card.innerHTML =
        '<div class="card-title">' + esc(l._site.abv) + ' — ' + fmtDate(d) + ' ' + fmtTime(d) + '</div>';
      card.addEventListener('click', function () { openModal(l, 'entrada'); });
      body.appendChild(card);
    });
  }

  col.appendChild(body);
  return col;
}

function buildSiteColumn(site, archivedLeads) {
  const col = document.createElement('section');
  col.className = 'column';
  col.innerHTML =
    '<header class="column-head"><h2>' + esc(site.abv) + '</h2>' +
    '<span class="count">' + archivedLeads.length + '</span></header>';
  const body = document.createElement('div');
  body.className = 'column-body';

  if (archivedLeads.length === 0) {
    body.innerHTML = '<div class="empty-state">Sem leads</div>';
  } else {
    archivedLeads.forEach(l => {
      const d = new Date(l._ts);
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML =
        '<div class="card-title">' + esc(leadName(l)) + '</div>' +
        (leadPhone(l) ? '<div class="card-phone">' + esc(leadPhone(l)) + '</div>' : '') +
        '<div class="card-date">' + fmtDate(d) + ' ' + fmtTime(d) + '</div>';
      card.addEventListener('click', function () { openModal(l, 'site'); });
      body.appendChild(card);
    });
  }

  col.appendChild(body);
  return col;
}

/* ------------------------------- MODAL ------------------------------------ */

let currentLead = null;
let currentMode = 'entrada';

function fieldHTML(label, value) {
  if (!value) return '';
  return '<div class="field"><div class="f-label">' + label + '</div>' +
    '<div class="f-value">' + esc(value) + '</div></div>';
}

function openModal(l, mode) {
  // Leads arquivados foram guardados com _siteKey (não _site). Normaliza.
  if (!l._site && l._siteKey) {
    l = Object.assign({}, l, { _site: SITES.find(function (s) { return s.key === l._siteKey; }) || SITES[0] });
  }
  if (!l || !l._site) l = Object.assign({}, l || {}, { _site: SITES[0], _ts: Date.now(), _id: 'fallback' });
  currentLead = l;
  currentMode = mode;
  const dTemp = new Date(l._ts || Date.now());
  const d = isNaN(dTemp.getTime()) ? new Date() : dTemp;
  const phone = leadPhone(l);
  const wa = phone ? 'https://wa.me/55' + String(phone).replace(/\D/g, '') : '';

  let html = '';
  html += '<span class="modal-badge ' + (mode === 'entrada' ? 'entrada' : '') + '">' +
    esc(l._site.abv) + ' • ' + fmtDate(d) + ' ' + fmtTime(d) + '</span>';

  if (mode === 'entrada') {
    html += '<div class="modal-badge entrada">Nova Entrada — ' + esc(l._site.full) + '</div>';
  } else {
    html += '<div class="modal-badge">Arquivado — ' + esc(l._site.full) + '</div>';
  }

  html += '<h3>' + esc(leadName(l)) + '</h3>';
  if (phone) html += '<div class="modal-phone">📱 ' + esc(phone) + '</div>';
  if (leadEmail(l)) html += fieldHTML('E-mail', leadEmail(l));
  if (leadVehicle(l)) html += fieldHTML('Veículo / Empresa', leadVehicle(l));
  if (leadService(l)) html += fieldHTML('Serviço / Tipo', leadService(l));
  if (leadRegion(l)) html += fieldHTML('Bairro / Região', leadRegion(l));
  if (l.pagina) html += fieldHTML('Página de Origem', l.pagina);
  if (l.tipo) html += fieldHTML('Tipo', l.tipo);
  if (leadNotes(l)) html += '<div class="field"><div class="f-label">Sintoma / Relato</div>' +
    '<pre class="f-value">' + esc(leadNotes(l)) + '</pre></div>';

  // Observações do painel (ficam salvas só localmente, nunca enviam ao site)
  var existingNote = (state.notes && state.notes[l._id]) || (l._notes || '');
  html += '<div class="field obs-block"><div class="f-label">✏️ Observações (salvas neste painel)</div>' +
    '<textarea id="leadNote" class="note-input" rows="3" placeholder="Escreva uma observação sobre este lead...">' +
    esc(existingNote) + '</textarea>' +
    '<div class="obs-actions"><button type="button" class="btn btn-note" id="btnSaveNote">💾 Salvar Observação</button></div></div>';

  html += '<div class="modal-actions">';
  if (wa) html += '<a class="btn btn-wa" href="' + wa + '" target="_blank" rel="noopener">WhatsApp</a>';
  if (mode === 'entrada') {
    html += '<button class="btn btn-archive" id="btnArchive">Arquivar → ' + esc(l._site.abv) + '</button>';
  } else {
    html += '<button class="btn btn-delete" id="btnDelete">Excluir</button>';
  }
  html += '<button class="btn btn-cancel" id="btnModalCancel">Fechar</button>';
  html += '</div>';

  document.getElementById('modalBody').innerHTML = html;
  document.getElementById('modal').classList.remove('hidden');

  var btnArchive = document.getElementById('btnArchive');
  var btnDelete = document.getElementById('btnDelete');
  var btnCancel = document.getElementById('btnModalCancel');
  var btnNote = document.getElementById('btnSaveNote');

  if (btnNote) {
    btnNote.addEventListener('click', function () {
      var el = document.getElementById('leadNote');
      var txt = el ? el.value : '';
      var id = currentLead._id;
      if (!state.notes) state.notes = {};
      if (String(txt).trim()) state.notes[id] = String(txt).trim();
      else delete state.notes[id];
      // reflete no arquivado para exibição futura
      var rel = state.archived && state.archived[id];
      if (rel) {
        if (String(txt).trim()) rel._notes = String(txt).trim();
        else delete rel._notes;
      }
      saveState(state);
      toast('Observação salva.');
    });
  }

  if (btnArchive) {
    btnArchive.addEventListener('click', function () {
      var lead = currentLead;           // captura ANTES do closeModal (que zera currentLead)
      if (!lead) return;
      // Captura observação digitada (mesmo sem clicar em Salvar)
      var noteEl = document.getElementById('leadNote');
      var noteTxt = noteEl && noteEl.value ? String(noteEl.value).trim() : (((state.notes || {})[lead._id]) || lead._notes || '');
      if (!state.notes) state.notes = {};
      if (noteTxt) state.notes[lead._id] = noteTxt; else delete state.notes[lead._id];
      // Salva o lead completo (com dados) na lista de arquivados
      var snap = Object.assign({}, lead);
      snap._id = lead._id;
      snap._siteKey = lead._site.key;
      if (noteTxt) snap._notes = noteTxt; else delete snap._notes;
      if (!state.archived) state.archived = {};
      // Evita duplicar a MESMA pessoa na coluna do site
      var sig = leadSig(snap);
      if (sig) {
        Object.keys(state.archived).forEach(function (k) {
          var a = state.archived[k];
          if (a && siteOf(a).key === snap._siteKey && leadSig(a) === sig) {
            delete state.archived[k];
          }
        });
      }
      state.archived[snap._id] = snap;
      saveState(state);
      closeModal();
      toast('Lead movido para ' + lead._site.abv + '.');
      allLeads = allLeads.filter(function (x) { return x._id !== lead._id; });
      render(); // atualiza o board NA HORA
    });
  }
  if (btnDelete) {
    // Exclusão com confirmação clara: um clique no botão + OK no diálogo.
    btnDelete.addEventListener('click', function () {
      var lead = currentLead;           // captura ANTES do closeModal (que zera currentLead)
      if (!lead) return;
      var nome = leadName(lead) || 'este lead';
      var confirmMsg = 'Excluir "' + nome + '" de ' + lead._site.abv + '?\n\n' +
        'Vale somente para este painel (navegador). Os dados nos sites NÃO são apagados.\n' +
        'Você pode restaurar em "Ver Excluídos" (fica guardado por 6 meses).';
      if (!window.confirm(confirmMsg)) return;

      // Marca como excluído (não volta mais na entrada nem nas colunas)
      if (!state.trash) state.trash = {};
      var noteEl = document.getElementById('leadNote');
      var nota = noteEl && noteEl.value
        ? String(noteEl.value).trim()
        : (((state.notes || {})[lead._id]) || lead._notes || '');
      if (!state.notes) state.notes = {};
      if (nota) state.notes[lead._id] = nota; else delete state.notes[lead._id];
      state.trash[lead._id] = { t: Date.now(), d: lead, note: nota };

      // Remove também qualquer registro arquivado da MESMA pessoa
      var sig = leadSig(lead);
      if (state.archived) {
        Object.keys(state.archived).forEach(function (k) {
          var a = state.archived[k];
          if (!a) return;
          if (k === lead._id) { delete state.archived[k]; return; }
          if (sig && siteOf(a).key === lead._site.key && leadSig(a) === sig) {
            delete state.archived[k];
          }
        });
      }

      saveState(state);
      closeModal();
      toast('Lead excluído. (disponível em Ver Excluídos)');
      allLeads = allLeads.filter(function (x) {
        if (x._id === lead._id) return false;
        if (sig && x._site && x._site.key === lead._site.key && leadSig(x) === sig) return false;
        return true;
      });
      render(); // atualiza o board NA HORA
    });
  }
  if (btnCancel) btnCancel.addEventListener('click', closeModal);
}

function closeModal() {
  var m = document.getElementById('modal');
  if (m) m.classList.add('hidden');
  currentLead = null;
}

/* --------------------------- LIXEIRA (EXCLUÍDOS) -------------------------- */

// Retira do trash os itens com mais de 180 dias e limita a 6 meses completos
// (remove o mês mais antigo inteiro quando houver mais de 6 meses). Roda ao abrir.
function pruneTrash() {
  if (!state.trash) return;
  var cutoff = Date.now() - TRASH_DAYS * 24 * 60 * 60 * 1000;
  var removed = false;
  Object.keys(state.trash).forEach(function (k) {
    var it = state.trash[k];
    var t = it && it.t ? Number(it.t) : 0;
    if (!t || t < cutoff) { delete state.trash[k]; removed = true; }
  });

  // Mantém apenas os 6 meses mais recentes (deleta o mês mais antigo inteiro)
  var months = {};
  Object.keys(state.trash).forEach(function (k) {
    var it = state.trash[k];
    var t = it && it.t ? Number(it.t) : Date.now();
    var mk = monthKey(t);
    months[mk] = true;
  });
  var sorted = Object.keys(months).sort().reverse();
  if (sorted.length > TRASH_MONTHS) {
    var keep = new Set(sorted.slice(0, TRASH_MONTHS));
    Object.keys(state.trash).forEach(function (k) {
      var it = state.trash[k];
      var t = it && it.t ? Number(it.t) : Date.now();
      if (!keep.has(monthKey(t))) { delete state.trash[k]; removed = true; }
    });
  }

  if (removed) saveState(state);
}

// Chave de mês "AAAA-MM" a partir de um timestamp.
function monthKey(ts) {
  var d = new Date(ts);
  return d.getFullYear() + '-' + pad(d.getMonth() + 1);
}

function openTrashModal() {
  pruneTrash(); // aplica retenção de 6 meses ao abrir
  var m = document.getElementById('trashModal');
  m.classList.remove('hidden');
  renderTrash();
}

function closeTrashModal() {
  document.getElementById('trashModal').classList.add('hidden');
}

function updateRestoreBtn(body) {
  var marked = Object.keys(window._trashMarked || {});
  var btn = document.getElementById('btnRestoreChecked');
  if (btn) btn.disabled = marked.length === 0;
}

// Agrupa os excluídos por mês e devolve a tabela (tipo planilha).
function renderTrash() {
  var body = document.getElementById('trashBody');
  if (!body) return;

  var keys = Object.keys(state.trash || {});
  if (keys.length === 0) {
    body.innerHTML =
      '<h3>🗑 Excluídos</h3>' +
      '<div class="empty-state">Nenhum lead excluído. Leads excluídos ficam aqui por 6 meses.</div>';
    return;
  }

  // Agrupa por mês (mais recente primeiro)
  var byMonth = {};
  keys.forEach(function (k) {
    var it = state.trash[k];
    var l = it && typeof it === 'object' && it.d ? it.d : it;
    var t = it && it.t ? Number(it.t) : (l && l._ts ? Number(l._ts) : Date.now());
    var mk = monthKey(t);
    (byMonth[mk] = byMonth[mk] || []).push({ k: k, t: t, l: l, note: (it && it.note) || '' });
  });
  var months = Object.keys(byMonth).sort().reverse();

  var html = '<h3>🗑 Leads Excluídos <span class="trash-hint">(guardados 6 meses)</span></h3>';
  html += '<div class="trash-legend">' +
    '<span class="trash-dot"></span> Marque os itens e clique em <b>Retornar</b> para restaurá-los às colunas.' +
    '</div>';

  months.forEach(function (mk) {
    var items = byMonth[mk].sort(function (a, b) { return b.t - a.t; });
    var mNum = Number(mk.split('-')[1]);
    var mName = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][mNum];
    html += '<div class="trash-month">' +
      '<div class="trash-month-head"><span class="trash-month-title">' + mName + ' ' + mk.split('-')[0] + '</span>' +
      '<span class="trash-month-count">' + items.length + ' item(s)</span>' +
      '<button type="button" class="btn btn-small btn-del-month" data-month="' + mk + '">🗑 Excluir mês inteiro</button>' +
      '</div>';

    html += '<table class="trash-table"><thead><tr>' +
      '<th class="ck"></th><th>Data</th><th>Site</th><th>Nome</th><th>Telefone</th>' +
      '<th>E-mail</th><th>Página / Serviço</th><th>Observação</th>' +
      '</tr></thead><tbody>';

    items.forEach(function (it) {
      var l = it.l || {};
      var d = new Date(it.t);
      html += '<tr data-key="' + esc(it.k) + '">' +
        '<td class="ck"><input type="checkbox" class="trash-check" data-key="' + esc(it.k) + '"></td>' +
        '<td class="nowrap">' + fmtDate(d) + ' ' + fmtTime(d) + '</td>' +
        '<td>' + esc((siteOf(l) || {}).abv || '') + '</td>' +
        '<td>' + esc(leadName(l)) + '</td>' +
        '<td>' + esc(leadPhone(l)) + '</td>' +
        '<td>' + esc(leadEmail(l)) + '</td>' +
        '<td>' + esc(l.pagina || leadService(l) || '') + '</td>' +
        '<td class="note">' + esc(it.note || '') + '</td>' +
        '</tr>';
    });
    html += '</tbody></table></div>';
  });

  html += '<div class="trash-actions">' +
    '<button type="button" class="btn btn-primary" id="btnRestoreChecked" disabled>↩ Retornar selecionados</button>' +
    '<button type="button" class="btn btn-cancel" id="btnTrashClose">Fechar</button>' +
    '</div>';

  body.innerHTML = html;

  // Restaura os checkboxes que ficaram marcados entre aberturas
  if (window._trashMarked) {
    body.querySelectorAll('.trash-check').forEach(function (cb) {
      cb.checked = !!window._trashMarked[cb.getAttribute('data-key')];
    });
  }
  updateRestoreBtn(body);

  var restoreBtn = document.getElementById('btnRestoreChecked');
  var trashCloseBtn = document.getElementById('btnTrashClose');

  body.querySelectorAll('.trash-check').forEach(function (cb) {
    cb.addEventListener('change', function () {
      if (!window._trashMarked) window._trashMarked = {};
      var k = cb.getAttribute('data-key');
      if (cb.checked) window._trashMarked[k] = true; else delete window._trashMarked[k];
      updateRestoreBtn(body);
    });
  });

  body.querySelectorAll('.btn-del-month').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var mk = btn.getAttribute('data-month');
      var msg = 'Excluir TODOS os leads deste mês (' + mk + ')?\n\n' +
        'Esta ação não pode ser desfeita e remove também os marcados para retornar.\n' +
        'Vale somente para este painel (navegador).';
      if (!window.confirm(msg)) return;
      Object.keys(state.trash).forEach(function (k) {
        var it = state.trash[k];
        var t = it && it.t ? Number(it.t) : Date.now();
        if (monthKey(t) === mk) delete state.trash[k];
      });
      saveState(state);
      window._trashMarked = {};
      toast('Mês ' + mk + ' removido da lixeira.');
      renderTrash();
      render();
    });
  });

  if (restoreBtn) restoreBtn.addEventListener('click', restoreChecked);
  if (trashCloseBtn) trashCloseBtn.addEventListener('click', closeTrashModal);
}

// Move os excluídos marcados de volta para as colunas (arquivados).
function restoreChecked() {
  var marked = Object.keys(window._trashMarked || {});
  if (!marked.length) return;
  var restored = 0;
  marked.forEach(function (k) {
    var it = state.trash[k];
    if (!it) return;
    var l = it && typeof it === 'object' && it.d ? it.d : it;
    if (!l || typeof l !== 'object') return;
    delete state.trash[k];
    var st = siteOf(l);
    var fp = st.key + '::' + leadId(l);
    var snap = Object.assign({}, l, {
      _id: fp,
      _siteKey: st.key,
      _ts: it.t || l._ts || Date.now(),
      _site: st
    });
    if (it.note) snap._notes = it.note;
    // Remove da lixeira qualquer duplicata da MESMA pessoa
    var sig = leadSig(snap);
    Object.keys(state.trash).forEach(function (t2) {
      var o2 = state.trash[t2];
      var l2 = o2 && o2.d ? o2.d : o2;
      if (l2 && sig && siteOf(l2).key === st.key && leadSig(l2) === sig) delete state.trash[t2];
    });
    state.archived[fp] = snap;
    restored++;
  });
  saveState(state);
  window._trashMarked = {};
  toast(restored + ' lead(s) restaurado(s) para as colunas.');
  renderTrash();
  render();
}

function setStatus(msg) {
  document.getElementById('lastUpdate').textContent = msg;
}

function toast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(t._timer);
  t._timer = setTimeout(function () { t.classList.add('hidden'); }, 2600);
}

/* ------------------------------ EXPORT CSV -------------------------------- */

function exportCSV() {
  var sep = ';';
  var headers = ['Data', 'Hora', 'Site', 'Nome', 'Telefone', 'E-mail',
    'Veículo/Empresa', 'Serviço', 'Bairro/Região', 'Página', 'Tipo', 'Relato', 'Status'];
  var rows = [headers];

  allLeads.forEach(function (l) {
    var d = new Date(l._ts);
    rows.push([
      fmtDate(d), fmtTime(d), l._site.abv, leadName(l), leadPhone(l),
      leadEmail(l), leadVehicle(l), leadService(l), leadRegion(l),
      l.pagina || '', l.tipo || '', leadNotes(l), 'nova entrada'
    ]);
  });

  var csv = rows.map(function (r) {
    return r.map(function (c) { return '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"'; }).join(sep);
  }).join('\n');

  var blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'crm-geral-' + fmtDate(new Date()).replace(/\//g, '-') + '.csv';
  a.click();
  URL.revokeObjectURL(a.href);
  toast('CSV exportado (somente leads atuais).');
}

/* ----------------------------- INICIALIZAÇÃO ------------------------------- */

// Zera TODO o estado local do painel (arquivados, excluídos, observações) e
// busca novamente todos os leads dos sites. Nada é apagado nos sites — o CRM
// apenas lê as APIs; o estado zerado vive só no localStorage do navegador.
function resetAll() {
  var msg = 'Zerar TODOS os dados deste painel (CRM Geral SOSSEO)?\n\n' +
    '- Arquivados: serão apagados\n' +
    '- Excluídos (lixeira): serão apagados\n' +
    '- Observações: serão apagadas\n\n' +
    'Isso vale SOMENTE para este painel (navegador). Nenhum dado é apagado nos sites. ' +
    'Após zerar, todos os leads que ainda estão nos sites voltarão para a Nova Entrada.';
  if (!window.confirm(msg)) return;
  if (!window.confirm('Confirmação final — realmente deseja ZERAR TUDO?\n\nIsso não pode ser desfeito.')) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    // Mantém a sessão de login — zera apenas os dados do painel (arquivados/excluídos/obs).
  } catch (e) { /* ignore */ }
  toast('Painel zerado. Puxando todos os leads de novo...');
  setTimeout(function () { window.location.reload(); }, 400);
}

window.addEventListener('error', function (ev) {
  var b = document.getElementById('errorBanner');
  if (b) {
    b.classList.remove('hidden');
    b.textContent = 'Erro no app: ' + (ev.message || ev.error || 'desconhecido');
  }
});
window.addEventListener('unhandledrejection', function (ev) {
  var b = document.getElementById('errorBanner');
  if (b) {
    b.classList.remove('hidden');
    b.textContent = 'Erro assíncrono: ' + (ev.reason || 'desconhecido');
  }
});

function init() {
  document.getElementById('btnRefresh').addEventListener('click', refreshAll);
  document.getElementById('btnCsv').addEventListener('click', exportCSV);
  document.getElementById('btnTrash').addEventListener('click', openTrashModal);
  document.getElementById('btnReset').addEventListener('click', resetAll);
  document.getElementById('btnLogout').addEventListener('click', doLogout);
  document.getElementById('loginForm').addEventListener('submit', doLogin);
  document.getElementById('btnLoginBack').addEventListener('click', function () {
    window.location.href = 'https://sosseo.com.br/';
  });
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modal').addEventListener('click', function (e) {
    if (e.target === e.currentTarget) closeModal();
  });
  document.getElementById('trashClose').addEventListener('click', closeTrashModal);
  document.getElementById('trashModal').addEventListener('click', function (e) {
    if (e.target === e.currentTarget) closeTrashModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeModal(); closeTrashModal(); }
  });

  pruneTrash(); // aplica retenção de 6 meses já na inicialização

  // Exige login antes de mostrar os leads
  currentUser = getSession();
  if (!currentUser) {
    showLoginScreen();
    return;
  }
  hideLoginScreen();
  refreshAll();
  setInterval(refreshAll, 5 * 60 * 1000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}