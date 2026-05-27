/* STATE */
const AppState = {
  user: null,
  currentView: 'login',
  jogadores: [],
  eventos: [],
  comunicados: [],
  boleias: [],
  viaturas: [],
  users: [],
  currentDate: new Date(),
  activeModal: null,
  selectedEvent: null,
  selectedDate: null
};

/* UTILS */
function $(id) { return document.getElementById(id); }
function show(id) {
  const el = $(id);
  if (!el) return;
  if (el.classList.contains('modal-backdrop')) el.classList.add('active');
  else el.classList.remove('hidden');
}
function hide(id) {
  const el = $(id);
  if (!el) return;
  if (el.classList.contains('modal-backdrop')) el.classList.remove('active');
  else el.classList.add('hidden');
}
function showToast(msg, type='success') {
  const c = $('toastContainer');
  if (!c) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = type === 'success' ? `✅ ${msg}` : `❌ ${msg}`;
  c.appendChild(t);
  setTimeout(() => { t.style.opacity=0; setTimeout(()=>t.remove(),300); }, 3000);
}
function formatDatePT(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('pt-PT', { day:'2-digit', month:'2-digit', year:'numeric' });
}
function formatDateTimePT(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('pt-PT', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
}
function getInitials(name) {
  return (name || '?').split(' ').filter(Boolean).slice(0,2).map(n=>n[0]).join('').toUpperCase();
}
function pad2(n) { return String(n).padStart(2, '0'); }
function toDateInputValue(value) {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function toTimeInputValue(value) {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return value.slice(11, 16);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
function combineDateTime(date, time) {
  return `${date}T${time || '00:00'}:00`;
}
function normalizeRole(role) {
  return String(role || 'jogador')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}
function roleForApi(role) {
  const normalized = normalizeRole(role);
  if (normalized === 'presidente') return 'Presidente';
  if (normalized === 'treinador') return 'Treinador';
  return 'Jogador';
}
function decodeJwt(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(atob(payload).split('').map(c => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`).join(''));
    return JSON.parse(json);
  } catch (e) {
    return {};
  }
}
function normalizeUser(user = {}) {
  return {
    ...user,
    id: String(user.id ?? user.user_id ?? user.contacto ?? `u${Date.now()}`),
    nome: user.nome || user.name || 'Utilizador',
    contacto: user.contacto || user.phone || '',
    role: normalizeRole(user.role || user.tipo),
    tipo: user.tipo || roleForApi(user.role),
    dataNascimento: user.dataNascimento || user.data_nascimento || '',
    nomeEmergencia: user.nomeEmergencia || user.nome_emergencia || '',
    contactoEmergencia: user.contactoEmergencia || user.contacto_emergencia || '',
    posicao: user.posicao || '',
    ativo: user.ativo !== false,
    assiduidade: Number(user.assiduidade ?? 0)
  };
}
function normalizeEvent(evento = {}) {
  const dateTime = evento.data_hora || evento.dataHora || (evento.data ? combineDateTime(evento.data, evento.hora) : null);
  const tipo = evento.tipo || (evento.adversario ? 'Jogo' : 'Treino');
  const estado = evento.estado || evento.status || 'Agendado';
  const convocadosObj = evento.convocatoria?.convocados || evento.convocados || {};
  const convocados = Array.isArray(convocadosObj) ? convocadosObj : Object.keys(convocadosObj);
  const respostas = {};
  if (!Array.isArray(convocadosObj)) {
    Object.entries(convocadosObj).forEach(([id, resposta]) => {
      if (resposta && typeof resposta === 'object') respostas[id] = resposta.estado ? 'vou' : null;
      else if (resposta === true || resposta === 'vou') respostas[id] = 'vou';
      else if (resposta === 'naovou') respostas[id] = 'naovou';
    });
  }
  const gf = Number(evento.golos_favor ?? evento.golosMarcados ?? -1);
  const gc = Number(evento.golos_contra ?? evento.golosSofridos ?? -1);
  const resultado = evento.resultado || ((gf > 0 || gc > 0) ? { golosMarcados: gf, golosSofridos: gc, cronica: evento.cronica || '' } : null);

  return {
    ...evento,
    id: String(evento.id ?? `e${Date.now()}`),
    tipo,
    data: toDateInputValue(dateTime || evento.data),
    hora: toTimeInputValue(dateTime || evento.hora),
    data_hora: dateTime,
    local: evento.local || '',
    status: normalizeRole(estado) === 'cancelado' ? 'cancelado' : 'ativo',
    estado,
    adversario: evento.adversario || '',
    convocados,
    respostas,
    resultado
  };
}
function normalizeComunicado(comunicado = {}) {
  return {
    ...comunicado,
    id: String(comunicado.id ?? `c${Date.now()}`),
    titulo: comunicado.titulo || 'Comunicado',
    corpo: comunicado.corpo || '',
    data: toDateInputValue(comunicado.data) || new Date().toISOString().slice(0, 10),
    categoria: comunicado.categoria || 'Direcao'
  };
}
function normalizeViatura(viatura = {}) {
  const v = {
    ...viatura,
    id: String(viatura.id ?? viatura.matricula ?? `v${Date.now()}`),
    modelo: viatura.modelo || 'Viatura',
    matricula: viatura.matricula || '',
    lugares_totais: Number(viatura.lugares_totais ?? viatura.lugaresTotais ?? 0),
    proprietario: viatura.proprietario || null
  };
  return v
}
function normalizeBoleia(boleia = {}) {
  const viatura = normalizeViatura(boleia.viatura || {});
  const jogo = boleia.jogo ? normalizeEvent(boleia.jogo) : null;
  const passageiros = Array.isArray(boleia.passageiros) ? boleia.passageiros : [];
  const reservas = passageiros.map(p => String(p?.id ?? p)).filter(Boolean);
  const owner = viatura.proprietario || {};
  return {
    ...boleia,
    id: String(boleia.id ?? `b${Date.now()}`),
    jogoId: String(boleia.jogoId ?? boleia.jogo_id ?? jogo?.id ?? ''),
    jogo,
    condutorId: String(boleia.condutorId ?? owner.id ?? ''),
    condutorNome: owner.nome || boleia.condutorNome || viatura.modelo || 'Condutor',
    viatura: boleia.viaturaLabel || boleia.viaturaNome || viatura.modelo,
    viaturaId: boleia.viatura_id || viatura.id,
    lugaresDisponiveis: Number(boleia.lugaresDisponiveis ?? boleia.max_lugares ?? boleia.lugares_vagos ?? 0),
    lugaresVagos: Number(boleia.lugares_vagos ?? 0),
    partida: boleia.partida,
    reservas
  };
}
function asArray(data, key) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data[key])) return data[key];
  if (data && typeof data === 'object') return Object.values(data);
  return [];
}
const THEME_STORAGE_KEY = 'osbeiroes_theme';
function syncThemeFromStorage() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    return;
  }
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
}
function applyTheme(theme) {
  const t = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem(THEME_STORAGE_KEY, t);
}
function toggleTheme() {
  const t = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(t);
}
async function fakeNetworkDelay() {
  return new Promise(r => setTimeout(r, 400 + Math.random()*400));
}

/* API CALL */
const API_BASE = window.OS_BEIROES_API_BASE || localStorage.getItem('osbeiroes_api_base') || 'http://localhost:8080';//|| 'https://api.osbeiroes.cc';

function apiEndpoint(endpoint) {
  return endpoint;
}

async function apiCall(method, endpoint, body, options = {}) {
  const cleanEndpoint = apiEndpoint(endpoint);
  try {
    const res = await fetch(`${API_BASE}${cleanEndpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(AppState.user?.token && { 'Authorization': `Bearer ${AppState.user.token}` })
      },
      body: body ? JSON.stringify(body) : null
    });
    if (!res.ok) {
      let errorPayload = {};
      try {
        errorPayload = await res.json();
      } catch(e) {}
      const apiMessage = errorPayload.message || errorPayload.error;
      if (res.status === 403) showToast('Não tens permissão para esta ação.', 'error');
      else if (res.status === 401 && endpoint !== '/auth/login') showToast('Sessão expirada ou inválida.', 'error');
      else if (res.status === 400) showToast(apiMessage || 'Dados inválidos.', 'error');
      else if (endpoint !== '/auth/login') showToast(apiMessage || `Erro da API (${res.status}).`, 'error');
      return null;
    }
    
    const text = await res.text();
    try {
      return text ? JSON.parse(text) : true;
    } catch(e) {
      return text;
    }
  } catch (err) {
    console.warn(`API falhou (${endpoint}).`);
    if (method !== 'GET' && endpoint !== '/auth/login') {
      showToast('Não foi possível contactar a API.', 'error');
    }
    return null;
  }
}

let dataLoaded = false;
const loadedEventMonths = new Set();

function calendarBaseDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + calMonthOffset, 1);
}
function monthKey(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
}
async function loadEventosForMonth(date, force = false) {
  if (!AppState.user?.token) return;
  const key = monthKey(date);
  if (!force && loadedEventMonths.has(key)) return;
  const eventos = await apiCall('GET', `/eventos?ano=${date.getFullYear()}&mes=${date.getMonth() + 1}`);
  if (eventos) {
    const normalized = asArray(eventos, 'eventos').map(normalizeEvent);
    const otherMonths = AppState.eventos.filter(e => e.data?.slice(0, 7) !== key);
    AppState.eventos = [...otherMonths, ...normalized];
    loadedEventMonths.add(key);
  }
}
async function ensureDataLoaded() {
  if (dataLoaded) {
    await loadEventosForMonth(calendarBaseDate());
    return;
  }
  if (!AppState.user?.token) return;

  const [comunicados, boleias, jogadores, viaturas] = await Promise.all([
    apiCall('GET', '/comunicados'),
    apiCall('GET', '/boleias'),
    apiCall('GET', '/jogadores'),
    apiCall('GET', '/viaturas')
  ]);

  if (comunicados) AppState.comunicados = asArray(comunicados, 'comunicados').map(normalizeComunicado);
  if (jogadores && !Object.hasOwn(jogadores,'msg') ) {
    const allUsers = asArray(jogadores, 'jogadores').map(normalizeUser);
    AppState.users = allUsers;
    AppState.jogadores = allUsers.filter(u => u.role === 'jogador');
    const current = allUsers.find(u => u.contacto === AppState.user.contacto || u.id === AppState.user.id);
    if (current) AppState.user = { ...AppState.user, ...current, token: AppState.user.token };
  }
  if (boleias) AppState.boleias = asArray(boleias, 'boleias').map(normalizeBoleia);
  if (viaturas) AppState.viaturas = asArray(viaturas, 'viaturas').map(normalizeViatura);
  await loadEventosForMonth(calendarBaseDate());
  const rideMonths = AppState.boleias
    .map(b => b.jogo?.data_hora || b.partida)
    .map(value => value ? new Date(value) : null)
    .filter(date => date && !Number.isNaN(date.getTime()));
  await Promise.all(rideMonths.map(date => loadEventosForMonth(date)));

  dataLoaded = true;
  saveState();
}

/* AUTH */
function fillLogin(c, p) { $('loginContacto').value=c; $('loginPassword').value=p; }

async function handleLogin(e) {
  e.preventDefault();
  $('fullLoader').classList.remove('hidden');
  
  const c = $('loginContacto').value;
  const p = $('loginPassword').value;
  
  const res = await apiCall('POST', '/auth/login', { contacto: c, password: p });
  $('fullLoader').classList.add('hidden');
  
  if (res) {
    const token = typeof res === 'string' ? res : (res.access_token || res.token || res.accessToken || res.jwt || null);
    const claims = token ? decodeJwt(token) : {};
    const apiUser = typeof res === 'object' ? (res.user || res.utilizador || res.profile) : null;
    let u = normalizeUser(apiUser || AppState.users.find(x => x.contacto === c) || {
      id: claims.sub || c,
      nome: 'Utilizador',
      contacto: claims.sub || c,
      role: claims.role || 'Jogador'
    });
    u = { ...u, token };
    AppState.user = u;
    dataLoaded = false;
    await ensureDataLoaded();
    navigate('home');
    showToast('Sessão iniciada com sucesso.');
  } else {
    // Fallback Mock
    const u = AppState.users.find(x => x.contacto === c && x.password === p);
    if(u) {
      AppState.user = { ...normalizeUser(u), token: u.token || 'tok_local' };
      navigate('home');
      showToast('Sessão iniciada (Modo Offline).');
    } else {
      showToast('Credenciais incorretas, tenta novamente.', 'error');
    }
  }
}
async function handleRegister(e) {
  e.preventDefault();
  if($('regPassword').value !== $('regPasswordConfirm').value) {
    showToast('As passwords não coincidem.', 'error'); return;
  }
  $('fullLoader').classList.remove('hidden');
  
  const body = {
    nome: $('regNome').value,
    contacto: $('regContacto').value,
    password: $('regPassword').value,
    role: $('regRole').value
  };
  const res = null;
  
  $('fullLoader').classList.add('hidden');
  
  const token = res ? (typeof res === 'string' ? res : (res.access_token || res.token || res.accessToken || res.jwt)) : 'tok_new';
  const apiUser = res && typeof res === 'object' ? (res.user || res.utilizador || res.profile) : null;
  const newUser = normalizeUser(apiUser || {
    id: 'u' + Date.now(),
    nome: body.nome,
    contacto: body.contacto,
    role: body.role
  });
  AppState.users.push({ ...newUser, password: body.password });
  AppState.user = { ...newUser, token };
  dataLoaded = false;
  await ensureDataLoaded();
  navigate('home');
  showToast(res ? 'Conta criada com sucesso.' : 'Conta criada (Modo Offline).');
}
function handleLogout() {
  AppState.user = null;
  dataLoaded = false;
  localStorage.removeItem('osbeiroes_state');
  navigate('login');
}

/* NAVIGATION & RENDERING */

// Load state from local storage on init if present
const saved = localStorage.getItem('osbeiroes_state');
if (saved) {
    try {
      Object.assign(AppState, JSON.parse(saved));
      AppState.currentDate = new Date(AppState.currentDate || Date.now());
      AppState.user = AppState.user ? normalizeUser(AppState.user) : null;
      AppState.jogadores = asArray(AppState.jogadores).map(normalizeUser);
      AppState.eventos = asArray(AppState.eventos).map(normalizeEvent);
      AppState.comunicados = asArray(AppState.comunicados).map(normalizeComunicado);
      AppState.boleias = asArray(AppState.boleias).map(normalizeBoleia);
      AppState.viaturas = asArray(AppState.viaturas).map(normalizeViatura);
    } catch (e) {
      localStorage.removeItem('osbeiroes_state');
    }
}
syncThemeFromStorage();
document.addEventListener('astro:page-load', syncThemeFromStorage);
window.addEventListener('storage', (e) => {
  if (e.key === THEME_STORAGE_KEY) syncThemeFromStorage();
});

// Save state on unload
window.addEventListener('beforeunload', () => {
    localStorage.setItem('osbeiroes_state', JSON.stringify(AppState));
});

// Since Astro ViewTransitions preserves the window, we also save state aggressively after API calls:
function saveState() {
    localStorage.setItem('osbeiroes_state', JSON.stringify(AppState));
}

window.navigate = function(view) {
  saveState();
  const target = view === 'login' ? '/' : '/' + view;
  window.location.href = target; // Use client router navigation indirectly
};

// Wrap renderViews to ensure state runs 
const _origRenderView = renderView;
window.renderView = async function(view) {
  saveState();
  try {
    await _origRenderView(view);
  } catch(e) { console.warn("View render ignored because element not found (Astro handled it).") }
};


// Auto Login handler
async function handleAutoLogin() {
  $('loginContacto').value = '910000001'; // Default to Presidente Quim
  $('loginPassword').value = 'quim123';
  await handleLogin(new Event('submit'));
}


async function renderView(view) {
  AppState.currentView = view;
  if (!AppState.user && !['login', 'register'].includes(view)) {
    navigate('login');
    return;
  }
  await ensureDataLoaded();
  if(view==='home') renderHome();
  if(view==='calendar') renderCalendar();
  if(view==='jogos') renderJogos();
  if(view==='boleias') renderBoleias();
  if(view==='comunicados') renderComunicadosList();
  if(view==='plantel') renderPlantel();
  if(view==='perfil') renderPerfil();
}

/* HOME */
function renderHome() {
  $('homeUserName').innerText = AppState.user.nome.split(' ')[0];
  
  const r = AppState.user.role;
  if(r==='presidente' || r==='treinador') show('homeQuickActions');
  else hide('homeQuickActions');
  
  // Today's events
  const todayStr = new Date().toISOString().split('T')[0];
  const eventosHoje = AppState.eventos.filter(e => e.data === todayStr && e.status==='ativo');
  
  let html = '';
  if(eventosHoje.length === 0) {
    html = '<div class="card text-center"><p class="text-muted">Sem eventos marcados para hoje.</p></div>';
    hide('homeJogoBanner');
  } else {
    let hasJogo = false;
    eventosHoje.forEach(e => {
      if(e.tipo==='Jogo') hasJogo=true;
      const icon = e.tipo==='Jogo'?'⚽':'🏃';
      const color = e.tipo==='Jogo'?'red':'green';
      html += `
        <div class="card card-accent-${color} d-flex align-center gap-4" onclick="navigate('calendar')">
          <div style="font-size:24px;">${icon}</div>
          <div>
            <div style="font-weight:700;">${e.tipo} ${e.adversario ? 'vs '+e.adversario : ''}</div>
            <div class="text-muted">${e.hora} • ${e.local}</div>
          </div>
        </div>`;
    });
    if(hasJogo) show('homeJogoBanner'); else hide('homeJogoBanner');
  }
  $('homeEventosContainer').innerHTML = html;
  
  // Comunicados
  const coms = AppState.comunicados.slice().reverse().slice(0,3);
  let chtml = '';
  coms.forEach(c => {
    const badge = normalizeRole(c.categoria)==='direcao' ? 'badge-red' : 'badge-green';
    chtml += `
      <div class="card" onclick="openModalComunicadoDetails('${c.id}')">
        <div class="d-flex justify-between align-center mb-2">
          <span class="badge ${badge}">${c.categoria}</span>
          <span class="text-muted" style="font-size:12px;">${formatDatePT(c.data)}</span>
        </div>
        <div style="font-weight:700;margin-bottom:4px;">${c.titulo}</div>
        <div class="text-muted" style="font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${c.corpo}</div>
      </div>
    `;
  });
  $('homeComunicadosContainer').innerHTML = chtml;
}

/* CALENDAR */
let calMonthOffset = 0;
async function changeMonth(dir) {
  calMonthOffset += dir;
  await loadEventosForMonth(calendarBaseDate());
  renderCalendar();
}
function renderCalendar() {
  const now = new Date();
  const date = calendarBaseDate();
  const monthNames = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  $('calendarMonthYear').innerText = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  
  const daysInMonth = new Date(date.getFullYear(), date.getMonth()+1, 0).getDate();
  const firstDayIndex = date.getDay();
  
  let grid = '';
  for(let i=0; i<firstDayIndex; i++) grid += '<div class="calendar-day empty"></div>';
  
  const mStr = String(date.getMonth()+1).padStart(2,'0');
  const yStr = date.getFullYear();
  
  for(let i=1; i<=daysInMonth; i++) {
    const dStr = String(i).padStart(2,'0');
    const fullDate = `${yStr}-${mStr}-${dStr}`;
    const evs = AppState.eventos.filter(e => e.data === fullDate);
    
    let dots = '';
    evs.forEach(e => {
      if(e.status==='cancelado') return;
      dots += `<div class="dot dot-${e.tipo.toLowerCase()}"></div>`;
    });
    
    const todayStr = new Date().toISOString().split('T')[0];
    const isToday = (fullDate === todayStr) ? 'today' : '';
    grid += `<div class="calendar-day ${isToday}" onclick="selectDate('${fullDate}', this)">${i}<div class="calendar-dots">${dots}</div></div>`;
  }
  $('calendarGrid').innerHTML = grid;
  
  const r = AppState.user.role;
  if(r==='presidente'||r==='treinador') show('btnNovoEvento'); else hide('btnNovoEvento');
  
  const todayStr = new Date().toISOString().split('T')[0];
  const selected = todayStr.startsWith(`${yStr}-${mStr}`) ? todayStr : `${yStr}-${mStr}-01`;
  selectDate(AppState.selectedDate?.startsWith(`${yStr}-${mStr}`) ? AppState.selectedDate : selected, null);
}

function selectDate(dateStr, el) {
  AppState.selectedDate = dateStr;
  if(el) {
    document.querySelectorAll('.calendar-day').forEach(d=>d.classList.remove('active'));
    el.classList.add('active');
  }
  const d = new Date(dateStr);
  $('selectedDateLabel').innerText = `Eventos - ${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
  
  const evs = AppState.eventos.filter(e => e.data === dateStr);
  let html = '';
  if(evs.length===0) {
    html = '<div class="empty-state" style="padding:32px 16px;"><div class="empty-icon">📅</div><p>Sem eventos marcados.</p></div>';
  } else {
    evs.forEach(e => {
      const isCanc = e.status==='cancelado';
      const icon = e.tipo==='Jogo'?'⚽':'🏃';
      const title = e.tipo==='Jogo' ? `Jogo vs ${e.adversario}` : 'Treino';
      
      let badge = '';
      if(isCanc) badge = '<span class="badge badge-red ml-2">CANCELADO</span>';
      
      html += `
        <div class="card ${isCanc?'':'card-accent-'+(e.tipo==='Jogo'?'red':'green')}" onclick="openModalEventoDetails('${e.id}')" style="cursor:pointer; opacity:${isCanc?0.5:1}">
          <div class="d-flex justify-between align-center mb-1">
            <div class="d-flex align-center gap-2">
              <span style="font-size:20px;">${icon}</span>
              <span style="font-weight:700;">${title}</span>
            </div>
            ${badge}
          </div>
          <div class="text-muted d-flex align-center gap-2" style="font-size:14px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${e.hora}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-left:8px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ${e.local}
          </div>
        </div>`;
    });
  }
  $('calendarDayEvents').innerHTML = html;
}

/* EVENTOS MODAL */
function eventTitle(evento) {
  if (!evento) return 'Evento';
  return evento.tipo === 'Jogo' ? `Jogo vs ${evento.adversario || 'adversário por definir'}` : 'Treino';
}

function openModalEventoDetails(id) {
  const ev = AppState.eventos.find(e => e.id === id);
  if(!ev) return;
  AppState.selectedEvent = id;
  $('eventDetailIcon').innerText = ev.tipo === 'Jogo' ? '⚽' : '🏃';
  $('eventDetailTitle').innerText = eventTitle(ev);
  $('eventDetailType').innerText = ev.tipo;
  $('eventDetailDate').innerText = `${formatDatePT(ev.data)}${ev.hora ? ` às ${ev.hora}` : ''}`;
  $('eventDetailLocal').innerText = ev.local || 'Local por definir';
  $('eventDetailStatus').innerText = ev.estado || (ev.status === 'cancelado' ? 'Cancelado' : 'Agendado');
  $('eventDetailAdversarioRow').classList.toggle('hidden', ev.tipo !== 'Jogo');
  $('eventDetailAdversario').innerText = ev.adversario || 'Por definir';
  $('eventDetailResultadoRow').classList.toggle('hidden', !ev.resultado);
  if(ev.resultado) {
    $('eventDetailResultado').innerText = `${ev.resultado.golosMarcados} - ${ev.resultado.golosSofridos}`;
  }

  let actions = '';
  const role = AppState.user.role;
  if(role === 'presidente' || role === 'treinador') {
    actions += `<button class="btn btn-secondary" onclick="openEditEvento('${ev.id}')">Editar Evento</button>`;
  }
  if(role === 'treinador' && ev.status !== 'cancelado') {
    if(ev.tipo === 'Treino') actions += `<button class="btn btn-primary" onclick="closeModal('modalEventoDetails'); openModalPresencas('${ev.id}')">Registar Presenças</button>`;
    if(ev.tipo === 'Jogo') actions += `<button class="btn btn-primary" onclick="closeModal('modalEventoDetails'); openModalConvocatoria('${ev.id}')">Gerir Convocatória</button>`;
  }
  if(ev.tipo === 'Jogo') {
    actions += `<button class="btn btn-secondary" onclick="closeModal('modalEventoDetails'); navigate('jogos')">Ver Jogo</button>`;
  }
  $('eventDetailActions').innerHTML = actions || '<p class="text-muted text-center">Sem ações disponíveis para este evento.</p>';
  openModal('modalEventoDetails');
}

function openEditEvento(id) {
  const ev = AppState.eventos.find(e => e.id === id);
  if(!ev) return;
  closeModal('modalEventoDetails');
  openModal('modalEvento');
  $('modalEventoTitle').innerText = 'Editar Evento';
  $('evId').value = ev.id;
  setEventoTipo(ev.tipo);
  $('evData').value = ev.data || '';
  $('evHora').value = ev.hora || '';
  $('evLocal').value = ev.local || '';
  $('evAdversario').value = ev.adversario || '';
  $('evStatus').value = ev.status === 'cancelado' ? 'cancelado' : 'ativo';
}

function setEventoTipo(tipo) {
  $('evTipo').value = tipo;
  $('btnTipoTreino').className = tipo==='Treino' ? 'btn btn-primary' : 'btn btn-secondary';
  $('btnTipoJogo').className = tipo==='Jogo' ? 'btn btn-primary' : 'btn btn-secondary';
  if(tipo==='Jogo') show('fgAdversario'); else hide('fgAdversario');
}
async function handleSaveEvento(e) {
  e.preventDefault();
  const id = $('evId').value || 'e'+Date.now();
  const date = $('evData').value;
  const time = $('evHora').value;
  const body = {
    tipo: $('evTipo').value,
    data_hora: combineDateTime(date, time),
    local: $('evLocal').value,
    adversario: $('evTipo').value==='Jogo' ? $('evAdversario').value : undefined
  };
  const isEdit = !!$('evId').value;
  const res = isEdit ? null : await apiCall('POST', '/eventos', body);
  if (!isEdit && !res) return;
  
  const ev = normalizeEvent({
    ...body,
    id,
    id: res?.id || id,
    estado: $('evStatus').value === 'cancelado' ? 'Cancelado' : 'Agendado'
  });
  const idx = AppState.eventos.findIndex(x=>x.id===id);
  if(idx>=0) AppState.eventos[idx] = ev;
  else AppState.eventos.push(ev);
  loadedEventMonths.add(ev.data.slice(0, 7));
  
  closeModal('modalEvento');
  if(AppState.currentView==='calendar') renderCalendar();
  if(AppState.currentView==='home') renderHome();
  showToast('Evento guardado!');
}

/* JOGOS */
function switchJogosTab(tab) {
  if(tab==='convocatorias') {
    $('tabConvocatorias').classList.add('active'); $('tabResultados').classList.remove('active');
    show('jogosConvocatoriasContainer'); hide('jogosResultadosContainer');
    const r = AppState.user.role;
    if(r==='treinador') show('btnNovaConvocatoria'); else hide('btnNovaConvocatoria');
  } else {
    $('tabConvocatorias').classList.remove('active'); $('tabResultados').classList.add('active');
    hide('jogosConvocatoriasContainer'); show('jogosResultadosContainer');
    hide('btnNovaConvocatoria');
  }
}

function debug_this(data){
  openModal('modalDebug');
  document.getElementById('debugOutput').textContent = JSON.stringify(data, null, 2);
}
function renderJogos() {
  switchJogosTab('convocatorias');
  
  const jogos = AppState.eventos.filter(e=>e.tipo==='Jogo').sort((a,b)=>a.data.localeCompare(b.data));
  const today = new Date().toISOString().split('T')[0];
  
  const upcoming = jogos.filter(j => j.data >= today);
  const past = jogos.filter(j => j.data < today);
  if(AppState.user.role==='treinador' && upcoming.length > 0) show('btnNovaConvocatoria');
  else hide('btnNovaConvocatoria');
  
  // Convocatórias
  let cHtml = '';
  if(upcoming.length===0) cHtml = '<div class="empty-state"><div class="empty-icon">⚽</div><p>Sem jogos futuros.</p></div>';
  upcoming.forEach(j => {
    let convStatus = '';
    let btnHtml = '';
    const r = AppState.user.role;

    if(!j.convocados || j.convocados.length===0) {
      convStatus = '<span class="badge badge-gray">Aguardar Convocatória</span>';
      if(r==='treinador') btnHtml = `<button class="btn btn-secondary mt-2" style="height:36px;font-size:14px;" onclick="openModalConvocatoria('${j.id}')">Criar Convocatória</button>`;
    } else {
      const confs = Object.values(j.respostas||{}).filter(v=>v==='vou').length;
      convStatus = `<span class="badge badge-green">${confs} Confirmados</span> <span class="badge badge-gray ml-2">${j.convocados.length} Convocados</span>`;
      
      if(r==='jogador') {
        // Find player ID for this user (mock match by name/phone in real app)
        const myJog = AppState.jogadores.find(x=>x.contacto === AppState.user.contacto);
        if(j.convocados.includes(myJog.id)) {
          const resp = j.respostas?.[myJog.id];
          if(!resp) {
            btnHtml = `<button class="btn btn-primary mt-2" onclick="openModalResposta('${j.id}')">RESPONDER À CONVOCATÓRIA</button>`;
          } else {
            const respBadge = resp==='vou' ? '<span style="color:var(--color-success);font-weight:bold;">✅ VOU</span>' : '<span style="color:var(--color-error);font-weight:bold;">❌ NÃO VOU</span>';
            btnHtml = `<div class="mt-2 p-2 text-center" style="background:var(--color-surface-2);border-radius:8px;">A tua resposta: ${respBadge} <a href="#" onclick="openModalResposta('${j.id}')" style="margin-left:8px;font-size:12px;color:var(--color-text-muted);">Alterar</a></div>`;
          }
        } else {
          btnHtml = `<div class="mt-2 text-muted text-center" style="font-size:14px;">Não estás convocado.</div>`;
        }
      } else if(r==='treinador') {
         btnHtml = `<button class="btn btn-secondary mt-2" style="height:36px;font-size:14px;" onclick="openModalConvocatoria('${j.id}')">Editar Convocatória</button>`;
      }
    }
    
    cHtml += `
      <div class="card card-accent-red">
        <div class="d-flex justify-between mb-2">
          <div style="font-weight:700;font-size:18px;">vs ${j.adversario}</div>
          <div class="text-muted" style="font-size:14px;">${formatDatePT(j.data)}</div>
        </div>
        <div class="mb-2">${convStatus}</div>
        <div class="text-muted" style="font-size:14px;">📍 ${j.local} ⏰ ${j.hora}</div>
        ${btnHtml}
      </div>
    `;
  });
  $('jogosConvocatoriasContainer').innerHTML = cHtml;
  
  // Resultados
  let rHtml = '';
  if(past.length===0) rHtml = '<div class="empty-state"><div class="empty-icon">🏆</div><p>Sem resultados registados.</p></div>';
  past.reverse().forEach(j => {
    if(!j.resultado) {
      if(AppState.user.role==='treinador' || AppState.user.role==='presidente') {
         rHtml += `
          <div class="card">
            <div class="d-flex justify-between mb-2"><div style="font-weight:700;">vs ${j.adversario}</div><div class="text-muted">${formatDatePT(j.data)}</div></div>
            <button class="btn btn-secondary mt-2" onclick="openModalResultado('${j.id}')">Registar Resultado</button>
          </div>`;
      }
      return;
    }
    
    const gm = j.resultado.golosMarcados;
    const gs = j.resultado.golosSofridos;
    let resBadge = '';
    if(gm > gs) resBadge = '<span class="badge badge-green">VITÓRIA ✅</span>';
    else if(gm < gs) resBadge = '<span class="badge badge-red">DERROTA ❌</span>';
    else resBadge = '<span class="badge badge-gray">EMPATE ➖</span>';
    
    rHtml += `
      <div class="card card-accent-${gm>gs?'green':(gm<gs?'red':'gray')}">
        <div class="d-flex justify-between align-center mb-2">
          ${resBadge}
          <div class="text-muted" style="font-size:14px;">${formatDatePT(j.data)}</div>
        </div>
        <div class="text-center my-4">
          <div style="font-size:32px;font-family:'Bebas Neue';font-weight:700;">Os Beirões <span style="color:var(--color-primary);margin:0 8px;">${gm} - ${gs}</span> ${j.adversario}</div>
        </div>
        ${j.resultado.cronica ? `<div class="text-muted text-center" style="font-style:italic;font-size:14px;">"${j.resultado.cronica}"</div>` : ''}
      </div>`;
  });
  $('jogosResultadosContainer').innerHTML = rHtml;
}

/* BOLEIAS */
function rideFallbackEvent(boleia) {
  const fromRide = boleia.jogo || {};
  const data = fromRide.data || toDateInputValue(fromRide.data_hora || boleia.partida);
  const hora = fromRide.hora || toTimeInputValue(fromRide.data_hora || boleia.partida);
  return normalizeEvent({
    ...fromRide,
    id: boleia.jogoId || fromRide.id,
    tipo: 'Jogo',
    data,
    hora,
    adversario: fromRide.adversario || 'Jogo associado',
    local: fromRide.local || 'Local por confirmar',
    estado: fromRide.estado || 'Agendado'
  });
}

function eventForRide(boleia) {
  return AppState.eventos.find(e => e.id === boleia.jogoId) || rideFallbackEvent(boleia);
}

function rideGameGroups() {
  const groups = new Map();
  const today = new Date().toISOString().split('T')[0];
  AppState.eventos
    .filter(e => e.tipo==='Jogo' && e.local.toLowerCase() !== 'campo principal' && e.data >= today)
    .forEach(e => groups.set(e.id, { event: e, rides: [] }));

  AppState.boleias.forEach(b => {
    const ev = eventForRide(b);
    if(!ev?.id) return;
    if(!groups.has(ev.id)) groups.set(ev.id, { event: ev, rides: [] });
    const group = groups.get(ev.id);
    group.event = AppState.eventos.find(e => e.id === ev.id) || group.event;
    group.rides.push(b);
  });

  return Array.from(groups.values()).sort((a,b) => {
    const ad = a.event.data || '';
    const bd = b.event.data || '';
    return ad.localeCompare(bd);
  });
}

function renderBoleias() {
  const today = new Date().toISOString().split('T')[0];
  const jogosFora = rideGameGroups();
  
  let html = '';
  if(jogosFora.length === 0) {
    html = '<div class="empty-state"><div class="empty-icon">🚗</div><p>Não há jogos fora agendados.</p></div>';
  } else {
    jogosFora.forEach(({ event: j, rides: bs }) => {
      let avatHtml = '';
      let vagasTotais = 0;
      bs.forEach(b => {
        avatHtml += `<div class="avatar" style="width:32px;height:32px;font-size:12px;border:2px solid #fff;margin-left:-8px;">${getInitials(b.condutorNome)}</div>`;
        vagasTotais += Math.max(0, b.lugaresDisponiveis - (b.reservas?.length || 0));
      });
      if(bs.length>0) avatHtml = `<div class="d-flex" style="padding-left:8px;">${avatHtml}</div>`;
      
      const isPast = j.data && j.data < today;
      html += `
        <div class="card card-accent-red" style="cursor:pointer;" onclick="openModalBoleias('${j.id}')">
          <div class="d-flex justify-between mb-2">
            <div style="font-weight:700;">vs ${j.adversario || 'Jogo associado'}</div>
            <div class="text-muted" style="font-size:14px;">${formatDatePT(j.data)}</div>
          </div>
          <div class="text-muted mb-3" style="font-size:14px;">📍 ${j.local || 'Local por confirmar'}${isPast ? ' • Jogo passado' : ''}</div>
          <div class="d-flex justify-between align-center p-2" style="background:var(--color-surface-2);border-radius:8px;">
            ${bs.length===0 ? '<span class="text-muted" style="font-size:14px;">Sem boleias oferecidas.</span>' : `
              <div class="d-flex align-center gap-2">
                ${avatHtml}
                <span style="font-weight:600;font-size:14px;color:var(--color-primary);">${vagasTotais} vagas</span>
              </div>
            `}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
          </div>
        </div>`;
    });
  }
  $('boleiasContainer').innerHTML = html;
}

/* PLANTEL */
let plantelPage = 1;
const LIST_PAGE_SIZE = 5;
function changePlantelPage(page) {
  plantelPage = page;
  renderPlantel();
}
function renderPlantel() {
  const addButton = $('btnNovoJogador');
  if(addButton) {
    if(AppState.user.role==='presidente' || AppState.user.role==='treinador') show('btnNovoJogador');
    else hide('btnNovoJogador');
  }
  const search = $('searchJogador').value.toLowerCase();
  let list = AppState.jogadores;
  if(search) list = list.filter(j => j.nome.toLowerCase().includes(search));
  const totalPages = Math.max(1, Math.ceil(list.length / LIST_PAGE_SIZE));
  if (plantelPage > totalPages) plantelPage = totalPages;
  const pageItems = list.slice((plantelPage - 1) * LIST_PAGE_SIZE, plantelPage * LIST_PAGE_SIZE);
  
  let html = '';
  pageItems.forEach(j => {
    html += `
      <div class="card d-flex align-center gap-4" style="cursor:pointer;opacity:${j.ativo?1:0.5};" onclick="openModalPlayerProfile('${j.id}')">
        <div class="avatar">${getInitials(j.nome)}</div>
        <div style="flex:1;">
          <div style="font-weight:700;">${j.nome} ${!j.ativo?'(Inativo)':''}</div>
          <div class="text-muted" style="font-size:14px;">${j.posicao}</div>
        </div>
        <div class="text-right">
          <div style="font-weight:800;color:var(--color-primary);">${j.assiduidade}%</div>
          <div style="font-size:10px;color:var(--color-text-muted);">ASSIDUIDADE</div>
        </div>
      </div>
    `;
  });
  if (list.length === 0) {
    html = '<div class="empty-state"><p>Nenhum jogador encontrado.</p></div>';
  } else if (totalPages > 1) {
    html += `
      <div class="pagination">
        <button class="btn btn-secondary" ${plantelPage === 1 ? 'disabled' : ''} onclick="changePlantelPage(${plantelPage - 1})">Anterior</button>
        <span>${plantelPage}/${totalPages}</span>
        <button class="btn btn-secondary" ${plantelPage === totalPages ? 'disabled' : ''} onclick="changePlantelPage(${plantelPage + 1})">Seguinte</button>
      </div>`;
  }
  $('plantelContainer').innerHTML = html;
}

/* COMUNICADOS */
let comunicadosPage = 1;
function changeComunicadosPage(page) {
  comunicadosPage = page;
  renderComunicadosList();
}
function renderComunicadosList() {
  const r = AppState.user.role;
  if(r==='presidente'||r==='treinador') show('btnNovoComunicado2'); else hide('btnNovoComunicado2');
  
  let html = '';
  const list = AppState.comunicados.slice().reverse();
  const totalPages = Math.max(1, Math.ceil(list.length / LIST_PAGE_SIZE));
  if (comunicadosPage > totalPages) comunicadosPage = totalPages;
  list.slice((comunicadosPage - 1) * LIST_PAGE_SIZE, comunicadosPage * LIST_PAGE_SIZE).forEach(c => {
    const badge = normalizeRole(c.categoria)==='direcao' ? 'badge-red' : 'badge-green';
    html += `
      <div class="card" onclick="openModalComunicadoDetails('${c.id}')">
        <div class="d-flex justify-between align-center mb-2">
          <span class="badge ${badge}">${c.categoria}</span>
          <span class="text-muted" style="font-size:12px;">${formatDatePT(c.data)}</span>
        </div>
        <div style="font-weight:700;font-size:18px;margin-bottom:8px;">${c.titulo}</div>
        <div class="text-muted" style="font-size:14px;">${c.corpo}</div>
      </div>
    `;
  });
  if (list.length === 0) {
    html = '<div class="empty-state"><p>Sem comunicados publicados.</p></div>';
  } else if (totalPages > 1) {
    html += `
      <div class="pagination">
        <button class="btn btn-secondary" ${comunicadosPage === 1 ? 'disabled' : ''} onclick="changeComunicadosPage(${comunicadosPage - 1})">Anterior</button>
        <span>${comunicadosPage}/${totalPages}</span>
        <button class="btn btn-secondary" ${comunicadosPage === totalPages ? 'disabled' : ''} onclick="changeComunicadosPage(${comunicadosPage + 1})">Seguinte</button>
      </div>`;
  }
  $('comunicadosListContainer').innerHTML = html;
}

/* PERFIL */
function renderPerfil() {
  $('perfilName').innerText = AppState.user.nome;
  $('perfilRole').innerText = AppState.user.role.toUpperCase();
  $('perfilContacto').innerText = AppState.user.contacto;
  $('perfilAvatar').innerText = getInitials(AppState.user.nome);
  
  if(AppState.user.role==='presidente') {
    show('perfilGestaoPlantel'); show('perfilDocs');
  } else {
    hide('perfilGestaoPlantel'); hide('perfilDocs');
  }
}

/* MODAL HELPERS */
function openModal(id) {
  AppState.activeModal = id;
  // Reset forms on open
  if(id==='modalEvento') { $('modalEventoTitle').innerText='Novo Evento'; $('evId').value=''; $('evData').value=AppState.selectedDate || new Date().toISOString().slice(0, 10); $('evHora').value='20:00'; $('evLocal').value=''; $('evAdversario').value=''; $('evStatus').value='ativo'; setEventoTipo('Treino'); }
  if(id==='modalComunicado') { $('comTitulo').value=''; $('comCorpo').value=''; }
  if(id==='modalJogador') { $('modalJogadorTitle').innerText='Novo Jogador'; $('jogId').value=''; $('jogNome').value=''; $('jogNascimento').value=''; $('jogContacto').value=''; if($('jogPassword')) $('jogPassword').value=''; $('jogNomeEmergencia').value=''; $('jogContactoEmergencia').value=''; hide('btnInativarJog'); }
  show(id);
}
function closeModal(id) {
  hide(id);
  AppState.activeModal = null;
}

/* COMUNICADO ACTIONS */
async function handleSaveComunicado(e) {
  e.preventDefault();
  const body = {
    titulo: $('comTitulo').value,
    corpo: $('comCorpo').value
  };
  const res = await apiCall('POST', '/comunicados', body);
  if (!res) return;

  AppState.comunicados.push(normalizeComunicado({
    id: res?.id || 'c'+Date.now(),
    categoria: $('comCategoria').value,
    titulo: $('comTitulo').value,
    corpo: $('comCorpo').value,
    data: AppState.currentDate.toISOString().split('T')[0]
  }));
  closeModal('modalComunicado');
  if(AppState.currentView==='home') renderHome();
  if(AppState.currentView==='comunicados') renderComunicadosList();
  showToast('Comunicado publicado!');
}

/* JOGADOR ACTIONS */
async function handleSaveJogador(e) {
  e.preventDefault();
  const id = $('jogId').value || 'j'+Date.now();
  const body = {
    id,
    nome: $('jogNome').value,
    data_nascimento: $('jogNascimento').value,
    posicao: $('jogPosicao').value,
    contacto: $('jogContacto').value,
    password: $('jogPassword')?.value || 'jogador123',
    nome_emergencia: $('jogNomeEmergencia').value,
    contacto_emergencia: $('jogContactoEmergencia').value
  };
  const isEdit = !!$('jogId').value;
  const res = isEdit ? null : await apiCall('POST', '/jogadores/jogador', body);
  if (!isEdit && !res) return;
  
  const j = normalizeUser({
    ...body,
    id: res?.id || id,
    nome: $('jogNome').value,
    dataNascimento: $('jogNascimento').value,
    posicao: $('jogPosicao').value,
    contacto: $('jogContacto').value,
    nomeEmergencia: $('jogNomeEmergencia').value,
    contactoEmergencia: $('jogContactoEmergencia').value,
    ativo: true,
    assiduidade: AppState.jogadores.find(x=>x.id===id)?.assiduidade || 0
  });
  const idx = AppState.jogadores.findIndex(x=>x.id===id);
  if(idx>=0) AppState.jogadores[idx] = j;
  else AppState.jogadores.push(j);
  
  closeModal('modalJogador');
  renderPlantel();
  showToast('Jogador guardado!');
}
async function handleInactivateJogador() {
  const id = $('jogId').value;
  if(confirm("Tens a certeza que queres inativar este jogador?")) {
    const j = AppState.jogadores.find(x=>x.id===id);
    if(j) j.ativo = false;
    closeModal('modalJogador');
    renderPlantel();
    showToast('Jogador inativado.');
  }
}

function openEditPlayerFromProfile() {
  const id = AppState.selectedPlayerId;
  const j = AppState.jogadores.find(x=>x.id===id);
  if(!j) return;
  closeModal('modalPlayerProfile');
  openModal('modalJogador');
  $('modalJogadorTitle').innerText = "Editar Jogador";
  $('jogId').value = j.id;
  $('jogNome').value = j.nome;
  $('jogNascimento').value = j.dataNascimento;
  $('jogPosicao').value = j.posicao;
  $('jogContacto').value = j.contacto;
  $('jogNomeEmergencia').value = j.nomeEmergencia || '';
  $('jogContactoEmergencia').value = j.contactoEmergencia || '';
  if($('jogPassword')) $('jogPassword').value = '';
  show('btnInativarJog');
}

function openModalPlayerProfile(id) {
  AppState.selectedPlayerId = id;
  const j = AppState.jogadores.find(x=>x.id===id);
  if(!j) return;
  $('ppAvatar').innerText = getInitials(j.nome);
  $('ppNome').innerText = j.nome;
  $('ppPosicao').innerText = j.posicao;
  $('ppAssiduidade').innerText = `Assiduidade: ${j.assiduidade}%`;
  
  const r = AppState.user.role;
  if(r==='presidente'||r==='treinador') {
    if(j.nomeEmergencia) {
      show('ppEmergencySection');
      $('ppEmergenciaNome').innerText = `${j.nomeEmergencia} — ${j.contactoEmergencia}`;
      $('ppEmergenciaCall').href = `tel:${j.contactoEmergencia}`;
    } else {
      hide('ppEmergencySection');
    }
    if(r==='presidente') show('ppEditBtn');
  } else {
    hide('ppEmergencySection');
    hide('ppEditBtn');
  }
  openModal('modalPlayerProfile');
}

/* PRESENCAS ACTIONS */
function openModalPresencas(eventoId) {
  AppState.selectedEvent = eventoId;
  const ev = AppState.eventos.find(e=>e.id===eventoId);
  $('presencasDataLabel').innerText = formatDatePT(ev.data);
  
  let html = '';
  AppState.jogadores.filter(j=>j.ativo).forEach(j => {
    html += `
      <div class="checklist-row">
        <div class="d-flex align-center gap-3">
          <div class="avatar" style="width:36px;height:36px;font-size:14px;">${getInitials(j.nome)}</div>
          <div><div style="font-weight:600;font-size:14px;">${j.nome}</div></div>
        </div>
        <input type="checkbox" class="checkbox-huge presenca-chk" value="${j.id}" checked>
      </div>`;
  });
  $('presencasList').innerHTML = html;
  openModal('modalPresencas');
}
async function handleSavePresencas() {
  if (AppState.user.role !== 'treinador') {
    showToast('Só o treinador pode registar presenças na API.', 'error');
    return;
  }
  const presencas = {};
  Array.from(document.querySelectorAll('.presenca-chk')).forEach(c => {
    presencas[c.value] = { presente: c.checked, nota: '' };
  });
  const res = await apiCall('POST', `/eventos/treinos/${AppState.selectedEvent}/presencas`, presencas);
  if (!res) return;
  closeModal('modalPresencas');
  showToast('Presenças guardadas!');
}

/* CONVOCATORIA ACTIONS */
function openModalConvocatoria(jogoId) {
  const jogos = AppState.eventos.filter(e=>e.tipo==='Jogo' && e.data >= AppState.currentDate.toISOString().split('T')[0]);
  let opts = '';
  jogos.forEach(j => opts += `<option value="${j.id}" ${j.id===jogoId?'selected':''}>vs ${j.adversario} (${formatDatePT(j.data)})</option>`);
  $('convJogoSelect').innerHTML = opts;
  
  let html = '';
  AppState.jogadores.filter(j=>j.ativo).forEach(j => {
    html += `
      <div class="checklist-row">
        <div class="d-flex align-center gap-3">
          <div class="avatar" style="width:36px;height:36px;font-size:14px;">${getInitials(j.nome)}</div>
          <div style="font-weight:600;font-size:14px;">${j.nome}</div>
        </div>
        <input type="checkbox" class="checkbox-huge conv-chk" value="${j.id}">
      </div>`;
  });
  $('convJogadoresList').innerHTML = html;
  openModal('modalConvocatoria');
}
async function handleSaveConvocatoria() {
  if (AppState.user.role !== 'treinador') {
    showToast('Só o treinador pode gerir convocatórias na API.', 'error');
    return;
  }
  const jogoId = $('convJogoSelect').value;
  const ev = AppState.eventos.find(e=>e.id===jogoId);
  if (!ev) {
    showToast('Não há jogos futuros para convocar.', 'error');
    return;
  }
  const convs = Array.from(document.querySelectorAll('.conv-chk:checked')).map(c=>c.value);
  const res = await apiCall('POST', `/eventos/jogos/${jogoId}/convocatoria`, { jogadores: convs });
  if (!res) return;
  ev.convocados = convs;
  ev.respostas = {};
  closeModal('modalConvocatoria');
  renderJogos();
  showToast('Convocatória guardada!');
}

function openModalResposta(jogoId) {
  AppState.selectedEvent = jogoId;
  const ev = AppState.eventos.find(e=>e.id===jogoId);
  $('respJogoLabel').innerText = `vs ${ev.adversario}`;
  hide('divJustificacao');
  $('respJustificacao').value = '';
  openModal('modalRespostaConvocatoria');
}
function showJustificacao() {
  show('divJustificacao');
}
async function handleRespostaConv(resp) {
  const ev = AppState.eventos.find(e=>e.id===AppState.selectedEvent);
  const myJog = AppState.jogadores.find(x=>x.contacto === AppState.user.contacto);
  if (!myJog) {
    showToast('Não foi possível associar a tua conta a um jogador.', 'error');
    return;
  }
  const res = await apiCall('POST', `/eventos/jogos/${AppState.selectedEvent}/resposta`, { jogador_id: myJog.id, resposta: resp === 'vou' });
  if (!res) return;
  if(!ev.respostas) ev.respostas = {};
  ev.respostas[myJog.id] = resp;
  closeModal('modalRespostaConvocatoria');
  renderJogos();
  showToast('Resposta guardada! ✅');
}

/* RESULTADO ACTIONS */
function openModalResultado(jogoId) {
  AppState.selectedEvent = jogoId;
  const ev = AppState.eventos.find(e=>e.id===jogoId);
  $('resJogoLabel').innerText = `vs ${ev.adversario}`;
  $('resGolosMarcados').value = '';
  $('resGolosSofridos').value = '';
  $('resCronica').value = '';
  openModal('modalResultado');
}
async function handleSaveResultado(e) {
  e.preventDefault();
  const ev = AppState.eventos.find(x=>x.id===AppState.selectedEvent);
  ev.resultado = {
    golosMarcados: parseInt($('resGolosMarcados').value),
    golosSofridos: parseInt($('resGolosSofridos').value),
    cronica: $('resCronica').value
  };
  closeModal('modalResultado');
  renderJogos();
  showToast('Resultado registado!');
}

/* BOLEIAS ACTIONS */
function defaultRideDeparture(evento) {
  const base = new Date(combineDateTime(evento?.data || new Date().toISOString().slice(0, 10), evento?.hora || '12:00'));
  base.setHours(base.getHours() - 2);
  return base.toISOString();
}

// Devolve as viaturas que pertencem ao utilizador atual
function getMinhasViaturas() {
  const uid = AppState.user?.id || AppState.user?.contacto;
  return (AppState.viaturas || []).filter(v => {
    const propId = v.proprietario?.id ?? v.proprietario?.contacto ?? v.proprietario_id;
    return String(propId) === String(uid);
  });
}

function openModalBoleias(jogoId) {
  AppState.selectedEvent = jogoId;
  const ev = AppState.eventos.find(e=>e.id===jogoId) || eventForRide(AppState.boleias.find(b => b.jogoId === jogoId) || {});
  $('bolJogoLabel').innerText = `Boleias vs ${ev?.adversario || 'Jogo associado'}`;
  const ride = AppState.boleias.find(b => b.jogoId === jogoId);
  $('bolPartidaLabel').innerText = ride?.partida ? `Partida: ${formatDateTimePT(ride.partida)}` : 'Partida: Praça da Vila (estimativa - 2h antes)';

  // Preencher o seletor de viaturas do utilizador
  const minhasViaturas = getMinhasViaturas();
  const selectEl = $('bolViaturaSelect');
  const semViaturaMsg = $('bolSemViatura');
  const formOferecer = $('formOferecer');

  if (selectEl) {
    if (minhasViaturas.length === 0) {
      // Sem viaturas — esconder o form e mostrar aviso
      if (semViaturaMsg) show('bolSemViatura');
      selectEl.innerHTML = '';
      selectEl.parentElement.classList.add('hidden');
    } else {
      // Esconder aviso de sem viatura
      if (semViaturaMsg) hide('bolSemViatura');
      selectEl.parentElement.classList.remove('hidden');

      // Preencher opções
      selectEl.innerHTML = minhasViaturas.map(v =>
        `<option value="${v.id}">${v.modelo} — ${v.matricula} (${v.lugares_totais} lugares)</option>`
      ).join('');

      // Se só tem uma viatura, selecionar automaticamente e atualizar lugares máximos
      if (minhasViaturas.length === 1) {
        selectEl.value = minhasViaturas[0].id;
        atualizarMaxLugares(minhasViaturas[0]);
      }
    }
  }

  hide('formOferecer');
  renderBoleiasList();
  openModal('modalBoleia');
}

// Atualiza o max do input de vagas consoante a viatura selecionada
function atualizarMaxLugares(viatura) {
  const vagasEl = $('bolVagas');
  if (!vagasEl || !viatura) return;
  const max = Math.max(1, (viatura.lugares_totais || 5) - 1); // -1 para o condutor
  vagasEl.max = max;
  if (!vagasEl.value || parseInt(vagasEl.value) > max) vagasEl.value = max;
}

// Handler para quando o utilizador muda a viatura selecionada
window.handleBolViaturaChange = function() {
  const selectEl = $('bolViaturaSelect');
  if (!selectEl) return;
  const viatura = AppState.viaturas.find(v => v.id === selectEl.value);
  atualizarMaxLugares(viatura);
};
function renderBoleiasList() {
  const uid = AppState.user.id;
  const bs = AppState.boleias.filter(b => b.jogoId === AppState.selectedEvent);

  // O utilizador já está como passageiro nalguma boleia deste jogo?
  const jaTemReserva = bs.some(b =>
    b.condutorId !== uid && b.reservas.includes(uid)
  );
  // O utilizador já é condutor neste jogo?
  const jaECondutor = bs.some(b => b.condutorId === uid);

  // Bloquear o botão "Oferecer Boleia" se o utilizador já é condutor
  // ou se já tem um lugar reservado noutra boleia deste jogo
  const btnOferecer = $('btnOferecer');
  if (btnOferecer) {
    const bloqueado = jaTemReserva || jaECondutor;
    const motivo = jaECondutor
      ? 'Já ofereceste boleia para este jogo.'
      : 'Já tens um lugar reservado numa boleia para este jogo.';
    btnOferecer.disabled = bloqueado;
    btnOferecer.title = bloqueado ? motivo : '';
    btnOferecer.style.opacity = bloqueado ? '0.45' : '';
    btnOferecer.style.cursor = bloqueado ? 'not-allowed' : '';
  }

  const offeringRide = userIsOfferingRide(AppState.selectedEvent);

  let html = '';
  if(bs.length===0) {
    html = '<div class="text-center text-muted my-4 py-4">Nenhuma viatura disponível ainda.</div>';
  } else {
    bs.forEach(b => {
      const isReserved = b.reservas.includes(uid);
      let btnHtml = '';
      if(b.condutorId === uid) {
        btnHtml = `<span class="badge badge-primary" style="white-space:nowrap;">O teu carro</span>`;
      } else if(isReserved) {
        btnHtml = `<button class="btn btn-secondary" style="height:36px;font-size:12px;width:auto;" onclick="handleToggleReserva('${b.id}')">Cancelar Reserva</button>`;
      } else {
        const full = b.reservas.length >= b.lugaresDisponiveis;
        // Desabilitar "Reservar" se já tem reserva noutro carro
        btnHtml = `<button class="btn btn-primary" style="height:36px;font-size:12px;width:auto;"
          ${full || jaTemReserva || offeringRide? 'disabled' : ''}
          ${jaTemReserva && !full ? 'title="Já tens lugar reservado neste jogo."' : ''}
          onclick="handleToggleReserva('${b.id}')">
          ${full ? 'Lotado' : 'Reservar Lugar'}
        </button>`;
      }
      
      const vL = b.lugaresDisponiveis - b.reservas.length;
      const isOwner = b.condutorId === AppState.user.id;

      html += `
        <div class="card mb-3 p-3">
          <div class="d-flex align-center justify-between">
            <div class="d-flex align-center gap-3">
              <div class="avatar" style="width:40px;height:40px;">${getInitials(b.condutorNome)}</div>
              <div>
                <div style="font-weight:700;">${b.condutorNome}</div>
                <div class="text-muted" style="font-size:12px;">${b.viatura || 'Carro'} • <span style="color:var(--color-primary);font-weight:700;">${vL} vagas livres</span></div>
              </div>
            </div>
            ${btnHtml}
            
            ${
              jaECondutor && isOwner
                ? `
                  <button
                    class="btn btn-danger"
                    style="width:auto;min-height:40px;padding:0 12px;"
                    onclick="handleCancelarBoleia('${b.id}')"
                  >
                    Cancelar
                  </button>
                `
                : ''
            }      
          </div>
        </div>
      `;
    });
  }
  $('bolListContainer').innerHTML = html;
}
async function handleToggleReserva(bolId) {
  const b = AppState.boleias.find(x=>x.id===bolId);
  if (!b.reservas) b.reservas = [];
  const idx = b.reservas.indexOf(AppState.user.id);
  if(idx>=0) {
    b.reservas.splice(idx,1);
    showToast('Reserva cancelada.');
  } else {
    if(b.reservas.length < b.lugaresDisponiveis) {
      const res = await apiCall('POST', `/boleias/${bolId}/reservar`, { user_id: AppState.user.id });
      if (!res) return;
      b.reservas.push(AppState.user.id);
      showToast('Lugar reservado com sucesso!');
    }
  }
  renderBoleiasList();
  renderBoleias();
}
async function handleSaveBoleia(e) {
  e.preventDefault();
  const ev = AppState.eventos.find(x => x.id === AppState.selectedEvent);

  // Obter viatura pelo select (substituiu o campo de texto livre)
  const selectEl = $('bolViaturaSelect');
  const viaturaId = selectEl?.value;
  const viatura = AppState.viaturas.find(v => v.id === viaturaId);

  if (!viatura) {
    showToast('Regista uma viatura em teu nome antes de oferecer boleia.', 'error');
    return;
  }

  const body = {
    partida: defaultRideDeparture(ev),
    viatura_id: viatura.id,
    jogo_id: AppState.selectedEvent,
    max_lugares: parseInt($('bolVagas').value)
  };
  const res = await apiCall('POST', '/boleias', body);
  if (!res) return;
  AppState.boleias.push(normalizeBoleia({
    id: res?.id || 'b'+Date.now(),
    jogo_id: AppState.selectedEvent,
    condutorId: AppState.user.id,
    condutorNome: AppState.user.nome,
    viatura,
    max_lugares: parseInt($('bolVagas').value),
    lugares_vagos: parseInt($('bolVagas').value),
    reservas: []
  }));
  hide('formOferecer');
  renderBoleiasList();
  renderBoleias();
  showToast('Boleia oferecida!');
}

/* COMUNICADO DETAIL MODAL (REUSING HTML OR ALERT) */
function openModalComunicadoDetails(id) {
  const c = AppState.comunicados.find(x=>x.id===id);
  if(!c) return;
  $('comDetailCategoria').innerText = c.categoria;
  $('comDetailData').innerText = formatDatePT(c.data);
  $('comDetailTitulo').innerText = c.titulo;
  $('comDetailCorpo').innerText = c.corpo;
  openModal('modalComunicadoDetails');
}

async function handleCancelarBoleia(id) {
  const boleia = AppState.boleias.find(b => b.id === id);

  if (!boleia) {
    showToast('Boleia não encontrada.', 'error');
    return;
  }

  // Segurança extra
  if (boleia.condutorId !== AppState.user.id) {
    showToast('Só podes cancelar as tuas próprias boleias.', 'error');
    return;
  }

  const confirmDelete = confirm('Queres cancelar esta boleia?');
  if (!confirmDelete) return;

  const res = await apiCall('DELETE', `/boleias/${id}`);

  if (!res) return;

  AppState.boleias = AppState.boleias.filter(b => b.id !== id);

  saveState();

  if (AppState.currentView === 'boleias') {
    renderBoleias();
  }

  if (AppState.selectedEvent) {
    openModalBoleias(AppState.selectedEvent);
  }

  showToast('Boleia cancelada.');
}

function userIsOfferingRide(jogoId) {
  return AppState.boleias.some(
    b =>
      b.jogoId === jogoId &&
      b.condutorId === AppState.user.id
  );
}