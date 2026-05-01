/* STATE */
const AppState = {
  user: null,
  currentView: 'login',
  jogadores: [
    { id: '1', nome: 'Tiago Silva', posicao: 'Defesa Central', dataNascimento: '1995-05-12', assiduidade: 82, contacto: '910000002', ativo: true, nomeEmergencia: 'Mãe', contactoEmergencia: '910000003' },
    { id: '2', nome: 'Bruno Ferreira', posicao: 'Avançado', dataNascimento: '1998-02-22', assiduidade: 67, contacto: '910000004', ativo: true, nomeEmergencia: 'Pai', contactoEmergencia: '910000005' },
    { id: '3', nome: 'Carlos Mota', posicao: 'Médio', dataNascimento: '1990-11-05', assiduidade: 1, contacto: '910000005', ativo: true, nomeEmergencia: 'Esposa', contactoEmergencia: '910000006' },
    { id: '4', nome: 'André Costa', posicao: 'Guarda-Redes', dataNascimento: '2000-01-15', assiduidade: 75, contacto: '910000006', ativo: true, nomeEmergencia: 'Mãe', contactoEmergencia: '910000007' },
    { id: '5', nome: 'Rui Pinto', posicao: 'Defesa Lateral', dataNascimento: '1996-08-30', assiduidade: 88, contacto: '910000007', ativo: true, nomeEmergencia: 'Irmão', contactoEmergencia: '910000008' },
    { id: '6', nome: 'Pedro Nunes', posicao: 'Extremo', dataNascimento: '1999-04-10', assiduidade: 40, contacto: '910000008', ativo: true, nomeEmergencia: 'Pai', contactoEmergencia: '910000009' }
  ],
  eventos: [
    { id: 'e1', tipo: 'Treino', data: '2026-04-17', hora: '20:00', local: 'Campo Principal', status: 'ativo' },
    { id: 'e2', tipo: 'Jogo', data: '2026-04-20', hora: '15:00', local: 'Fora', adversario: 'GD Fundão', status: 'ativo', convocados: ['1', '2', '4', '5'], respostas: { '1': 'vou', '2':'naovou' } },
    { id: 'e3', tipo: 'Jogo', data: '2026-04-28', hora: '15:00', local: 'Estádio Municipal do Tortosendo', adversario: 'CF Tortosendo', status: 'ativo', convocados: ['1','2','3','4','5','6'], respostas: {} },
    { id: 'e4', tipo: 'Jogo', data: '2026-04-13', hora: '15:00', local: 'Campo Principal', adversario: 'SC Covilhã B', status: 'ativo', resultado: { golosMarcados: 3, golosSofridos: 1, cronica: 'Grande jogo de toda a equipa!' } },
    { id: 'e5', tipo: 'Treino', data: '2026-04-10', hora: '19:30', local: 'Campo Principal', status: 'cancelado' }
  ],
  comunicados: [
    { id: 'c1', categoria: 'Direção', data: '2026-04-11', titulo: 'Inscrições na Associação – Prazo!', corpo: 'Atenção a todos os jogadores: o prazo para renovar a inscrição na Associação de Futebol é dia 30 de Abril. Que ninguem se atrase.' },
    { id: 'c2', categoria: 'Equipa Técnica', data: '2026-04-11', titulo: 'Treino de Quarta Alterado', corpo: 'O treino de quarta-feira 17 Abr foi alterado de 18:30 para as 20:00, por indisponibilidade do campo. Peço desculpa pelo transtorno.' },
    { id: 'c3', categoria: 'Direção', data: '2026-04-13', titulo: 'Parabéns pela Vitória!', corpo: '1-1 ao SC Covilhã B! Que orgulho desta equipa. Convido todos para o cozido de domingo na sede.' }
  ],
  boleias: [
    { id: 'b1', jogoId: 'e3', condutorId: 'u3', condutorNome: 'Tiago Silva', viatura: 'Clio Azul', lugaresDisponiveis: 2, reservas: [] }
  ],
  users: [
    { id: 'u1', nome: 'Quim Barrela', contacto: '910000001', password: 'quim123', role: 'presidente', token: 'tok_1' },
    { id: 'u2', nome: 'Mister Zé', contacto: '910000010', password: 'mister123', role: 'treinador', token: 'tok_2' },
    { id: 'u3', nome: 'Tiago Silva', contacto: '910000002', password: 'tiago123', role: 'jogador', token: 'tok_3' }
  ],
  currentDate: new Date(2026, 3, 1), // April 2026
  activeModal: null,
  selectedEvent: null
};

/* UTILS */
function $(id) { return document.getElementById(id); }
function show(id) { $(id).classList.remove('hidden'); }
function hide(id) { $(id).classList.add('hidden'); }
function showToast(msg, type='success') {
  const c = $('toastContainer');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = type === 'success' ? `✅ ${msg}` : `❌ ${msg}`;
  c.appendChild(t);
  setTimeout(() => { t.style.opacity=0; setTimeout(()=>t.remove(),300); }, 3000);
}
function formatDatePT(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-PT', { day:'2-digit', month:'2-digit', year:'numeric' });
}
function getInitials(name) {
  return name.split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase();
}
function toggleTheme() {
  const t = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', t);
}
async function fakeNetworkDelay() {
  return new Promise(r => setTimeout(r, 400 + Math.random()*400));
}

/* API CALL */
async function apiCall(method, endpoint, body) {
  try {
    const res = await fetch(`https://api.osbeiroes.cc${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(AppState.user?.token && { 'Authorization': `Bearer ${AppState.user.token}` })
      },
      body: body ? JSON.stringify(body) : null
    });
    if (res.status === 403) { showToast('Não tens permissão para esta ação.', 'error'); throw new Error('403'); }
    if (res.status === 400) { const e = await res.json(); showToast(e.message || 'Dados inválidos.', 'error'); throw new Error('400'); }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const text = await res.text();
    try {
      return text ? JSON.parse(text) : true;
    } catch(e) {
      return text;
    }
  } catch (err) {
    console.warn(`API falhou (${endpoint}), a usar fallback local.`);
    return null;
  }
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
    let u = AppState.users.find(x => x.contacto === c);
    if (!u) u = { id: 'u0', nome: 'Utilizador', contacto: c, role: 'jogador' };
    u.token = typeof res === 'string' ? res : (res.token || 'tok_1');
    AppState.user = u;
    navigate('home');
    showToast('Sessão iniciada com sucesso.');
  } else {
    // Fallback Mock
    const u = AppState.users.find(x => x.contacto === c && x.password === p);
    if(u) {
      AppState.user = u;
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
  const res = await apiCall('POST', '/auth/register', body);
  
  $('fullLoader').classList.add('hidden');
  
  const newUser = {
    id: 'u' + Date.now(),
    nome: body.nome,
    contacto: body.contacto,
    role: body.role,
    token: res ? (typeof res === 'string' ? res : res.token) : 'tok_new'
  };
  AppState.users.push(newUser);
  AppState.user = newUser;
  navigate('home');
  showToast(res ? 'Conta criada com sucesso.' : 'Conta criada (Modo Offline).');
}
function handleLogout() {
  AppState.user = null;
  navigate('login');
}

/* NAVIGATION & RENDERING */

// Load modals once
let modalsLoaded = false;
async function loadModals() {
  if (modalsLoaded) return;
  try {
    const res = await fetch('views/modals.html');
    const html = await res.text();
    $('modalsContainer').innerHTML = html;
    modalsLoaded = true;
  } catch(e) { console.error('Erro ao carregar modals', e); }
}


// Load state from local storage on init if present
const saved = localStorage.getItem('osbeiroes_state');
if (saved) {
    Object.assign(AppState, JSON.parse(saved));
}

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

async function loadModals() {}

// Wrap renderViews to ensure state runs 
const _origRenderView = renderView;
window.renderView = function(view) {
  saveState();
  try {
    _origRenderView(view);
  } catch(e) { console.warn("View render ignored because element not found (Astro handled it).") }
};


// Auto Login handler
async function handleAutoLogin() {
  $('loginContacto').value = '910000001'; // Default to Presidente Quim
  $('loginPassword').value = 'quim123';
  await handleLogin(new Event('submit'));
}


function renderView(view) {
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
  const todayStr = AppState.currentDate.toISOString().split('T')[0];
  // Fake today's date for demo
  const mockToday = '2026-04-20'; 
  const eventosHoje = AppState.eventos.filter(e => e.data === mockToday && e.status==='ativo');
  
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
    const badge = c.categoria==='Direção' ? 'badge-red' : 'badge-green';
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
function changeMonth(dir) {
  calMonthOffset += dir;
  renderCalendar();
}
function renderCalendar() {
  const date = new Date(2026, 3 + calMonthOffset, 1);
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
    
    const isToday = (fullDate === '2026-04-20') ? 'today' : '';
    grid += `<div class="calendar-day ${isToday}" onclick="selectDate('${fullDate}', this)">${i}<div class="calendar-dots">${dots}</div></div>`;
  }
  $('calendarGrid').innerHTML = grid;
  
  const r = AppState.user.role;
  if(r==='presidente'||r==='treinador') show('btnNovoEvento'); else hide('btnNovoEvento');
  
  // Select today or first day
  selectDate('2026-04-20', null); 
}

function selectDate(dateStr, el) {
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
      
      // Determine actions based on role
      let clickAction = '';
      const r = AppState.user.role;
      if(!isCanc) {
        if(r==='presidente'||r==='treinador') {
          if(e.tipo==='Treino') clickAction = `onclick="openModalPresencas('${e.id}')"`;
          if(e.tipo==='Jogo') clickAction = `onclick="navigate('jogos')"`;
        }
      }
      
      html += `
        <div class="card ${isCanc?'':'card-accent-'+(e.tipo==='Jogo'?'red':'green')}" ${clickAction} style="${clickAction?'cursor:pointer;':''} opacity:${isCanc?0.5:1}">
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
function setEventoTipo(tipo) {
  $('evTipo').value = tipo;
  $('btnTipoTreino').className = tipo==='Treino' ? 'btn btn-primary' : 'btn btn-secondary';
  $('btnTipoJogo').className = tipo==='Jogo' ? 'btn btn-primary' : 'btn btn-secondary';
  if(tipo==='Jogo') show('fgAdversario'); else hide('fgAdversario');
}
async function handleSaveEvento(e) {
  e.preventDefault();
  const id = $('evId').value || 'e'+Date.now();
  const body = {
    tipo: $('evTipo').value,
    data: $('evData').value,
    hora: $('evHora').value,
    local: $('evLocal').value,
    status: $('evStatus').value,
    adversario: $('evTipo').value==='Jogo' ? $('evAdversario').value : undefined
  };
  const isEdit = !!$('evId').value;
  const endpoint = isEdit ? `/api/eventos/${$('evId').value}` : '/api/eventos';
  const method = isEdit ? 'PUT' : 'POST';
  await apiCall(method, endpoint, body);
  
  const ev = {
    id,
    tipo: $('evTipo').value,
    data: $('evData').value,
    hora: $('evHora').value,
    local: $('evLocal').value,
    status: $('evStatus').value,
    adversario: $('evTipo').value==='Jogo' ? $('evAdversario').value : undefined
  };
  const idx = AppState.eventos.findIndex(x=>x.id===id);
  if(idx>=0) AppState.eventos[idx] = ev;
  else AppState.eventos.push(ev);
  
  closeModal('modalEvento');
  renderCalendar();
  showToast('Evento guardado!');
}

/* JOGOS */
function switchJogosTab(tab) {
  if(tab==='convocatorias') {
    $('tabConvocatorias').classList.add('active'); $('tabResultados').classList.remove('active');
    show('jogosConvocatoriasContainer'); hide('jogosResultadosContainer');
    const r = AppState.user.role;
    if(r==='presidente'||r==='treinador') show('btnNovaConvocatoria'); else hide('btnNovaConvocatoria');
  } else {
    $('tabConvocatorias').classList.remove('active'); $('tabResultados').classList.add('active');
    hide('jogosConvocatoriasContainer'); show('jogosResultadosContainer');
    hide('btnNovaConvocatoria');
  }
}
function renderJogos() {
  switchJogosTab('convocatorias');
  
  const jogos = AppState.eventos.filter(e=>e.tipo==='Jogo').sort((a,b)=>a.data.localeCompare(b.data));
  const today = '2026-04-20';
  
  const upcoming = jogos.filter(j => j.data >= today);
  const past = jogos.filter(j => j.data < today);
  
  // Convocatórias
  let cHtml = '';
  if(upcoming.length===0) cHtml = '<div class="empty-state"><div class="empty-icon">⚽</div><p>Sem jogos futuros.</p></div>';
  upcoming.forEach(j => {
    let convStatus = '';
    let btnHtml = '';
    const r = AppState.user.role;
    
    if(!j.convocados || j.convocados.length===0) {
      convStatus = '<span class="badge badge-gray">Aguardar Convocatória</span>';
      if(r==='treinador'||r==='presidente') btnHtml = `<button class="btn btn-secondary mt-2" style="height:36px;font-size:14px;" onclick="openModalConvocatoria('${j.id}')">Criar Convocatória</button>`;
    } else {
      const confs = Object.values(j.respostas||{}).filter(v=>v==='vou').length;
      convStatus = `<span class="badge badge-green">${confs} Confirmados</span> <span class="badge badge-gray ml-2">${j.convocados.length} Convocados</span>`;
      
      if(r==='jogador') {
        // Find player ID for this user (mock match by name/phone in real app)
        const myJog = AppState.jogadores.find(x=>x.contacto === AppState.user.contacto);
        if(myJog && j.convocados.includes(myJog.id)) {
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
      } else {
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
function renderBoleias() {
  const today = '2026-04-20';
  const jogosFora = AppState.eventos.filter(e => e.tipo==='Jogo' && e.local.toLowerCase() !== 'campo principal' && e.data >= today);
  
  let html = '';
  if(jogosFora.length === 0) {
    html = '<div class="empty-state"><div class="empty-icon">🚗</div><p>Não há jogos fora agendados.</p></div>';
  } else {
    jogosFora.forEach(j => {
      const bs = AppState.boleias.filter(b => b.jogoId === j.id);
      let avatHtml = '';
      let vagasTotais = 0;
      bs.forEach(b => {
        avatHtml += `<div class="avatar" style="width:32px;height:32px;font-size:12px;border:2px solid #fff;margin-left:-8px;">${getInitials(b.condutorNome)}</div>`;
        vagasTotais += b.lugaresDisponiveis;
      });
      if(bs.length>0) avatHtml = `<div class="d-flex" style="padding-left:8px;">${avatHtml}</div>`;
      
      html += `
        <div class="card card-accent-red" style="cursor:pointer;" onclick="openModalBoleias('${j.id}')">
          <div class="d-flex justify-between mb-2">
            <div style="font-weight:700;">vs ${j.adversario}</div>
            <div class="text-muted" style="font-size:14px;">${formatDatePT(j.data)}</div>
          </div>
          <div class="text-muted mb-3" style="font-size:14px;">📍 ${j.local}</div>
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
function renderPlantel() {
  const search = $('searchJogador').value.toLowerCase();
  let list = AppState.jogadores;
  if(search) list = list.filter(j => j.nome.toLowerCase().includes(search));
  
  let html = '';
  list.forEach(j => {
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
  $('plantelContainer').innerHTML = html;
}

/* COMUNICADOS */
function renderComunicadosList() {
  const r = AppState.user.role;
  if(r==='presidente'||r==='treinador') show('btnNovoComunicado2'); else hide('btnNovoComunicado2');
  
  let html = '';
  AppState.comunicados.slice().reverse().forEach(c => {
    const badge = c.categoria==='Direção' ? 'badge-red' : 'badge-green';
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
  show(id);
  // Reset forms on open
  if(id==='modalEvento') { $('evId').value=''; $('evData').value=''; $('evHora').value=''; $('evLocal').value=''; $('evAdversario').value=''; setEventoTipo('Treino'); }
  if(id==='modalComunicado') { $('comTitulo').value=''; $('comCorpo').value=''; }
  if(id==='modalJogador') { $('jogId').value=''; $('jogNome').value=''; $('jogNascimento').value=''; $('jogContacto').value=''; $('jogNomeEmergencia').value=''; $('jogContactoEmergencia').value=''; hide('btnInativarJog'); }
}
function closeModal(id) {
  hide(id);
  AppState.activeModal = null;
}

/* COMUNICADO ACTIONS */
async function handleSaveComunicado(e) {
  e.preventDefault();
  const body = {
    categoria: $('comCategoria').value,
    titulo: $('comTitulo').value,
    corpo: $('comCorpo').value
  };
  await apiCall('POST', '/api/comunicados', body);

  AppState.comunicados.push({
    id: 'c'+Date.now(),
    categoria: $('comCategoria').value,
    titulo: $('comTitulo').value,
    corpo: $('comCorpo').value,
    data: AppState.currentDate.toISOString().split('T')[0]
  });
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
    nome: $('jogNome').value,
    dataNascimento: $('jogNascimento').value,
    posicao: $('jogPosicao').value,
    contacto: $('jogContacto').value,
    nomeEmergencia: $('jogNomeEmergencia').value,
    contactoEmergencia: $('jogContactoEmergencia').value
  };
  const isEdit = !!$('jogId').value;
  const endpoint = isEdit ? `/api/jogadores/jogador/${$('jogId').value}` : '/api/jogadores/jogador';
  const method = isEdit ? 'PUT' : 'POST';
  await apiCall(method, endpoint, body);
  
  const j = {
    id,
    nome: $('jogNome').value,
    dataNascimento: $('jogNascimento').value,
    posicao: $('jogPosicao').value,
    contacto: $('jogContacto').value,
    nomeEmergencia: $('jogNomeEmergencia').value,
    contactoEmergencia: $('jogContactoEmergencia').value,
    ativo: true,
    assiduidade: id.startsWith('j') ? 0 : AppState.jogadores.find(x=>x.id===id).assiduidade
  };
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
    await apiCall('DELETE', `/api/jogadores/jogador/${id}`);
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
  $('modalJogadorTitle').innerText = "Editar Jogador";
  $('jogId').value = j.id;
  $('jogNome').value = j.nome;
  $('jogNascimento').value = j.dataNascimento;
  $('jogPosicao').value = j.posicao;
  $('jogContacto').value = j.contacto;
  $('jogNomeEmergencia').value = j.nomeEmergencia || '';
  $('jogContactoEmergencia').value = j.contactoEmergencia || '';
  show('btnInativarJog');
  openModal('modalJogador');
}

function openModalPlayerProfile(id) {
  AppState.selectedPlayerId = id;
  const j = AppState.jogadores.find(x=>x.id===id);
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
  const presencas = Array.from(document.querySelectorAll('.presenca-chk')).map(c => ({ jogadorId: c.value, presente: c.checked }));
  await apiCall('POST', `/api/eventos/treinos/${AppState.selectedEvent}/presencas`, { presencas });
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
  const jogoId = $('convJogoSelect').value;
  const ev = AppState.eventos.find(e=>e.id===jogoId);
  const convs = Array.from(document.querySelectorAll('.conv-chk:checked')).map(c=>c.value);
  await apiCall('POST', `/api/eventos/jogos/${jogoId}/convocatoria`, { jogadores: convs });
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
  await apiCall('POST', `/api/eventos/jogos/${AppState.selectedEvent}/resposta`, { resposta: resp, nota: $('respJustificacao').value });
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
  await apiCall('PUT', `/api/eventos/jogos/${AppState.selectedEvent}/resultado`, { golosMarcados: parseInt($('resGolosMarcados').value), golosSofridos: parseInt($('resGolosSofridos').value), cronica: $('resCronica').value });
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
function openModalBoleias(jogoId) {
  AppState.selectedEvent = jogoId;
  const ev = AppState.eventos.find(e=>e.id===jogoId);
  $('bolJogoLabel').innerText = `Boleias vs ${ev.adversario}`;
  $('bolPartidaLabel').innerText = `Partida: Praça da Vila (estimativa - 2h antes)`;
  hide('formOferecer');
  
  renderBoleiasList();
  openModal('modalBoleia');
}
function renderBoleiasList() {
  const bs = AppState.boleias.filter(b => b.jogoId === AppState.selectedEvent);
  let html = '';
  if(bs.length===0) {
    html = '<div class="text-center text-muted my-4 py-4">Nenhuma viatura disponível ainda.</div>';
  } else {
    bs.forEach(b => {
      const isReserved = b.reservas.includes(AppState.user.id);
      let btnHtml = '';
      if(b.condutorId === AppState.user.id) {
        btnHtml = `<span class="badge badge-primary">O teu carro</span>`;
      } else if(isReserved) {
        btnHtml = `<button class="btn btn-secondary" style="height:36px;font-size:12px;width:auto;" onclick="handleToggleReserva('${b.id}')">Cancelar Reserva</button>`;
      } else {
        const full = b.reservas.length >= b.lugaresDisponiveis;
        btnHtml = `<button class="btn btn-primary" style="height:36px;font-size:12px;width:auto;" ${full?'disabled':''} onclick="handleToggleReserva('${b.id}')">${full?'Lotado':'Reservar Lugar'}</button>`;
      }
      
      const vL = b.lugaresDisponiveis - b.reservas.length;
      
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
          </div>
        </div>
      `;
    });
  }
  $('bolListContainer').innerHTML = html;
}
async function handleToggleReserva(bolId) {
  const b = AppState.boleias.find(x=>x.id===bolId);
  const idx = b.reservas.indexOf(AppState.user.id);
  if(idx>=0) {
    await apiCall('DELETE', `/api/boleias/${bolId}/reserva`);
    b.reservas.splice(idx,1);
    showToast('Reserva cancelada.');
  } else {
    if(b.reservas.length < b.lugaresDisponiveis) {
      await apiCall('POST', `/api/boleias/${bolId}/reservar`);
      b.reservas.push(AppState.user.id);
      showToast('Lugar reservado com sucesso!');
    }
  }
  renderBoleiasList();
  renderBoleias();
}
async function handleSaveBoleia(e) {
  e.preventDefault();
  await apiCall('POST', '/api/boleias', { jogoId: AppState.selectedEvent, viatura: $('bolViatura').value, lugaresDisponiveis: parseInt($('bolVagas').value) });
  AppState.boleias.push({
    id: 'b'+Date.now(),
    jogoId: AppState.selectedEvent,
    condutorId: AppState.user.id,
    condutorNome: AppState.user.nome,
    viatura: $('bolViatura').value,
    lugaresDisponiveis: parseInt($('bolVagas').value),
    reservas: []
  });
  hide('formOferecer');
  renderBoleiasList();
  renderBoleias();
  showToast('Boleia oferecida!');
}

/* COMUNICADO DETAIL MODAL (REUSING HTML OR ALERT) */
function openModalComunicadoDetails(id) {
  const c = AppState.comunicados.find(x=>x.id===id);
  alert(`COMUNICADO\n${c.titulo}\nData: ${formatDatePT(c.data)}\n\n${c.corpo}`);
  // In a full app, this would be a proper modal/view.
}
