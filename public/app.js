// =================== STATE ===================
let currentUser = null;
let currentPage = 'home';
let friendsPanelOpen = false;
let chatWith = null;
let chatMessages = [];

// =================== INIT ===================
document.getElementById('year').textContent = new Date().getFullYear();

async function init() {
  // Apply saved theme
  const savedTheme = localStorage.getItem('epicmoments-theme');
  if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);
  try {
    const res = await fetch('/api/me');
    const data = await res.json();
    if (data.user) currentUser = data.user;
  } catch(e) {}
  renderSidebar();
  renderMobileUser();
  renderFriendsFab();
  navigateTo('home');
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('epicmoments-theme', next);
  renderSidebar();
}

// =================== NAVIGATION ===================
const navItems = [
  { id: 'home', label: 'Início', icon: '🏠' },
  { id: 'jogos', label: 'Jogos', icon: '🎮' },
  { id: 'achievements', label: 'Achievements', icon: '🏆' },
  { id: 'ranking', label: 'Ranking', icon: '👑' },
  { id: 'guilds', label: 'Comunidades', icon: '🗣️' },
  { id: 'enquetes', label: 'Enquetes', icon: '📊' },
  { id: 'torneios', label: 'Torneios', icon: '🏟️' },
  { id: 'sobre', label: 'Sobre', icon: 'ℹ️' },
];

function navigateTo(page, data) {
  currentPage = page;
  window._pageData = data || null;
  renderSidebar();
  renderPage();
  closeMobileSidebar();
}

function renderSidebar() {
  const nav = document.getElementById('sidebar-nav');
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  let html = '';
  // Theme toggle at top
  html += `<button class="theme-toggle" onclick="toggleTheme()">${isLight ? '🌙' : '☀️'} ${isLight ? 'Tema Escuro' : 'Tema Claro'}</button>`;
  navItems.forEach(item => {
    html += `<button class="${currentPage === item.id ? 'active' : ''}" onclick="navigateTo('${item.id}')">${item.icon} ${item.label}</button>`;
  });
  if (currentUser && currentUser.tipo === 'administrador') {
    html += `<button class="${currentPage === 'admin' ? 'active' : ''}" onclick="navigateTo('admin')">🛡️ Admin</button>`;
  }
  nav.innerHTML = html;

  const userEl = document.getElementById('sidebar-user');
  if (currentUser) {
    userEl.innerHTML = `
      <button class="sidebar-user-profile ${currentPage === 'perfil' ? 'active' : ''}" onclick="navigateTo('perfil')">
        👤 <div class="sidebar-user-info"><div class="font-bold truncate">${esc(currentUser.nickname)}</div><div class="text-xs text-muted">${currentUser.pontos_usuario} pts</div></div>
      </button>
      <button class="sidebar-user-logout" onclick="logout()">🚪 Sair</button>
    `;
  } else {
    userEl.innerHTML = `<button class="btn btn-gold w-full" onclick="showAuthModal()">Entrar / Cadastrar</button>`;
  }
}

function renderMobileUser() {
  const el = document.getElementById('mobile-user-btn');
  if (currentUser) {
    el.innerHTML = `<button onclick="navigateTo('perfil')" style="background:none;border:none;color:var(--primary);font-size:12px;font-weight:600;cursor:pointer;">${esc(currentUser.nickname)}</button>`;
  } else {
    el.innerHTML = `<button class="btn btn-gold btn-sm" onclick="showAuthModal()">Entrar</button>`;
  }
}

function toggleMobileSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('mobile-overlay').classList.toggle('show');
}
function closeMobileSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('mobile-overlay').classList.remove('show');
}

// =================== RENDERING ===================
function renderPage() {
  const el = document.getElementById('page-content');
  el.innerHTML = '<div class="text-center p-6 text-muted">Carregando...</div>';
  switch(currentPage) {
    case 'home': renderHome(el); break;
    case 'jogos': renderJogos(el); break;
    case 'jogoDetail': renderJogoDetail(el); break;
    case 'achievements': renderAchievements(el); break;
    case 'ranking': renderRanking(el); break;
    case 'guilds': renderGuilds(el); break;
    case 'comunidadeDetail': renderComunidadeDetail(el); break;
    case 'enquetes': renderEnquetes(el); break;
    case 'torneios': renderTorneios(el); break;
    case 'torneioDetail': renderTorneioDetail(el); break;
    case 'sobre': renderSobre(el); break;
    case 'perfil': renderPerfil(el); break;
    case 'admin': renderAdmin(el); break;
    case 'userProfile': renderUserProfile(el); break;
    case 'achievementRanking': renderAchievementRanking(el); break;
    default: renderHome(el);
  }
  el.scrollTop = 0;
  window.scrollTo(0, 0);
}

// =================== AUTH ===================
function showAuthModal() {
  const modal = document.getElementById('auth-modal');
  modal.classList.remove('hidden');
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeAuthModal()">
      <div class="modal" onclick="event.stopPropagation()">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-orbitron font-bold" style="font-size:18px;">Epic Moments</h2>
          <button onclick="closeAuthModal()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:20px;">✕</button>
        </div>
        <div class="tabs" style="width:100%;">
          <button class="tab active" id="tab-login" onclick="switchAuthTab('login')" style="flex:1;">Login</button>
          <button class="tab" id="tab-register" onclick="switchAuthTab('register')" style="flex:1;">Cadastro</button>
        </div>
        <div id="auth-alert"></div>
        <div id="auth-form-login">
          <div class="mb-3"><label class="label">E-mail</label><input class="input" type="email" id="login-email" placeholder="seu@email.com" onkeydown="if(event.key==='Enter')doLogin()"></div>
          <div class="mb-4"><label class="label">Senha</label><input class="input" type="password" id="login-senha" onkeydown="if(event.key==='Enter')doLogin()"></div>
          <button class="btn btn-primary w-full" onclick="doLogin()">Entrar</button>
          <p class="text-xs text-muted mt-3 text-center">Demo: admin@epicmoments.com / Admin1</p>
        </div>
        <div id="auth-form-register" class="hidden">
          <div class="mb-3"><label class="label">Nome Completo *</label><input class="input" type="text" id="reg-nome"></div>
          <div class="mb-3"><label class="label">Nickname *</label><input class="input" type="text" id="reg-nick" maxlength="25"></div>
          <div class="mb-3"><label class="label">E-mail *</label><input class="input" type="email" id="reg-email"></div>
          <div class="mb-3"><label class="label">CPF (apenas números)</label><input class="input" type="text" id="reg-cpf" maxlength="11"></div>
          <div class="mb-3"><label class="label">Data Nascimento</label><input class="input" type="date" id="reg-nasc"></div>
          <div class="mb-3"><label class="label">Gênero</label><select class="input" id="reg-genero"><option value="M">Masculino</option><option value="F">Feminino</option></select></div>
          <div class="mb-4"><label class="label">Senha * (mín. 4 chars, 1 maiúscula)</label><input class="input" type="password" id="reg-senha" minlength="4"></div>
          <div class="mb-4 flex items-center gap-2">
            <input type="checkbox" id="reg-termos" style="width:16px;height:16px;cursor:pointer;">
            <label for="reg-termos" class="text-xs text-muted cursor-pointer">Li e aceito o <a href="#" onclick="event.preventDefault();showTermsModal();" class="text-primary font-bold" style="text-decoration:none;">Código de Conduta</a> *</label>
          </div>
          <button class="btn btn-gold w-full" onclick="doRegister()">Criar Conta</button>
        </div>
      </div>
    </div>
  `;
}

function closeAuthModal() { document.getElementById('auth-modal').classList.add('hidden'); }

function switchAuthTab(tab) {
  document.getElementById('auth-alert').innerHTML = '';
  if (tab === 'login') {
    document.getElementById('tab-login').classList.add('active');
    document.getElementById('tab-register').classList.remove('active');
    document.getElementById('auth-form-login').classList.remove('hidden');
    document.getElementById('auth-form-register').classList.add('hidden');
  } else {
    document.getElementById('tab-login').classList.remove('active');
    document.getElementById('tab-register').classList.add('active');
    document.getElementById('auth-form-login').classList.add('hidden');
    document.getElementById('auth-form-register').classList.remove('hidden');
  }
}

async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const senha = document.getElementById('login-senha').value;
  if (!email || !senha) { document.getElementById('auth-alert').innerHTML = '<div class="alert alert-error">Preencha e-mail e senha</div>'; return; }
  try {
    const res = await fetch('/api/login', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({email, senha}) });
    const data = await res.json();
    if (data.error === 'email_not_found') {
      document.getElementById('auth-alert').innerHTML = `<div class="alert alert-error">${esc(data.message)} <a href="#" onclick="event.preventDefault();switchAuthTab('register');document.getElementById('reg-email').value='${esc(email)}';" class="text-primary font-bold" style="text-decoration:none;">Criar conta</a></div>`;
      return;
    }
    if (data.error === 'wrong_password') {
      document.getElementById('auth-alert').innerHTML = `<div class="alert alert-error">${esc(data.message)}</div>`;
      return;
    }
    if (data.error) {
      document.getElementById('auth-alert').innerHTML = `<div class="alert alert-error">${esc(data.message || data.error)}</div>`;
      return;
    }
    currentUser = data.user;
    closeAuthModal();
    renderSidebar();
    renderMobileUser();
    renderFriendsFab();
    navigateTo('home');
  } catch(e) { document.getElementById('auth-alert').innerHTML = `<div class="alert alert-error">Erro de conexão com o servidor</div>`; }
}

async function doRegister() {
  const termos = document.getElementById('reg-termos').checked;
  if (!termos) { document.getElementById('auth-alert').innerHTML = '<div class="alert alert-error">Você deve aceitar o Código de Conduta</div>'; return; }
  const nome = document.getElementById('reg-nome').value.trim();
  const nickname = document.getElementById('reg-nick').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const senha = document.getElementById('reg-senha').value;
  if (!nome || !nickname || !email || !senha) { document.getElementById('auth-alert').innerHTML = '<div class="alert alert-error">Preencha todos os campos obrigatórios</div>'; return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { document.getElementById('auth-alert').innerHTML = '<div class="alert alert-error">E-mail inválido</div>'; return; }
  if (nickname.length < 3) { document.getElementById('auth-alert').innerHTML = '<div class="alert alert-error">Nickname deve ter no mínimo 3 caracteres</div>'; return; }
  const body = {
    nome: document.getElementById('reg-nome').value,
    nickname: document.getElementById('reg-nick').value,
    email: document.getElementById('reg-email').value,
    cpf: document.getElementById('reg-cpf').value,
    dataNascimento: document.getElementById('reg-nasc').value || null,
    genero: document.getElementById('reg-genero').value,
    senha: document.getElementById('reg-senha').value,
    aceitouTermos: true,
  };
  try {
    const res = await fetch('/api/register', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
    const data = await res.json();
    if (data.error) { document.getElementById('auth-alert').innerHTML = `<div class="alert alert-error">${esc(data.error)}</div>`; return; }
    currentUser = data.user;
    document.getElementById('auth-alert').innerHTML = `<div class="alert alert-success">Conta criada com sucesso!</div>`;
    setTimeout(() => { closeAuthModal(); renderSidebar(); renderMobileUser(); renderFriendsFab(); navigateTo('home'); }, 1000);
  } catch(e) { document.getElementById('auth-alert').innerHTML = `<div class="alert alert-error">Erro de conexão com o servidor</div>`; }
}

async function logout() {
  await fetch('/api/logout', { method: 'POST' });
  currentUser = null;
  renderSidebar();
  renderMobileUser();
  renderFriendsFab();
  navigateTo('home');
}

// =================== TERMS MODAL ===================
function showTermsModal() {
  const modal = document.getElementById('terms-modal');
  modal.classList.remove('hidden');
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeTermsModal()">
      <div class="modal modal-lg" onclick="event.stopPropagation()">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-orbitron font-bold">📜 Código de Conduta</h3>
          <button onclick="closeTermsModal()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:20px;">✕</button>
        </div>
        <div class="text-sm" style="line-height:1.8;color:var(--text-muted);">
          ${renderCodigoConduta()}
        </div>
        <button class="btn btn-primary mt-4" onclick="closeTermsModal()">Fechar</button>
      </div>
    </div>
  `;
}
function closeTermsModal() { document.getElementById('terms-modal').classList.add('hidden'); }

function renderCodigoConduta() {
  return `
    <h2 class="font-orbitron font-bold mb-2" style="font-size:18px;color:var(--text);">Código de Conduta - Epic Moments</h2>
    <h3 class="font-orbitron font-bold mt-3 mb-2" style="font-size:14px;color:var(--text);">1. Respeito Mútuo</h3>
    <p>Trate todos os membros da comunidade com respeito. Insultos, assédio, discriminação e qualquer forma de toxicidade não serão tolerados.</p>
    <h3 class="font-orbitron font-bold mt-3 mb-2" style="font-size:14px;color:var(--text);">2. Fair Play</h3>
    <p>• Não utilize cheats, hacks, exploits ou qualquer software que dê vantagem injusta.<br>• Vídeos de comprovação devem ser de sua própria autoria.<br>• Não tente manipular votações de enquetes com contas falsas.</p>
    <h3 class="font-orbitron font-bold mt-3 mb-2" style="font-size:14px;color:var(--text);">3. Conteúdo Apropriado</h3>
    <p>• Não publique conteúdo ofensivo, pornográfico, violento ou ilegal.<br>• Vídeos de comprovação devem focar no áudio do jogo.</p>
    <h3 class="font-orbitron font-bold mt-3 mb-2" style="font-size:14px;color:var(--text);">4. Privacidade</h3>
    <p>• Não compartilhe dados pessoais de outros usuários.<br>• Respeite a privacidade de todos os membros.</p>
    <h3 class="font-orbitron font-bold mt-3 mb-2" style="font-size:14px;color:var(--text);">5. Penalidades</h3>
    <p>• <strong>Advertência</strong> - Primeira infração leve<br>• <strong>Suspensão temporária</strong> - Infrações repetidas<br>• <strong>Reset de ranking</strong> - Fraude comprovada<br>• <strong>Banimento permanente</strong> - Infrações graves</p>
    <h3 class="font-orbitron font-bold mt-3 mb-2" style="font-size:14px;color:var(--text);">6. Recursos</h3>
    <p>Caso sofra uma penalidade injusta, entre em contato pelo e-mail: suporte@epicmoments.com</p>
    <h3 class="font-orbitron font-bold mt-3 mb-2" style="font-size:14px;color:var(--text);">7. Torneios</h3>
    <p>• A inscrição em torneios é definitiva após pagamento.<br>• Check-in obrigatório no horário estipulado.</p>
    <h3 class="font-orbitron font-bold mt-3 mb-2" style="font-size:14px;color:var(--text);">8. Comunidades</h3>
    <p>• Criadores de comunidades são responsáveis por manter o ambiente saudável.<br>• Moderadores devem agir com imparcialidade.</p>
    <p class="font-bold mt-3" style="color:var(--text);">Ao se cadastrar na Epic Moments, você concorda com todos os termos acima.</p>
  `;
}

// =================== HOME ===================
function renderHome(el) {
  const newsItems = [
    { icon: '🏟️', title: 'Novo Torneio: CS2 Master Cup', desc: 'Inscrições abertas! Premiação de R$500 para o primeiro lugar.', page: 'torneios' },
    { icon: '🏆', title: 'Novo Achievement: Defuse Ninja', desc: 'Enquete em votação! Desarme a bomba com inimigos vivos.', page: 'enquetes' },
    { icon: '🎮', title: 'Fortnite adicionado!', desc: 'O battle royale da Epic Games agora faz parte da plataforma.', page: 'jogos' },
    { icon: '📊', title: 'Nova Enquete Disponível', desc: 'Penta no Baron - vote agora na seção de Enquetes!', page: 'enquetes' },
  ];

  const features = [
    { icon: '🏆', title: 'Achievements', desc: 'Conquiste achievements criados pela comunidade e suba no ranking.' },
    { icon: '🎬', title: 'Comprove em Vídeo', desc: 'Envie vídeos curtos provando suas conquistas.' },
    { icon: '👑', title: 'Ranking Global', desc: 'Compare sua pontuação com jogadores do mundo todo.' },
    { icon: '🗣️', title: 'Comunidades', desc: 'Participe de guilds, debata e interaja.' },
    { icon: '🏟️', title: 'Torneios', desc: 'Participe de torneios com premiação real!' },
    { icon: '📊', title: 'Enquetes', desc: 'Sugira novos achievements e vote. 70%+ aprovação para entrar!' },
  ];

  let html = `<div class="animate-in"><div class="text-center hero-radial" style="padding:64px 24px;">`;
  html += `<img src="/img/logo-icon.png" alt="Logo" style="max-width:120px;margin:0 auto 24px;">`;
  html += `<h1 class="font-orbitron font-black" style="font-size:32px;margin-bottom:16px;">Conquistas <span class="gradient-text">Inesquecíveis</span></h1>`;
  html += `<p class="text-muted" style="max-width:560px;margin:0 auto 32px;">A comunidade gamer onde seus achievements brilham. Conquiste, comprove com vídeos e suba no ranking!</p>`;

  if (currentUser) {
    html += `<div class="card" style="display:inline-block;padding:32px;text-align:left;max-width:480px;">`;
    html += `<div class="font-orbitron font-bold" style="font-size:18px;margin-bottom:4px;">Bem-vindo, <span class="gradient-text">${esc(currentUser.nickname)}</span>! 👋</div>`;
    html += `<p class="text-muted text-sm mb-4">Confira as novidades da plataforma:</p>`;
    newsItems.forEach(n => {
      html += `<button onclick="navigateTo('${n.page}')" style="width:100%;text-align:left;display:flex;align-items:flex-start;gap:12px;padding:12px;border-radius:8px;background:rgba(30,41,59,0.5);border:none;color:var(--text);cursor:pointer;margin-bottom:8px;transition:all 0.2s;" onmouseover="this.style.background='rgba(30,41,59,0.8)'" onmouseout="this.style.background='rgba(30,41,59,0.5)'">
        <span style="font-size:20px;flex-shrink:0;">${n.icon}</span>
        <div><div class="text-sm font-bold">${n.title}</div><div class="text-xs text-muted">${n.desc}</div></div>
      </button>`;
    });
    html += `</div>`;
  } else {
    html += `<button class="btn btn-gold" onclick="showAuthModal()" style="font-size:16px;padding:12px 32px;">Comece Agora 🏆</button>`;
  }
  html += `</div>`;

  if (!currentUser) {
    html += `<div style="max-width:900px;margin:0 auto;padding:0 24px 48px;" class="grid grid-3">`;
    features.forEach(f => {
      html += `<div class="card p-6"><div class="font-orbitron font-bold mb-3">${f.icon} ${f.title}</div><p class="text-muted text-sm">${f.desc}</p></div>`;
    });
    html += `</div>`;
  }
  html += `</div>`;
  el.innerHTML = html;
}

// =================== JOGOS ===================
async function renderJogos(el) {
  showLoading();
  try {
    const res = await fetch('/api/jogos');
    const jogos = await res.json();
    let html = `<div class="animate-in" style="max-width:900px;margin:0 auto;">`;
    html += `<h1 class="font-orbitron font-black mb-6" style="font-size:28px;">🎮 Jogos</h1>`;
    html += `<div class="grid grid-2">`;
    jogos.forEach(j => {
      html += `<div class="card cursor-pointer" onclick="navigateTo('jogoDetail',${j.id_jogo})" style="overflow:hidden;">`;
      html += `<img src="${esc(j.imagem||'/img/logo-icon.png')}" alt="${esc(j.nome)}" style="width:100%;height:160px;object-fit:cover;" onerror="this.src='/img/logo-icon.png'">`;
      html += `<div class="p-5"><div class="font-orbitron font-bold text-sm mb-2">${esc(j.nome)}</div>`;
      html += `<p class="text-muted text-xs mb-2 line-clamp-2">${esc(j.descricao||'')}</p>`;
      html += `<p class="text-xs text-muted mb-3">Dev: ${esc(j.desenvolvedor||'')}</p>`;
      html += `<div class="flex gap-2"><span class="badge badge-points">👤 ${j.totalJogadores||0}</span><span class="badge badge-easy">🏆 ${j.totalAchievements||0}</span></div>`;
      html += `</div></div>`;
    });
    html += `</div></div>`;
    el.innerHTML = html;
  } catch(e) { el.innerHTML = `<div class="text-center p-6 text-muted">Erro ao carregar jogos. Verifique a conexão com o servidor.</div>`; }
  hideLoading();
}

async function renderJogoDetail(el) {
  const jogoId = window._pageData;
  showLoading();
  try {
    const [jogosRes, achsRes] = await Promise.all([fetch('/api/jogos'), fetch('/api/achievements')]);
    const jogos = await jogosRes.json();
    const achs = await achsRes.json();
    const j = jogos.find(x => x.id_jogo === jogoId);
    if (!j) { el.innerHTML = '<p class="text-center text-muted p-6">Jogo não encontrado</p>'; return; }
    const jogoAchs = achs.filter(a => a.id_jogo === jogoId);

    let html = `<div class="animate-in" style="max-width:900px;margin:0 auto;">`;
    html += `<button class="btn btn-secondary btn-sm mb-4" onclick="navigateTo('jogos')">← Voltar aos Jogos</button>`;
    html += `<div class="card" style="overflow:hidden;margin-bottom:24px;">`;
    html += `<img src="${esc(j.imagem||'/img/logo-icon.png')}" alt="${esc(j.nome)}" style="width:100%;height:200px;object-fit:cover;" onerror="this.src='/img/logo-icon.png'">`;
    html += `<div class="p-6"><h2 class="font-orbitron font-black mb-2" style="font-size:24px;">${esc(j.nome)}</h2>`;
    html += `<p class="text-muted text-sm mb-3">${esc(j.descricao||'')}</p>`;
    html += `<p class="text-xs text-muted">Desenvolvedor: ${esc(j.desenvolvedor||'')}</p>`;
    html += `<div class="flex gap-2 mt-3"><span class="badge badge-points">👤 ${j.totalJogadores||0} jogadores</span><span class="badge badge-easy">🏆 ${j.totalAchievements||0} achievements</span></div>`;
    // Check if game is linked
    let vinculadosIds = [];
    if (currentUser) {
      try {
        const vincRes = await fetch('/api/jogos/vinculados');
        vinculadosIds = await vincRes.json();
      } catch(e) {}
    }
    const isVinculado = vinculadosIds.includes(jogoId);
    if (currentUser) {
      if (isVinculado) {
        html += `<span class="badge badge-easy mt-3" style="padding:8px 14px;font-size:13px;">✅ Jogo vinculado ao seu perfil</span>`;
      } else {
        html += `<button class="btn btn-primary btn-sm mt-3" onclick="vincularJogo(${jogoId})">Vincular Jogo ao Perfil</button>`;
      }
    }
    html += `</div></div>`;

    html += `<h3 class="font-orbitron font-bold mb-4" style="font-size:20px;">🏆 Achievements</h3>`;
    html += `<div class="grid grid-3">`;
    jogoAchs.forEach(a => {
      const db = a.dificuldade === 'facil' ? 'badge-easy' : a.dificuldade === 'medio' ? 'badge-medium' : 'badge-hard';
      const dl = a.dificuldade === 'facil' ? 'Fácil' : a.dificuldade === 'medio' ? 'Médio' : 'Difícil';
      html += `<div class="card p-5"><div class="font-orbitron font-bold text-sm mb-2">🏆 ${esc(a.nome)}</div>`;
      if (a.descricao) html += `<p class="text-muted text-xs mb-2">${esc(a.descricao)}</p>`;
      html += `<div class="flex gap-2"><span class="badge ${db}">${dl}</span><span class="badge badge-points">${a.pontos} pts</span></div>`;
      if (currentUser && isVinculado) {
        html += `<button class="btn btn-gold btn-sm mt-2 w-full" onclick="reivindicarAchievement(${a.id_achievement},'${esc(j.nome)}')">🎬 Reivindicar Achievement</button>`;
      }
      html += `</div>`;
    });
    if (jogoAchs.length === 0) html += `<p class="text-muted text-center">Nenhum achievement para este jogo</p>`;
    html += `</div></div>`;
    el.innerHTML = html;
  } catch(e) { el.innerHTML = `<div class="text-center p-6 text-muted">Erro ao carregar jogo</div>`; }
  hideLoading();
}

async function vincularJogo(id) {
  try {
    const res = await fetch('/api/jogos/vincular', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({id_jogo: id}) });
    const data = await res.json();
    if (data.error) { showToast(data.error, 'error'); return; }
    showToast('Jogo vinculado ao seu perfil!');
    navigateTo('jogoDetail', id);
  } catch(e) { showToast('Erro ao vincular jogo', 'error'); }
}

// =================== ACHIEVEMENTS ===================
async function renderAchievements(el) {
  showLoading();
  try {
    const res = await fetch('/api/achievements');
    const achs = await res.json();
    let html = `<div class="animate-in" style="max-width:900px;margin:0 auto;">`;
    html += `<h1 class="font-orbitron font-black mb-6" style="font-size:28px;">🏆 Achievements</h1>`;
    html += `<div class="tabs"><button class="tab active" onclick="filterAchs(this,'all')">Todos</button><button class="tab" onclick="filterAchs(this,'facil')">Fácil</button><button class="tab" onclick="filterAchs(this,'medio')">Médio</button><button class="tab" onclick="filterAchs(this,'dificil')">Difícil</button></div>`;
    html += `<div class="grid grid-3" id="achs-grid">`;
    achs.forEach(a => {
      const db = a.dificuldade === 'facil' ? 'badge-easy' : a.dificuldade === 'medio' ? 'badge-medium' : 'badge-hard';
      const dl = a.dificuldade === 'facil' ? 'Fácil' : a.dificuldade === 'medio' ? 'Médio' : 'Difícil';
      html += `<div class="card p-5 ach-item cursor-pointer" data-dif="${a.dificuldade}" onclick="navigateTo('achievementRanking',${a.id_achievement})"><div class="font-orbitron font-bold text-sm mb-2">🏆 ${esc(a.nome)}</div>`;
      if (a.descricao) html += `<p class="text-muted text-xs mb-2">${esc(a.descricao)}</p>`;
      html += `<p class="text-muted text-xs mb-2">Jogo: ${esc(a.jogo_nome||'Geral')}</p>`;
      html += `<div class="flex gap-2"><span class="badge ${db}">${dl}</span><span class="badge badge-points">${a.pontos} pts</span></div></div>`;
    });
    html += `</div></div>`;
    el.innerHTML = html;
  } catch(e) { el.innerHTML = `<div class="text-center p-6 text-muted">Erro ao carregar achievements</div>`; }
  hideLoading();
}

function filterAchs(btn, dif) {
  document.querySelectorAll('.tabs .tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.ach-item').forEach(item => {
    item.style.display = (dif === 'all' || item.dataset.dif === dif) ? '' : 'none';
  });
}

// =================== RANKING ===================
async function renderRanking(el) {
  showLoading();
  try {
    const [globalRes, amigosRes] = await Promise.all([fetch('/api/ranking'), fetch('/api/ranking/amigos')]);
    const globalData = await globalRes.json();
    const amigosData = await amigosRes.json();
    window._rankingData = { global: globalData, amigos: amigosData };

    let html = `<div class="animate-in" style="max-width:900px;margin:0 auto;">`;
    html += `<h1 class="font-orbitron font-black mb-6" style="font-size:28px;">👑 Ranking</h1>`;
    html += `<div class="tabs"><button class="tab active" onclick="switchRanking(this,'global')">Global</button><button class="tab" onclick="switchRanking(this,'amigos')">Entre Amigos</button></div>`;
    html += `<div class="card" style="overflow:hidden;" id="ranking-table">${buildRankingTable(globalData)}</div>`;
    html += `</div>`;
    el.innerHTML = html;
  } catch(e) { el.innerHTML = `<div class="text-center p-6 text-muted">Erro ao carregar ranking</div>`; }
  hideLoading();
}

function buildRankingTable(data) {
  let html = `<div class="table-wrap"><table><thead><tr><th>#</th><th>Jogador</th><th>Pontos</th></tr></thead><tbody>`;
  data.forEach((r, i) => {
    const rc = i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : '';
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i+1);
    html += `<tr style="cursor:pointer;" onclick="navigateTo('userProfile',${r.id})"><td class="font-orbitron font-black ${rc}" style="font-size:18px;">${medal}</td><td class="font-bold">${esc(r.nickname)}</td><td><span class="badge badge-points">${r.pontos_usuario} pts</span></td></tr>`;
  });
  if (data.length === 0) html += `<tr><td colspan="3" class="text-center text-muted" style="padding:32px;">Sem dados</td></tr>`;
  html += `</tbody></table></div>`;
  return html;
}

function switchRanking(btn, type) {
  document.querySelectorAll('.tabs .tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('ranking-table').innerHTML = buildRankingTable(window._rankingData[type] || []);
}

// =================== COMUNIDADES ===================
async function renderGuilds(el) {
  showLoading();
  try {
    const res = await fetch('/api/comunidades');
    const guilds = await res.json();
    let html = `<div class="animate-in" style="max-width:900px;margin:0 auto;">`;
    html += `<div class="flex items-center justify-between mb-6"><h1 class="font-orbitron font-black" style="font-size:28px;">🗣️ Comunidades</h1>`;
    if (currentUser) html += `<button class="btn btn-primary btn-sm" onclick="toggleCreateGuild()">+ Criar Comunidade</button>`;
    html += `</div>`;
    html += `<div id="create-guild-form" class="hidden card p-5 mb-6 animate-in">
      <div class="font-orbitron font-bold text-sm mb-3">Nova Comunidade</div>
      <div class="mb-3"><label class="label">Nome *</label><input class="input" id="guild-nome" placeholder="Nome da comunidade"></div>
      <div class="mb-3"><label class="label">Descrição</label><textarea class="input" id="guild-desc" rows="2" placeholder="Descrição (opcional)"></textarea></div>
      <button class="btn btn-gold btn-sm" onclick="createGuild()">Criar Comunidade</button>
    </div>`;
    html += `<div class="grid grid-3">`;
    guilds.forEach(g => {
      html += `<div class="card p-5"><div class="font-orbitron font-bold text-sm mb-2">🏰 ${esc(g.nome)}</div>`;
      if (g.descricao) html += `<p class="text-muted text-xs mb-2 line-clamp-2">${esc(g.descricao)}</p>`;
      html += `<div class="flex gap-2 mb-3 flex-wrap"><span class="badge badge-points">👥 ${g.totalMembros} membros</span></div>`;
      html += `<div class="flex gap-2"><button class="btn btn-primary btn-sm" onclick="navigateTo('comunidadeDetail',${g.id_comunidade})">Acessar</button></div>`;
      html += `</div>`;
    });
    html += `</div></div>`;
    el.innerHTML = html;
  } catch(e) { el.innerHTML = `<div class="text-center p-6 text-muted">Erro ao carregar comunidades</div>`; }
  hideLoading();
}

function toggleCreateGuild() { document.getElementById('create-guild-form').classList.toggle('hidden'); }

async function createGuild() {
  const nome = document.getElementById('guild-nome').value.trim();
  const descricao = document.getElementById('guild-desc').value.trim();
  if (!nome) { showToast('Nome obrigatório', 'error'); return; }
  try {
    const res = await fetch('/api/comunidades', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({nome, descricao}) });
    const data = await res.json();
    if (data.error) { showToast(data.error, 'error'); return; }
    showToast('Comunidade criada com sucesso!');
    navigateTo('guilds');
  } catch(e) { showToast('Erro ao criar comunidade', 'error'); }
}

async function renderComunidadeDetail(el) {
  const comId = window._pageData;
  showLoading();
  try {
    const res = await fetch(`/api/comunidades/${comId}`);
    const data = await res.json();
    const { comunidade: com, membros, topicos, meuEstado } = data;

    // Determine membership status
    const isMember = meuEstado && meuEstado.estado === 'aceito';
    const isPending = meuEstado && meuEstado.estado === 'pendente';
    const isAdmin = currentUser && currentUser.tipo === 'administrador';
    const canPost = isMember || isAdmin;

    let html = `<div class="animate-in" style="max-width:800px;margin:0 auto;">`;
    html += `<button class="btn btn-secondary btn-sm mb-4" onclick="navigateTo('guilds')">← Voltar às Comunidades</button>`;
    html += `<div class="card p-6 mb-6" style="border-top:3px solid var(--primary);">`;
    html += `<h2 class="font-orbitron font-black mb-2" style="font-size:24px;">🏰 ${esc(com.nome)}</h2>`;
    if (com.descricao) html += `<p class="text-muted text-sm mb-3">${esc(com.descricao)}</p>`;
    html += `<div class="flex gap-3 flex-wrap"><span class="badge badge-points">👥 ${membros.length} membros</span><span class="badge badge-easy">💬 ${topicos.length} tópicos</span></div>`;

    // Candidatar-se button
    if (currentUser && !isMember && !isPending) {
      html += `<div class="mt-4"><button class="btn btn-gold btn-sm" onclick="pedirEntrada(${comId})">👤 Candidatar-se à Comunidade</button></div>`;
    } else if (isPending) {
      html += `<div class="mt-4"><button class="btn btn-secondary btn-sm" disabled style="opacity:0.6;cursor:not-allowed;">⏳ Candidatura Pendente</button></div>`;
    } else if (isMember) {
      html += `<div class="mt-4"><span class="badge badge-easy" style="padding:6px 14px;font-size:13px;">✅ Membro da Comunidade</span></div>`;
    }
    html += `</div>`;

    html += `<div class="tabs"><button class="tab active" id="com-tab-forum" onclick="switchComTab('forum')">💬 Fórum</button><button class="tab" id="com-tab-membros" onclick="switchComTab('membros')">👥 Membros (${membros.length})</button></div>`;

    // Forum
    html += `<div id="com-forum">`;
    if (canPost) {
      html += `<div class="mb-4"><button class="btn btn-primary btn-sm" onclick="document.getElementById('new-post-form').classList.toggle('hidden')">+ Nova Postagem</button></div>`;
      html += `<div id="new-post-form" class="hidden card p-5 mb-4 animate-in">
        <div class="font-orbitron font-bold text-sm mb-3">Nova Postagem</div>
        <div class="mb-3"><input class="input" id="post-titulo" placeholder="Título do tópico *"></div>
        <div class="mb-3"><textarea class="input" id="post-conteudo" rows="3" placeholder="Conteúdo..."></textarea></div>
        <button class="btn btn-primary btn-sm" onclick="createPost(${comId})">Publicar</button>
      </div>`;
    } else if (currentUser && !isMember && !isPending) {
      html += `<div class="card p-4 mb-4" style="border-left:3px solid var(--accent);"><p class="text-sm text-muted">🔒 Apenas membros podem postar no fórum. <button class="btn btn-gold btn-sm" onclick="pedirEntrada(${comId})" style="margin-left:8px;">Candidatar-se</button></p></div>`;
    } else if (isPending) {
      html += `<div class="card p-4 mb-4" style="border-left:3px solid var(--accent);"><p class="text-sm text-muted">⏳ Sua candidatura está pendente. Aguarde a aprovação para postar.</p></div>`;
    }
    topicos.forEach(t => {
      html += `<div class="card p-5 mb-3 cursor-pointer" onclick="showTopic(${comId},${t.id_topico})">
        <div class="flex items-center justify-between gap-3">
          <div><div class="font-orbitron font-bold text-sm mb-1">${esc(t.titulo)}</div>
          <p class="text-xs text-muted mb-2">por <span class="text-primary">${esc(t.autor_nome)}</span> • ${new Date(t.created_at).toLocaleDateString('pt-BR')}</p>
          <p class="text-sm line-clamp-2">${esc(t.conteudo||'')}</p></div>
          <div class="text-muted text-xs shrink-0">💬 ${(t.respostas||[]).length}</div>
        </div>
      </div>`;
    });
    if (topicos.length === 0) html += `<div class="text-center p-6 text-muted">Nenhum tópico ainda. Seja o primeiro a postar!</div>`;
    html += `</div>`;

    // Membros
    html += `<div id="com-membros" class="hidden">`;
    membros.forEach(m => {
      const roleColor = m.papel === 'criador' ? 'color:#fde047' : m.papel === 'moderador' ? 'color:#60a5fa' : 'color:var(--text-muted)';
      const roleIcon = m.papel === 'criador' ? '👑' : m.papel === 'moderador' ? '🛡️' : '';
      html += `<div class="card p-4 mb-2 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="avatar avatar-md gradient-main">${esc(m.nickname.charAt(0).toUpperCase())}</div>
          <div><div class="font-bold text-sm">${esc(m.nickname)}</div>
          <div class="flex gap-2 items-center"><span class="badge badge-points">${m.pontos_usuario} pts</span><span class="text-xs font-bold" style="${roleColor}">${roleIcon} ${m.papel}</span></div></div>
        </div>
      </div>`;
    });
    html += `</div></div>`;
    el.innerHTML = html;
    window._comData = data;
    window._comCanPost = canPost;
  } catch(e) { el.innerHTML = `<div class="text-center p-6 text-muted">Erro ao carregar comunidade</div>`; }
  hideLoading();
}

function switchComTab(tab) {
  document.getElementById('com-tab-forum').classList.toggle('active', tab === 'forum');
  document.getElementById('com-tab-membros').classList.toggle('active', tab === 'membros');
  document.getElementById('com-forum').classList.toggle('hidden', tab !== 'forum');
  document.getElementById('com-membros').classList.toggle('hidden', tab !== 'membros');
}

async function pedirEntrada(comId) {
  try {
    const res = await fetch(`/api/comunidades/${comId}/pedir-entrada`, { method: 'POST' });
    const data = await res.json();
    if (data.error) { showToast(data.error, 'error'); return; }
    showToast('Candidatura enviada com sucesso! Aguarde a aprovação.');
    navigateTo('comunidadeDetail', comId);
  } catch(e) { showToast('Erro ao enviar candidatura', 'error'); }
}

async function createPost(comId) {
  const titulo = document.getElementById('post-titulo').value.trim();
  const conteudo = document.getElementById('post-conteudo').value.trim();
  if (!titulo) { showToast('Título obrigatório', 'error'); return; }
  try {
    const res = await fetch('/api/topicos', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({id_comunidade: comId, titulo, conteudo}) });
    const data = await res.json();
    if (data.error) { showToast(data.error, 'error'); return; }
    showToast('Postagem criada!');
    navigateTo('comunidadeDetail', comId);
  } catch(e) { showToast('Erro ao criar postagem', 'error'); }
}

function showTopic(comId, topicId) {
  const data = window._comData;
  const topic = data.topicos.find(t => t.id_topico === topicId);
  if (!topic) return;
  const canPost = window._comCanPost || false;
  const el = document.getElementById('page-content');
  let html = `<div class="animate-in" style="max-width:800px;margin:0 auto;">`;
  html += `<button class="btn btn-secondary btn-sm mb-4" onclick="navigateTo('comunidadeDetail',${comId})">← Voltar ao Fórum</button>`;
  html += `<div class="card p-6 mb-4"><h2 class="font-orbitron font-bold mb-2" style="font-size:18px;">${esc(topic.titulo)}</h2>`;
  html += `<p class="text-xs text-muted mb-3">por <span class="text-primary font-bold">${esc(topic.autor_nome)}</span> • ${new Date(topic.created_at).toLocaleDateString('pt-BR')}</p>`;
  html += `<p class="text-sm" style="line-height:1.7;">${esc(topic.conteudo||'')}</p></div>`;
  html += `<h3 class="font-orbitron font-bold text-sm mb-3">💬 Respostas (${(topic.respostas||[]).length})</h3>`;
  (topic.respostas||[]).forEach(r => {
    html += `<div class="card p-4 mb-2" style="margin-left:16px;border-left:2px solid rgba(129,140,248,0.3);">`;
    html += `<p class="text-xs text-muted mb-1"><span class="text-primary font-bold">${esc(r.autor_nome)}</span> • ${new Date(r.created_at).toLocaleDateString('pt-BR')}</p>`;
    html += `<p class="text-sm">${esc(r.texto)}</p></div>`;
  });
  if (canPost) {
    html += `<div class="card p-4 mt-4"><div class="flex gap-2"><input class="input" id="reply-text" placeholder="Escreva uma resposta..."><button class="btn btn-primary btn-sm shrink-0" onclick="sendReply(${comId},${topicId})">Responder</button></div></div>`;
  } else if (currentUser) {
    html += `<div class="card p-4 mt-4" style="border-left:3px solid var(--accent);"><p class="text-sm text-muted">🔒 Apenas membros podem responder neste tópico.</p></div>`;
  }
  html += `</div>`;
  el.innerHTML = html;
}

async function sendReply(comId, topicId) {
  const texto = document.getElementById('reply-text').value;
  if (!texto) return;
  await fetch('/api/respostas', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({id_topico: topicId, texto}) });
  navigateTo('comunidadeDetail', comId);
}

// =================== ENQUETES ===================
async function renderEnquetes(el) {
  showLoading();
  try {
    const [enquetesRes, jogosRes, votosRes] = await Promise.all([fetch('/api/enquetes'), fetch('/api/jogos'), fetch('/api/enquetes/meus-votos')]);
    const enquetes = await enquetesRes.json();
    const jogos = await jogosRes.json();
    const votos = await votosRes.json();
    let html = `<div class="animate-in" style="max-width:900px;margin:0 auto;">`;
    html += `<h1 class="font-orbitron font-black mb-6" style="font-size:28px;">📊 Enquetes de Achievements</h1>`;

    // Suggestion form for all logged-in users
    if (currentUser) {
      html += `<div class="card p-6 mb-6">`;
      html += `<div class="font-orbitron font-bold mb-3">📝 Sugerir Novo Achievement</div>`;
      html += `<p class="text-muted text-sm mb-4">Sugira um novo achievement para a comunidade votar. Se atingir 70%+ de aprovação, será adicionado ao catálogo!</p>`;
      html += `<div class="grid" style="grid-template-columns:1fr 1fr;gap:12px;">`;
      html += `<div class="mb-3"><label class="label">Nome do Achievement *</label><input class="input" id="enq-nome" placeholder="Ex: Penta Kill"></div>`;
      html += `<div class="mb-3"><label class="label">Jogo</label><select class="input" id="enq-jogo"><option value="">Geral</option>${jogos.map(j => `<option value="${j.id_jogo}">${esc(j.nome)}</option>`).join('')}</select></div>`;
      html += `<div class="mb-3" style="grid-column:1/-1;"><label class="label">Descrição</label><textarea class="input" id="enq-desc" rows="2" placeholder="Descreva o que precisa ser feito..."></textarea></div>`;
      html += `<div class="mb-3"><label class="label">Dificuldade</label><select class="input" id="enq-dificuldade"><option value="facil">Fácil (15 pts)</option><option value="medio">Médio (30 pts)</option><option value="dificil">Difícil (50 pts)</option></select></div>`;
      html += `<div class="mb-3"><label class="label">Pontos</label><input class="input" id="enq-pontos" type="number" min="1" value="15"></div>`;
      html += `<div class="mb-3"><label class="label">Data Fim da Votação *</label><input class="input" id="enq-fim" type="date"></div>`;
      html += `</div>`;
      html += `<button class="btn btn-gold btn-sm" onclick="createEnquete()">📊 Criar Enquete</button>`;
      html += `</div>`;
    }

    html += `<div class="grid grid-2">`;
    enquetes.forEach(e => {
      const expired = new Date(e.data_fim) < new Date();
      const approved = e.percentual >= 70 && expired;
      const statusBadge = approved ? 'badge-easy' : expired ? 'badge-hard' : 'badge-medium';
      const statusText = approved ? '✅ Aprovado' : expired ? '❌ Não aprovado' : '⏳ Em votação';
      const barColor = e.percentual >= 70 ? '#22c55e' : '#f59e0b';
      html += `<div class="card p-5"><div class="font-orbitron font-bold text-sm mb-2">📊 ${esc(e.nome_achievement)}</div>`;
      if (e.descricao) html += `<p class="text-muted text-xs mb-2">${esc(e.descricao)}</p>`;
      html += `<p class="text-muted text-xs">Jogo: ${esc(e.jogo_nome||'Geral')} | Fim: ${formatDate(e.data_fim)}</p>`;
      html += `<div class="flex gap-2 mt-2 mb-3"><span class="badge ${statusBadge}">${statusText}</span><span class="badge badge-points">${e.percentual}% (${e.total_votos} votos)</span></div>`;
      html += `<div class="progress-bar mb-3"><div class="progress-fill" style="width:${e.percentual}%;background:${barColor};"></div></div>`;
      const jaVotou = votos.includes(e.id_enquete);
      if (currentUser && !expired && !jaVotou) {
        html += `<div class="flex gap-2"><button class="btn btn-primary btn-sm" onclick="votarEnquete(${e.id_enquete},'aprovar')">👍 Aprovar</button><button class="btn btn-danger btn-sm" onclick="votarEnquete(${e.id_enquete},'rejeitar')">👎 Rejeitar</button></div>`;
      } else if (currentUser && jaVotou) {
        html += `<div class="flex items-center gap-2 mt-2"><span class="text-xs text-muted">✅ Você já votou nesta enquete</span></div>`;
      }
      html += `</div>`;
    });
    html += `</div></div>`;
    el.innerHTML = html;
  } catch(e) { el.innerHTML = `<div class="text-center p-6 text-muted">Erro ao carregar enquetes</div>`; }
  hideLoading();
}

async function votarEnquete(id, voto) {
  await fetch(`/api/enquetes/${id}/votar`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({voto}) });
  navigateTo('enquetes');
}

async function createEnquete() {
  const nome_achievement = document.getElementById('enq-nome').value.trim();
  const descricao = document.getElementById('enq-desc').value.trim();
  const id_jogo = document.getElementById('enq-jogo').value || null;
  const dificuldade = document.getElementById('enq-dificuldade').value;
  const pontos = parseInt(document.getElementById('enq-pontos').value) || 15;
  const data_fim = document.getElementById('enq-fim').value;
  if (!nome_achievement) { showToast('Nome do achievement é obrigatório', 'error'); return; }
  if (!data_fim) { showToast('Data de fim da votação é obrigatória', 'error'); return; }
  const data_inicio = new Date().toISOString().split('T')[0];
  try {
    const res = await fetch('/api/enquetes', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ nome_achievement, descricao, dificuldade, pontos, id_jogo, data_inicio, data_fim }) });
    const data = await res.json();
    if (data.error) { showToast(data.error, 'error'); return; }
    showToast('Enquete criada com sucesso! A comunidade já pode votar.');
    navigateTo('enquetes');
  } catch(e) { showToast('Erro ao criar enquete', 'error'); }
}

// =================== TORNEIOS ===================
async function renderTorneios(el) {
  showLoading();
  try {
    const res = await fetch('/api/torneios');
    const torneios = await res.json();
    let html = `<div class="animate-in" style="max-width:900px;margin:0 auto;">`;
    html += `<div class="flex items-center justify-between mb-6"><h1 class="font-orbitron font-black" style="font-size:28px;">🏟️ Torneios</h1>`;
    if (currentUser && currentUser.tipo === 'administrador') html += `<button class="btn btn-primary btn-sm" onclick="toggleCreateTorneio()">+ Criar Torneio</button>`;
    html += `</div>`;

    // Create torneio form (admin only)
    if (currentUser && currentUser.tipo === 'administrador') {
      const [jogosRes, achsRes] = await Promise.all([fetch('/api/jogos'), fetch('/api/achievements')]);
      const jogos = await jogosRes.json();
      const achs = await achsRes.json();
      let jogosOpts = jogos.map(j => `<option value="${j.id_jogo}">${esc(j.nome)}</option>`).join('');
      let achsOpts = '<option value="">Nenhum</option>' + achs.map(a => `<option value="${a.id_achievement}">${esc(a.nome)} (${esc(a.jogo_nome||'Geral')})</option>`).join('');

      html += `<div id="create-torneio-form" class="hidden card p-5 mb-6 animate-in">
        <div class="font-orbitron font-bold text-sm mb-3">Novo Torneio</div>
        <div class="grid" style="grid-template-columns:1fr 1fr;gap:12px;">
          <div class="mb-3" style="grid-column:1/-1;"><label class="label">Nome *</label><input class="input" id="torneio-nome" placeholder="Nome do torneio"></div>
          <div class="mb-3" style="grid-column:1/-1;"><label class="label">Descrição</label><textarea class="input" id="torneio-desc" rows="2" placeholder="Descrição do torneio"></textarea></div>
          <div class="mb-3"><label class="label">Jogo *</label><select class="input" id="torneio-jogo">${jogosOpts}</select></div>
          <div class="mb-3"><label class="label">Achievement (opcional)</label><select class="input" id="torneio-achievement">${achsOpts}</select></div>
          <div class="mb-3"><label class="label">Taxa de Inscrição (R$)</label><input class="input" id="torneio-taxa" type="number" min="0" step="0.01" value="0"></div>
          <div class="mb-3"><label class="label">Máx. Participantes</label><input class="input" id="torneio-max" type="number" min="2" value="32"></div>
          <div class="mb-3"><label class="label">Prêmio 1º (R$)</label><input class="input" id="torneio-p1" type="number" min="0" step="0.01" value="0"></div>
          <div class="mb-3"><label class="label">Prêmio 2º (R$)</label><input class="input" id="torneio-p2" type="number" min="0" step="0.01" value="0"></div>
          <div class="mb-3"><label class="label">Prêmio 3º (R$)</label><input class="input" id="torneio-p3" type="number" min="0" step="0.01" value="0"></div>
          <div class="mb-3"><label class="label">Data Início *</label><input class="input" id="torneio-di" type="date"></div>
          <div class="mb-3"><label class="label">Hora Início *</label><input class="input" id="torneio-hi" type="time"></div>
          <div class="mb-3"><label class="label">Data Fim *</label><input class="input" id="torneio-df" type="date"></div>
        </div>
        <button class="btn btn-gold btn-sm" onclick="createTorneio()">Criar Torneio</button>
      </div>`;
    }

    html += `<div class="grid grid-2">`;
    torneios.forEach(t => {
      const active = new Date(t.data_fim) > new Date();
      html += `<div class="card p-5 cursor-pointer" onclick="navigateTo('torneioDetail',${t.id_torneio})">`;
      html += `<div class="flex items-center justify-between mb-2"><div class="font-orbitron font-bold text-sm">🏟️ ${esc(t.nome)}</div><span class="badge ${active?'badge-easy':'badge-hard'}">${active?'🟢 Aberto':'🔴 Encerrado'}</span></div>`;
      if (t.descricao) html += `<p class="text-muted text-xs mb-2 line-clamp-2">${esc(t.descricao)}</p>`;
      html += `<p class="text-xs text-muted mb-1">🎮 ${esc(t.jogo_nome||'')} | 🏆 ${esc(t.achievement_nome||'')}</p>`;
      html += `<p class="text-xs text-muted mb-3">📅 ${formatDate(t.data_inicio)} às ${formatTime(t.hora_inicio)}</p>`;
      html += `<div class="flex gap-2 flex-wrap"><span class="badge badge-points">👤 ${t.inscritos}/${t.max_participantes}</span><span class="badge badge-medium">💰 R$${Number(t.taxa_inscricao).toFixed(2)}</span><span class="badge badge-easy">🥇 R$${Number(t.premio_1).toFixed(2)}</span></div>`;
      html += `</div>`;
    });
    html += `</div></div>`;
    el.innerHTML = html;
  } catch(e) { el.innerHTML = `<div class="text-center p-6 text-muted">Erro ao carregar torneios</div>`; }
  hideLoading();
}

function toggleCreateTorneio() { document.getElementById('create-torneio-form').classList.toggle('hidden'); }

async function createTorneio() {
  const nome = document.getElementById('torneio-nome').value.trim();
  const descricao = document.getElementById('torneio-desc').value.trim();
  const id_jogo = document.getElementById('torneio-jogo').value;
  const id_achievement = document.getElementById('torneio-achievement').value || null;
  const taxa_inscricao = parseFloat(document.getElementById('torneio-taxa').value) || 0;
  const max_participantes = parseInt(document.getElementById('torneio-max').value) || 32;
  const premio_1 = parseFloat(document.getElementById('torneio-p1').value) || 0;
  const premio_2 = parseFloat(document.getElementById('torneio-p2').value) || 0;
  const premio_3 = parseFloat(document.getElementById('torneio-p3').value) || 0;
  const data_inicio = document.getElementById('torneio-di').value;
  const hora_inicio = document.getElementById('torneio-hi').value;
  const data_fim = document.getElementById('torneio-df').value;
  if (!nome) { showToast('Nome do torneio é obrigatório', 'error'); return; }
  if (!data_inicio || !hora_inicio || !data_fim) { showToast('Preencha data de início, hora de início e data fim', 'error'); return; }
  if (new Date(data_fim) <= new Date(data_inicio)) { showToast('Data fim deve ser posterior à data início', 'error'); return; }
  if (max_participantes < 2) { showToast('Mínimo de 2 participantes', 'error'); return; }
  try {
    const res = await fetch('/api/torneios', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ nome, descricao, id_jogo, id_achievement, taxa_inscricao, premio_1, premio_2, premio_3, max_participantes, data_inicio, hora_inicio, data_fim }) });
    const data = await res.json();
    if (data.error) { showToast(data.error, 'error'); return; }
    showToast('Torneio criado com sucesso!');
    navigateTo('torneios');
  } catch(e) { showToast('Erro ao criar torneio', 'error'); }
}

async function renderTorneioDetail(el) {
  const torId = window._pageData;
  showLoading();
  try {
    const res = await fetch(`/api/torneios/${torId}`);
    const data = await res.json();
    const t = data.torneio;
    const active = new Date(t.data_fim) > new Date();

    // Check inscription - block access if not inscribed (admin exempt)
    if (currentUser && currentUser.tipo !== 'administrador' && !data.inscrito) {
      let html = `<div class="animate-in" style="max-width:900px;margin:0 auto;">`;
      html += `<button class="btn btn-secondary btn-sm mb-4" onclick="navigateTo('torneios')">← Voltar aos Torneios</button>`;
      html += `<div class="card p-6 text-center"><h2 class="font-orbitron font-bold mb-2">🏟️ ${esc(t.nome)}</h2>`;
      html += `<p class="text-muted mb-4">Voce precisa se inscrever neste torneio para acessar os detalhes.</p>`;
      if (active) html += `<button class="btn btn-gold" onclick="inscreverTorneio(${torId})">💳 Inscrever-se</button>`;
      html += `</div></div>`;
      el.innerHTML = html;
      hideLoading();
      return;
    }

    let html = `<div class="animate-in" style="max-width:900px;margin:0 auto;">`;
    html += `<button class="btn btn-secondary btn-sm mb-4" onclick="navigateTo('torneios')">← Voltar</button>`;
    html += `<div class="card p-6 mb-6" style="border-top:3px solid var(--primary);">`;
    html += `<h2 class="font-orbitron font-black mb-2" style="font-size:24px;">🏟️ ${esc(t.nome)}</h2>`;
    if (t.descricao) html += `<p class="text-muted text-sm mb-4">${esc(t.descricao)}</p>`;

    html += `<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:16px;margin-bottom:24px;">`;
    html += `<div class="text-center p-4" style="background:rgba(30,41,59,0.3);border-radius:12px;border:1px solid rgba(42,51,80,0.5);"><div style="font-size:24px;margin-bottom:4px;">🎮</div><div class="text-xs text-muted">Jogo</div><div class="text-sm font-bold">${esc(t.jogo_nome||'')}</div></div>`;
    html += `<div class="text-center p-4" style="background:rgba(30,41,59,0.3);border-radius:12px;border:1px solid rgba(42,51,80,0.5);"><div style="font-size:24px;margin-bottom:4px;">🏆</div><div class="text-xs text-muted">Achievement</div><div class="text-sm font-bold">${esc(t.achievement_nome||'')}</div></div>`;
    html += `<div class="text-center p-4" style="background:rgba(30,41,59,0.3);border-radius:12px;border:1px solid rgba(42,51,80,0.5);"><div style="font-size:24px;margin-bottom:4px;">📅</div><div class="text-xs text-muted">Início</div><div class="font-orbitron font-bold text-sm">${formatDate(t.data_inicio)}</div><div class="text-primary font-orbitron font-bold text-sm">${formatTime(t.hora_inicio)}</div></div>`;
    html += `<div class="text-center p-4" style="background:rgba(30,41,59,0.3);border-radius:12px;border:1px solid rgba(42,51,80,0.5);"><div class="font-orbitron font-bold text-sm">👤 ${data.inscritos}/${t.max_participantes}</div><div class="text-xs mt-1 font-bold ${active?'':'text-danger'}" style="${active?'color:var(--success)':''}">${active?'Aberto':'Encerrado'}</div></div>`;
    html += `</div>`;

    // Prizes
    html += `<h3 class="font-orbitron font-bold mb-3">🏅 Premiações</h3><div class="flex gap-4 flex-wrap mb-6">`;
    [{pos:'1º',e:'🥇',p:t.premio_1,c:'rank-1'},{pos:'2º',e:'🥈',p:t.premio_2,c:'rank-2'},{pos:'3º',e:'🥉',p:t.premio_3,c:'rank-3'}].forEach(pr => {
      html += `<div class="card p-4 text-center" style="flex:1;min-width:120px;"><div style="font-size:32px;margin-bottom:4px;">${pr.e}</div><div class="font-orbitron font-bold ${pr.c}" style="font-size:18px;">${pr.pos} Lugar</div><div class="text-sm font-bold">R$ ${Number(pr.p).toFixed(2)}</div></div>`;
    });
    html += `</div>`;

    // Inscription
    html += `<div class="card p-4 mb-6 flex items-center justify-between"><div><div class="text-xs text-muted uppercase">Taxa de Inscrição</div><div class="font-orbitron font-bold text-accent" style="font-size:18px;">R$ ${Number(t.taxa_inscricao).toFixed(2)}</div></div>`;
    if (currentUser && active) html += `<button class="btn btn-gold" onclick="inscreverTorneio(${torId})">💳 Inscrever-se (Simulado)</button>`;
    html += `</div></div>`;

    // Mural
    html += `<div class="card p-6 mb-6"><h3 class="font-orbitron font-bold mb-4">📢 Mural do Torneio</h3>`;
    if (data.mural.length > 0) {
      data.mural.forEach(m => {
        html += `<div class="p-4 mb-3" style="border-radius:8px;background:rgba(30,41,59,0.3);border-left:4px solid var(--primary);"><p class="text-sm">${esc(m.texto)}</p><p class="text-xs text-muted mt-2">📅 ${new Date(m.created_at).toLocaleDateString('pt-BR')}</p></div>`;
      });
    } else {
      html += `<p class="text-muted text-sm">Nenhuma mensagem no mural</p>`;
    }
    if (currentUser && currentUser.tipo === 'administrador') {
      html += `<div class="mt-4 flex gap-2"><input class="input" id="mural-texto" placeholder="Escrever no mural..."><button class="btn btn-primary btn-sm shrink-0" onclick="postMural(${torId})">Publicar</button></div>`;
    }
    html += `</div>`;

    // Ranking
    html += `<div class="card p-6"><h3 class="font-orbitron font-bold mb-4">🏆 Ranking do Torneio</h3>`;
    html += `<p class="text-xs text-muted mb-3">Quem completar o achievement mais rápido ganha!</p>`;
    html += `<div class="table-wrap"><table><thead><tr><th>#</th><th>Jogador</th><th>Tempo</th><th>Pontos</th></tr></thead><tbody>`;
    data.participantes.forEach((p, i) => {
      const rc = i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : '';
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i+1);
      html += `<tr><td class="font-orbitron font-black ${rc}" style="font-size:18px;">${medal}</td><td class="font-bold text-sm">${esc(p.nickname)}</td><td style="font-family:monospace;">${p.tempo_conclusao||'--:--:--'}</td><td><span class="badge badge-points">${p.pontos_usuario} pts</span></td></tr>`;
    });
    if (data.participantes.length === 0) html += `<tr><td colspan="4" class="text-center text-muted" style="padding:24px;">Nenhum participante ainda</td></tr>`;
    html += `</tbody></table></div></div></div>`;
    el.innerHTML = html;
  } catch(e) { el.innerHTML = `<div class="text-center p-6 text-muted">Erro ao carregar torneio</div>`; }
  hideLoading();
}

async function inscreverTorneio(id) {
  try {
    const res = await fetch(`/api/torneios/${id}/inscrever`, { method: 'POST' });
    const data = await res.json();
    if (data.error) { showToast(data.error, 'error'); return; }
    showToast('Inscrito com sucesso! (Simulado)');
    navigateTo('torneioDetail', id);
  } catch(e) { showToast('Erro ao se inscrever', 'error'); }
}

async function postMural(id) {
  const texto = document.getElementById('mural-texto').value;
  if (!texto) return;
  await fetch(`/api/torneios/${id}/mural`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({texto}) });
  navigateTo('torneioDetail', id);
}

// =================== SOBRE ===================
function renderSobre(el) {
  const faqItems = [
    { q: 'O que é a Epic Moments?', a: 'A Epic Moments é uma plataforma focada na criação e organização de achievements para a comunidade gamer. Nosso objetivo é promover a competitividade saudável entre amigos e jogadores.' },
    { q: 'Como criar um achievement?', a: 'Os achievements são criados de forma colaborativa pela própria comunidade através de enquetes. Para que a nova conquista seja oficialmente integrada, precisa alcançar pelo menos 70% de aprovação.' },
    { q: 'Como completar um achievement?', a: 'Para validar sua conquista, envie um vídeo curto de no máximo 3 minutos que mostre claramente o cumprimento do requisito.' },
    { q: 'Como funcionam os torneios?', a: 'Torneios são organizados pela administração, vinculados a um jogo e achievement. Possuem data e horário marcados, taxa de inscrição e premiação para os 3 primeiros colocados.' },
    { q: 'Como funciona o sistema de pontos?', a: 'Fácil (15pts), Médio (30pts), Difícil (50pts). Os pontos são acumulados para definir sua posição no ranking.' },
    { q: 'Como criar comunidades?', a: 'Qualquer usuário pode criar uma comunidade. Como criador, você pode aceitar membros e promover moderadores.' },
  ];

  let html = `<div class="animate-in" style="max-width:800px;margin:0 auto;">`;
  html += `<h1 class="font-orbitron font-black mb-6" style="font-size:28px;">ℹ️ Sobre</h1>`;
  html += `<div class="card p-6 mb-6"><h2 class="font-orbitron font-bold mb-3" style="font-size:18px;">Epic Moments</h2>`;
  html += `<p class="text-muted text-sm mb-4" style="line-height:1.8;">A Epic Moments é uma plataforma inovadora focada na comunidade gamer. Aqui, suas conquistas não são apenas medalhas virtuais — elas geram pontos, influenciam seu ranking e podem te qualificar para torneios com premiação real.</p>`;
  html += `<p class="text-muted text-sm" style="line-height:1.8;">Nossa missão é promover competitividade saudável, unir jogadores e celebrar cada momento épico dos games.</p></div>`;

  html += `<div class="card p-6 mb-6"><button onclick="this.nextElementSibling.classList.toggle('hidden');this.querySelector('span').textContent=this.nextElementSibling.classList.contains('hidden')?'▼':'▲'" class="w-full flex items-center justify-between" style="background:none;border:none;color:var(--text);cursor:pointer;"><h2 class="font-orbitron font-bold" style="font-size:18px;">📜 Código de Conduta</h2><span class="text-muted">▼</span></button>`;
  html += `<div class="hidden mt-4 text-muted text-sm" style="line-height:1.8;">${renderCodigoConduta()}</div></div>`;

  html += `<h2 class="font-orbitron font-bold mb-4" style="font-size:20px;">❓ Perguntas Frequentes (FAQ)</h2>`;
  faqItems.forEach((item, i) => {
    html += `<div class="card mb-3" style="overflow:hidden;"><button onclick="this.nextElementSibling.classList.toggle('hidden');this.querySelector('span').textContent=this.nextElementSibling.classList.contains('hidden')?'▼':'▲'" class="w-full flex items-center justify-between p-5" style="background:none;border:none;color:var(--text);cursor:pointer;text-align:left;"><span class="font-orbitron font-bold text-sm">${item.q}</span><span class="text-muted">▼</span></button>`;
    html += `<div class="hidden" style="padding:0 20px 20px;border-top:1px solid var(--border);"><p class="text-muted text-sm mt-3" style="line-height:1.7;">${item.a}</p></div></div>`;
  });
  html += `</div>`;
  el.innerHTML = html;
}

// =================== PERFIL ===================
async function renderPerfil(el) {
  if (!currentUser) { el.innerHTML = '<div class="text-center p-6 text-muted">Faça login para ver o perfil</div>'; return; }
  showLoading();
  try {
    const res = await fetch(`/api/usuarios/${currentUser.id}`);
    const data = await res.json();

    let html = `<div class="animate-in" style="max-width:900px;margin:0 auto;">`;
    // Header with banner
    const initial = currentUser.nickname.charAt(0).toUpperCase();
    html += `<div class="profile-banner" style="background:${currentUser.cor_banner||'#6366f1'};height:120px;border-radius:var(--radius) var(--radius) 0 0;position:relative;">`;
    html += `<div style="position:absolute;bottom:-40px;left:24px;z-index:2;">`;
    if (currentUser.foto_perfil) {
      html += `<div class="avatar avatar-lg" style="border:3px solid var(--bg-card);"><img src="${esc(currentUser.foto_perfil)}" alt="Foto" onerror="this.parentElement.innerHTML='${initial}'"></div>`;
    } else {
      html += `<div class="avatar avatar-lg gradient-main font-orbitron" style="border:3px solid var(--bg-card);">${initial}</div>`;
    }
    html += `</div></div>`;
    html += `<div class="card p-6 mb-6" style="padding-top:56px;">`;
    html += `<div><h2 class="font-orbitron font-bold" style="font-size:24px;">${esc(currentUser.nickname)}</h2>`;
    html += `<p class="text-muted mt-1">${esc(currentUser.descricao_perfil||'Sem descrição')}</p>`;
    if (currentUser.tipo === 'administrador') html += `<span class="badge badge-points mt-1">🛡️ Administrador</span>`;
    html += `<div class="flex gap-6 mt-3">`;
    html += `<div class="text-center"><div class="font-orbitron font-black text-accent" style="font-size:20px;">${currentUser.pontos_usuario}</div><div class="text-xs text-muted uppercase">Pontos</div></div>`;
    html += `<div class="text-center"><div class="font-orbitron font-black text-accent" style="font-size:20px;">${(data.achievements||[]).length}</div><div class="text-xs text-muted uppercase">Achievements</div></div>`;
    html += `<div class="text-center"><div class="font-orbitron font-black text-accent" style="font-size:20px;">${(data.jogos||[]).length}</div><div class="text-xs text-muted uppercase">Jogos</div></div>`;
    html += `</div></div></div>`;

    // Tabs
    html += `<div class="tabs"><button class="tab active" id="perf-tab-achs" onclick="switchPerfTab('achs')">🏆 Achievements</button><button class="tab" id="perf-tab-jogos" onclick="switchPerfTab('jogos')">🎮 Jogos</button><button class="tab" id="perf-tab-edit" onclick="switchPerfTab('edit')">⚙️ Editar Perfil</button></div>`;

    // Achievements
    html += `<div id="perf-achs" class="grid grid-3">`;
    (data.achievements||[]).forEach(a => {
      const db = a.dificuldade === 'facil' ? 'badge-easy' : a.dificuldade === 'medio' ? 'badge-medium' : 'badge-hard';
      const dl = a.dificuldade === 'facil' ? 'Fácil' : a.dificuldade === 'medio' ? 'Médio' : 'Difícil';
      const st = a.estado === 'aprovado' ? 'badge-easy' : 'badge-medium';
      const stl = a.estado === 'aprovado' ? '✅ Aprovado' : '⏳ Pendente';
      html += `<div class="card p-5"><div class="font-orbitron font-bold text-sm mb-2">🏆 ${esc(a.nome)}</div>`;
      if (a.descricao) html += `<p class="text-muted text-xs mb-1">${esc(a.descricao)}</p>`;
      html += `<p class="text-muted text-xs mb-2">Jogo: ${esc(a.jogo_nome||'')}</p>`;
      html += `<div class="flex gap-2 flex-wrap"><span class="badge ${db}">${dl}</span><span class="badge badge-points">${a.pontos} pts</span><span class="badge ${st}">${stl}</span></div></div>`;
    });
    if ((data.achievements||[]).length === 0) html += `<p class="text-muted">Nenhum achievement conquistado</p>`;
    html += `</div>`;

    // Jogos
    html += `<div id="perf-jogos" class="hidden grid grid-3">`;
    (data.jogos||[]).forEach(j => {
      html += `<div class="card" style="overflow:hidden;"><img src="${esc(j.imagem||'/img/logo-icon.png')}" alt="${esc(j.nome)}" style="width:100%;height:120px;object-fit:cover;" onerror="this.src='/img/logo-icon.png'"><div class="p-4"><div class="font-orbitron font-bold text-sm mb-1">${esc(j.nome)}</div><p class="text-muted text-xs">Dev: ${esc(j.desenvolvedor||'')}</p></div></div>`;
    });
    if ((data.jogos||[]).length === 0) html += `<p class="text-muted">Nenhum jogo vinculado</p>`;
    html += `</div>`;

    // Edit
    html += `<div id="perf-edit" class="hidden"><div class="card p-6" style="max-width:500px;">`;
    html += `<div class="font-orbitron font-bold mb-4">Editar Perfil</div>`;
    html += `<div id="perf-alert"></div>`;
    html += `<div class="mb-4"><label class="label">Foto de Perfil</label><input type="file" id="perf-foto-file" accept="image/*" class="input" onchange="uploadFoto()"><input class="input mt-2" id="perf-foto-url" placeholder="ou cole uma URL" value="${esc(currentUser.foto_perfil||'')}"></div>`;
    html += `<div class="mb-4"><label class="label">Bio / Descrição</label><textarea class="input" id="perf-bio" rows="3">${esc(currentUser.descricao_perfil||'')}</textarea></div>`;
    html += `<div class="mb-4"><label class="label">E-mail</label><input class="input" id="perf-email" type="email" value="${esc(currentUser.email)}"></div>`;
    html += `<div class="mb-4"><label class="label">Nova Senha (deixe vazio para manter)</label><input class="input" id="perf-senha" type="password" placeholder="mín. 4 chars, 1 maiúscula"></div>`;
    html += `<div class="mb-4"><label class="label">Cor do Banner</label><div class="flex items-center gap-3"><input type="color" id="perf-banner" value="${currentUser.cor_banner||'#6366f1'}" style="width:48px;height:40px;border:none;cursor:pointer;"><span class="text-xs text-muted" id="perf-banner-val">${currentUser.cor_banner||'#6366f1'}</span></div></div>`;
    html += `<button class="btn btn-primary" onclick="savePerfil()">💾 Salvar Alterações</button>`;
    html += `</div></div>`;
    html += `</div>`;
    el.innerHTML = html;

    document.getElementById('perf-banner').addEventListener('input', function() {
      document.getElementById('perf-banner-val').textContent = this.value;
    });
  } catch(e) { el.innerHTML = `<div class="text-center p-6 text-muted">Erro ao carregar perfil</div>`; }
  hideLoading();
}

function switchPerfTab(tab) {
  ['achs','jogos','edit'].forEach(t => {
    document.getElementById(`perf-tab-${t}`).classList.toggle('active', t === tab);
    document.getElementById(`perf-${t}`).classList.toggle('hidden', t !== tab);
  });
}

async function uploadFoto() {
  const file = document.getElementById('perf-foto-file').files[0];
  if (!file) return;
  const form = new FormData();
  form.append('foto', file);
  try {
    const res = await fetch('/api/perfil/foto', { method: 'POST', body: form });
    const data = await res.json();
    if (data.foto_perfil) {
      currentUser.foto_perfil = data.foto_perfil;
      document.getElementById('perf-foto-url').value = data.foto_perfil;
      document.getElementById('perf-alert').innerHTML = `<div class="alert alert-success">Foto atualizada!</div>`;
    }
  } catch(e) { document.getElementById('perf-alert').innerHTML = `<div class="alert alert-error">Erro ao enviar foto</div>`; }
}

async function savePerfil() {
  const email = document.getElementById('perf-email').value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { document.getElementById('perf-alert').innerHTML = '<div class="alert alert-error">E-mail inválido</div>'; return; }
  const body = {
    descricao_perfil: document.getElementById('perf-bio').value,
    email: email,
    cor_banner: document.getElementById('perf-banner').value,
    senha: document.getElementById('perf-senha').value || null,
  };
  if (body.senha && (body.senha.length < 4 || !/[A-Z]/.test(body.senha))) { document.getElementById('perf-alert').innerHTML = '<div class="alert alert-error">Senha deve ter mínimo 4 caracteres e 1 maiúscula</div>'; return; }
  try {
    const res = await fetch('/api/perfil', { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
    const data = await res.json();
    if (data.error) { document.getElementById('perf-alert').innerHTML = `<div class="alert alert-error">${esc(data.error)}</div>`; return; }
    currentUser.descricao_perfil = body.descricao_perfil;
    currentUser.email = body.email;
    currentUser.cor_banner = body.cor_banner;
    document.getElementById('perf-alert').innerHTML = `<div class="alert alert-success">✅ Perfil atualizado com sucesso!</div>`;
    renderSidebar();
  } catch(e) { document.getElementById('perf-alert').innerHTML = `<div class="alert alert-error">Erro ao salvar perfil</div>`; }
}

// =================== USER PROFILE ===================
async function renderUserProfile(el) {
  const userId = window._pageData;
  showLoading();
  try {
    const res = await fetch(`/api/usuarios/${userId}`);
    const data = await res.json();
    const profile = data.user;
    const initial = profile.nickname.charAt(0).toUpperCase();

    let html = `<div class="animate-in" style="max-width:900px;margin:0 auto;">`;
    html += `<button class="btn btn-secondary btn-sm mb-4" onclick="navigateTo('ranking')">← Voltar</button>`;
    html += `<div class="card p-6 mb-6 flex gap-6 items-center flex-wrap" style="border-top:4px solid var(--primary);">`;
    if (profile.foto_perfil) {
      html += `<div class="avatar avatar-lg"><img src="${esc(profile.foto_perfil)}" alt="Foto"></div>`;
    } else {
      html += `<div class="avatar avatar-lg gradient-main font-orbitron">${initial}</div>`;
    }
    html += `<div class="flex-1"><h2 class="font-orbitron font-bold" style="font-size:24px;">${esc(profile.nickname)}</h2>`;
    if (profile.descricao_perfil) html += `<p class="text-muted mt-1">${esc(profile.descricao_perfil)}</p>`;
    html += `<div class="flex gap-6 mt-3">`;
    html += `<div class="text-center"><div class="font-orbitron font-black text-accent" style="font-size:20px;">${profile.pontos_usuario}</div><div class="text-xs text-muted uppercase">Pontos</div></div>`;
    html += `<div class="text-center"><div class="font-orbitron font-black text-accent" style="font-size:20px;">${(data.achievements||[]).length}</div><div class="text-xs text-muted uppercase">Achievements</div></div>`;
    html += `<div class="text-center"><div class="font-orbitron font-black text-accent" style="font-size:20px;">${(data.jogos||[]).length}</div><div class="text-xs text-muted uppercase">Jogos</div></div>`;
    html += `</div>`;
    if (currentUser && currentUser.id !== userId) {
      html += `<div class="flex gap-2 mt-4">`;
      html += `<button class="btn btn-gold btn-sm" onclick="addFriendByNick('${esc(profile.nickname)}')">👤 Adicionar Amigo</button>`;
      html += `<button class="btn btn-danger btn-sm" onclick="denunciarUsuario(${userId})">🚨 Denunciar</button>`;
      html += `</div>`;
    }
    html += `</div></div>`;

    // Achievements
    html += `<h3 class="font-orbitron font-bold mb-4" style="font-size:18px;">🏆 Achievements (${(data.achievements||[]).length})</h3>`;
    html += `<div class="grid grid-3 mb-6">`;
    (data.achievements||[]).forEach(a => {
      const db = a.dificuldade === 'facil' ? 'badge-easy' : a.dificuldade === 'medio' ? 'badge-medium' : 'badge-hard';
      const dl = a.dificuldade === 'facil' ? 'Fácil' : a.dificuldade === 'medio' ? 'Médio' : 'Difícil';
      html += `<div class="card p-4"><div class="font-orbitron font-bold text-sm mb-1">🏆 ${esc(a.nome)}</div>`;
      if (a.descricao) html += `<p class="text-muted text-xs mb-2">${esc(a.descricao)}</p>`;
      html += `<div class="flex gap-2"><span class="badge ${db}">${dl}</span><span class="badge badge-points">${a.pontos} pts</span></div></div>`;
    });
    if ((data.achievements||[]).length === 0) html += `<p class="text-muted">Nenhum achievement conquistado</p>`;
    html += `</div>`;

    // Jogos
    html += `<h3 class="font-orbitron font-bold mb-4" style="font-size:18px;">🎮 Jogos Vinculados (${(data.jogos||[]).length})</h3>`;
    html += `<div class="grid grid-3">`;
    (data.jogos||[]).forEach(j => {
      html += `<div class="card" style="overflow:hidden;"><img src="${esc(j.imagem||'/img/logo-icon.png')}" alt="${esc(j.nome)}" style="width:100%;height:112px;object-fit:cover;" onerror="this.src='/img/logo-icon.png'"><div class="p-4"><div class="font-orbitron font-bold text-sm mb-1">${esc(j.nome)}</div><p class="text-muted text-xs">Dev: ${esc(j.desenvolvedor||'')}</p></div></div>`;
    });
    if ((data.jogos||[]).length === 0) html += `<p class="text-muted">Nenhum jogo vinculado</p>`;
    html += `</div></div>`;
    el.innerHTML = html;
  } catch(e) { el.innerHTML = `<div class="text-center p-6 text-muted">Erro ao carregar perfil do usuário</div>`; }
  hideLoading();
}

// =================== ADMIN ===================
async function renderAdmin(el) {
  if (!currentUser || currentUser.tipo !== 'administrador') { el.innerHTML = '<div class="text-center p-6 text-muted">⛔ Acesso negado</div>'; return; }
  showLoading();
  try {
    const [usersRes, jogosRes, achsRes] = await Promise.all([fetch('/api/admin/usuarios'), fetch('/api/jogos'), fetch('/api/achievements')]);
    const users = await usersRes.json();
    const jogos = await jogosRes.json();
    const achs = await achsRes.json();

    let html = `<div class="animate-in" style="max-width:1100px;margin:0 auto;">`;
    html += `<h1 class="font-orbitron font-black mb-6" style="font-size:28px;">🛡️ Painel de Administração</h1>`;
    html += `<div class="tabs"><button class="tab active" id="adm-tab-users" onclick="switchAdmTab('users')">👥 Utilizadores</button><button class="tab" id="adm-tab-jogos" onclick="switchAdmTab('jogos')">🎮 Jogos</button><button class="tab" id="adm-tab-achs" onclick="switchAdmTab('achs')">🏆 Achievements</button><button class="tab" id="adm-tab-denuncias" onclick="switchAdmTab('denuncias')">🚨 Denúncias</button></div>`;

    // Users
    html += `<div id="adm-users" class="card" style="overflow:hidden;"><div class="table-wrap"><table><thead><tr><th>ID</th><th>Nickname</th><th>Email</th><th>Tipo</th><th>Pontos</th><th>Ações</th></tr></thead><tbody>`;
    users.forEach(u => {
      const isSelf = u.id === currentUser.id;
      const banBtn = !isSelf ? `<button class="btn btn-danger btn-sm" onclick="adminBanir(${u.id})">${u.banido?'Desbanir':'Banir'}</button>` : '';
      const promoBtn = !isSelf ? `<button class="btn btn-secondary btn-sm" onclick="adminPromover(${u.id})">${u.tipo==='administrador'?'Rebaixar':'Promover'}</button>` : '';
      html += `<tr><td>${u.id}</td><td class="font-bold">${esc(u.nickname)}</td><td class="text-muted">${esc(u.email)}</td><td><span class="badge ${u.tipo==='administrador'?'badge-points':'badge-easy'}">${u.tipo}</span></td><td>${u.pontos_usuario}</td>`;
      html += `<td><div class="flex gap-1">${banBtn}${promoBtn}</div></td></tr>`;
    });
    html += `</tbody></table></div></div>`;

    // Jogos
    html += `<div id="adm-jogos" class="hidden">`;
    html += `<button class="btn btn-gold btn-sm mb-4" onclick="document.getElementById('admin-add-jogo-form').classList.toggle('hidden')">+ Adicionar Jogo</button>`;
    html += `<div class="card" style="overflow:hidden;"><div class="table-wrap"><table><thead><tr><th>ID</th><th>Nome</th><th>Dev</th><th>Ações</th></tr></thead><tbody>`;
    jogos.forEach(j => {
      html += `<tr><td>${j.id_jogo}</td><td class="font-bold">${esc(j.nome)}</td><td class="text-muted">${esc(j.desenvolvedor||'')}</td><td><button class="btn btn-danger btn-sm" onclick="adminDelJogo(${j.id_jogo})">Eliminar</button></td></tr>`;
    });
    html += `</tbody></table></div></div>`;
    html += `<div id="admin-add-jogo-form" class="hidden card p-5 mt-4">
      <div class="font-orbitron font-bold text-sm mb-3">Novo Jogo</div>
      <div class="grid" style="grid-template-columns:1fr 1fr;gap:12px;">
        <div class="mb-3"><label class="label">Nome *</label><input class="input" id="admin-jogo-nome" placeholder="Nome do jogo"></div>
        <div class="mb-3"><label class="label">Desenvolvedor</label><input class="input" id="admin-jogo-dev" placeholder="Nome do dev"></div>
        <div class="mb-3" style="grid-column:1/-1;"><label class="label">Descrição</label><textarea class="input" id="admin-jogo-desc" rows="2" placeholder="Descrição do jogo"></textarea></div>
        <div class="mb-3" style="grid-column:1/-1;"><label class="label">URL da Imagem</label><input class="input" id="admin-jogo-img" placeholder="/img/nome.jpg"></div>
      </div>
      <div class="form-section-title mt-4">Achievements do Jogo (opcional)</div>
      <div id="admin-ach-rows"></div>
      <button class="btn btn-secondary btn-sm mt-2 mb-4" onclick="addAchRow()">+ Adicionar Achievement</button>
      <br>
      <button class="btn btn-gold btn-sm" onclick="adminAddJogo()">Criar Jogo</button>
    </div>`;
    html += `</div>`;

    // Achievements
    html += `<div id="adm-achs" class="hidden card" style="overflow:hidden;"><div class="table-wrap"><table><thead><tr><th>ID</th><th>Nome</th><th>Dificuldade</th><th>Pontos</th><th>Ações</th></tr></thead><tbody>`;
    achs.forEach(a => {
      const db = a.dificuldade === 'facil' ? 'badge-easy' : a.dificuldade === 'medio' ? 'badge-medium' : 'badge-hard';
      html += `<tr><td>${a.id_achievement}</td><td class="font-bold">${esc(a.nome)}</td><td><span class="badge ${db}">${a.dificuldade}</span></td><td>${a.pontos}</td><td><button class="btn btn-danger btn-sm" onclick="adminDelAch(${a.id_achievement})">Eliminar</button></td></tr>`;
    });
    html += `</tbody></table></div></div>`;

    // Denuncias
    html += `<div id="adm-denuncias" class="hidden"><p class="text-muted text-sm mb-4">Carregando denúncias...</p></div>`;
    html += `</div>`;
    el.innerHTML = html;

    // Load denuncias async
    loadAdminDenuncias();
  } catch(e) { el.innerHTML = `<div class="text-center p-6 text-muted">Erro ao carregar painel admin</div>`; }
  hideLoading();
}

function switchAdmTab(tab) {
  ['users','jogos','achs','denuncias'].forEach(t => {
    document.getElementById(`adm-tab-${t}`).classList.toggle('active', t === tab);
    document.getElementById(`adm-${t}`).classList.toggle('hidden', t !== tab);
  });
}

async function adminBanir(id) { await fetch('/api/admin/banir', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id_usuario:id}) }); navigateTo('admin'); }
async function adminPromover(id) { await fetch('/api/admin/promover', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id_usuario:id}) }); navigateTo('admin'); }
async function adminDelJogo(id) { if (confirm('Eliminar este jogo?')) { await fetch(`/api/admin/jogos/${id}`, { method:'DELETE' }); navigateTo('admin'); } }
async function adminDelAch(id) { if (confirm('Eliminar este achievement?')) { await fetch(`/api/admin/achievements/${id}`, { method:'DELETE' }); navigateTo('admin'); } }

// =================== FRIENDS ===================
function renderFriendsFab() {
  const fab = document.getElementById('friends-fab');
  if (currentUser) {
    fab.classList.remove('hidden');
    loadPendingCount();
  } else {
    fab.classList.add('hidden');
    document.getElementById('friends-panel').classList.add('hidden');
  }
}

async function loadPendingCount() {
  try {
    const res = await fetch('/api/amigos/pendentes');
    const data = await res.json();
    const badge = document.getElementById('fab-badge');
    if (data.length > 0) { badge.textContent = data.length; badge.classList.remove('hidden'); }
    else { badge.classList.add('hidden'); }
  } catch(e) {}
}

function toggleFriends() {
  friendsPanelOpen = !friendsPanelOpen;
  const panel = document.getElementById('friends-panel');
  if (friendsPanelOpen) { panel.classList.remove('hidden'); renderFriendsPanel(); }
  else { panel.classList.add('hidden'); chatWith = null; }
}

async function renderFriendsPanel() {
  const panel = document.getElementById('friends-panel');
  if (chatWith) { renderChat(panel); return; }

  try {
    const [friendsRes, pendingRes] = await Promise.all([fetch('/api/amigos'), fetch('/api/amigos/pendentes')]);
    const friends = await friendsRes.json();
    const pending = await pendingRes.json();
    window._friendsData = { friends, pending };

    let html = `<div style="padding:12px 16px;border-bottom:1px solid var(--border);background:linear-gradient(135deg,rgba(129,140,248,0.1),transparent);">`;
    html += `<div class="flex items-center gap-2"><span class="text-primary">👥</span><span class="font-orbitron font-bold text-sm">Amigos</span><span class="text-xs text-muted" style="margin-left:auto;">${friends.length} amigos</span></div></div>`;

    html += `<div class="flex gap-1" style="padding:12px 12px 8px;"><button class="tab active" id="fr-tab-friends" onclick="switchFrTab('friends')" style="flex:1;font-size:12px;">Amigos</button><button class="tab" id="fr-tab-requests" onclick="switchFrTab('requests')" style="flex:1;font-size:12px;position:relative;">Pedidos${pending.length>0?`<span class="fab-badge" style="position:absolute;top:-4px;right:-2px;">${pending.length}</span>`:''}</button><button class="tab" id="fr-tab-add" onclick="switchFrTab('add')" style="flex:1;font-size:12px;">Adicionar</button></div>`;

    // Friends list
    html += `<div id="fr-friends" style="flex:1;overflow-y:auto;padding:4px 8px;">`;
    friends.forEach(f => {
      const initial = f.nickname.charAt(0).toUpperCase();
      html += `<div style="width:100%;text-align:left;padding:12px;display:flex;align-items:center;gap:12px;border:none;background:none;color:var(--text);cursor:default;border-radius:8px;">`;
      html += `<div class="avatar avatar-sm gradient-main">${initial}</div>`;
      html += `<div class="flex-1"><span class="text-sm font-bold">${esc(f.nickname)}</span></div>`;
      html += `<div class="flex gap-1">`;
      html += `<button onclick="event.stopPropagation();navigateTo('userProfile',${f.id})" style="background:none;border:none;cursor:pointer;font-size:16px;padding:4px;border-radius:6px;transition:all 0.2s;" onmouseover="this.style.background='rgba(129,140,248,0.15)'" onmouseout="this.style.background='none'" title="Ver perfil">👤</button>`;
      html += `<button onclick="event.stopPropagation();startChat(${f.id},'${esc(f.nickname)}')" style="background:none;border:none;cursor:pointer;font-size:16px;padding:4px;border-radius:6px;transition:all 0.2s;" onmouseover="this.style.background='rgba(129,140,248,0.15)'" onmouseout="this.style.background='none'" title="Chat">💬</button>`;
      html += `</div></div>`;
    });
    if (friends.length === 0) html += `<div class="text-center p-6 text-muted text-xs">Nenhum amigo ainda</div>`;
    html += `</div>`;

    // Requests
    html += `<div id="fr-requests" class="hidden" style="flex:1;overflow-y:auto;padding:4px 8px;">`;
    pending.forEach(r => {
      html += `<div class="flex items-center justify-between" style="padding:12px;border-radius:8px;">`;
      html += `<div class="flex items-center gap-3"><div class="avatar avatar-sm gradient-main">${esc(r.nickname.charAt(0).toUpperCase())}</div><div><span class="text-sm font-bold">${esc(r.nickname)}</span><div class="text-xs text-muted">Quer ser seu amigo</div></div></div>`;
      html += `<div class="flex gap-1"><button class="btn btn-sm" style="background:var(--success);color:#fff;padding:4px 8px;" onclick="respondFriend(${r.id_amizade},true)">✓</button><button class="btn btn-danger btn-sm" style="padding:4px 8px;" onclick="respondFriend(${r.id_amizade},false)">✕</button></div></div>`;
    });
    if (pending.length === 0) html += `<div class="text-center p-6 text-muted text-xs">Nenhum pedido pendente</div>`;
    html += `</div>`;

    // Add
    html += `<div id="fr-add" class="hidden" style="flex:1;overflow-y:auto;padding:12px;">`;
    html += `<div style="position:relative;margin-bottom:12px;"><input class="input" id="fr-search" placeholder="Buscar por nickname..." style="padding-left:36px;border-radius:999px;"><span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text-muted);">🔍</span></div>`;
    html += `<div id="fr-search-result"></div></div>`;

    panel.innerHTML = html;

    document.getElementById('fr-search')?.addEventListener('input', function() {
      const v = this.value.trim();
      const r = document.getElementById('fr-search-result');
      if (v) {
        r.innerHTML = `<div style="background:rgba(30,41,59,0.3);border-radius:12px;padding:12px;" class="flex items-center justify-between"><div class="flex items-center gap-3"><div class="avatar avatar-sm gradient-main">${v.charAt(0).toUpperCase()}</div><span class="text-sm font-bold">${esc(v)}</span></div><button class="btn btn-gold btn-sm" onclick="addFriendByNick('${esc(v)}')">Adicionar</button></div>`;
      } else { r.innerHTML = `<div class="text-center p-4 text-muted text-xs">Digite o nickname do jogador</div>`; }
    });
  } catch(e) { panel.innerHTML = `<div class="text-center p-6 text-muted">Erro</div>`; }
}

function switchFrTab(tab) {
  ['friends','requests','add'].forEach(t => {
    const tabBtn = document.getElementById(`fr-tab-${t}`);
    const content = document.getElementById(`fr-${t}`);
    if (tabBtn) tabBtn.classList.toggle('active', t === tab);
    if (content) content.classList.toggle('hidden', t !== tab);
  });
}

async function addFriendByNick(nickname) {
  try {
    const res = await fetch('/api/amigos/enviar', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({nickname}) });
    const data = await res.json();
    if (data.error) { showToast(data.error, 'error'); return; }
    showToast('Pedido de amizade enviado!');
    if (currentPage === 'userProfile' && window._pageData) navigateTo('userProfile', window._pageData);
  } catch(e) { showToast('Erro ao enviar pedido', 'error'); }
}

async function respondFriend(id, aceitar) {
  await fetch('/api/amigos/responder', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id_amizade:id,aceitar}) });
  renderFriendsPanel();
  loadPendingCount();
}

async function startChat(userId, nickname) {
  chatWith = { id: userId, nickname };
  chatMessages = [];
  try {
    const res = await fetch(`/api/mensagens/${userId}`);
    chatMessages = await res.json();
  } catch(e) {}
  renderChat(document.getElementById('friends-panel'));
}

function renderChat(panel) {
  const initial = chatWith.nickname.charAt(0).toUpperCase();
  let html = `<div style="height:440px;display:flex;flex-direction:column;">`;
  html += `<div class="flex items-center gap-3" style="padding:12px 16px;border-bottom:1px solid var(--border);background:linear-gradient(135deg,rgba(129,140,248,0.1),transparent);">`;
  html += `<button onclick="chatWith=null;renderFriendsPanel();" style="background:none;border:none;color:var(--text-muted);cursor:pointer;">◀</button>`;
  html += `<div class="avatar avatar-sm gradient-main">${initial}</div>`;
  html += `<span class="font-bold text-sm">${esc(chatWith.nickname)}</span></div>`;

  html += `<div style="flex:1;overflow-y:auto;padding:12px;" id="chat-msgs">`;
  if (chatMessages.length === 0) html += `<div class="text-center p-6 text-muted text-xs">Inicie a conversa!</div>`;
  chatMessages.forEach(m => {
    const isMe = m.id_remetente === currentUser.id;
    const time = m.created_at ? new Date(m.created_at).toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'}) : '';
    html += `<div style="display:flex;${isMe?'justify-content:flex-end':'justify-content:flex-start'};margin-bottom:8px;">`;
    html += `<div style="max-width:75%;">`;
    html += `<div style="padding:8px 12px;border-radius:16px;font-size:12px;line-height:1.5;box-shadow:0 1px 4px rgba(0,0,0,0.15);${isMe?'background:linear-gradient(135deg,#818cf8,#a78bfa);color:#fff;border-bottom-right-radius:4px;':'background:var(--bg-input);border-bottom-left-radius:4px;'}">${esc(m.texto)}</div>`;
    html += `<div style="font-size:9px;color:var(--text-muted);margin-top:2px;${isMe?'text-align:right;':'text-align:left;'}">${time}</div>`;
    html += `</div></div>`;
  });
  html += `</div>`;

  html += `<div class="flex gap-2" style="padding:12px;border-top:1px solid var(--border);background:rgba(10,14,26,0.5);">`;
  html += `<input class="input" id="chat-input" placeholder="Digite uma mensagem..." style="border-radius:999px;" onkeydown="if(event.key==='Enter')sendChatMsg()">`;
  html += `<button onclick="sendChatMsg()" class="gradient-main" style="width:32px;height:32px;border-radius:50%;border:none;color:#fff;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;">➤</button></div></div>`;
  panel.innerHTML = html;

  const msgs = document.getElementById('chat-msgs');
  if (msgs) msgs.scrollTop = msgs.scrollHeight;
}

async function sendChatMsg() {
  const input = document.getElementById('chat-input');
  const texto = input.value.trim();
  if (!texto || !chatWith) return;
  input.value = '';
  try {
    await fetch('/api/mensagens', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id_destinatario:chatWith.id,texto}) });
    const res = await fetch(`/api/mensagens/${chatWith.id}`);
    chatMessages = await res.json();
    renderChat(document.getElementById('friends-panel'));
  } catch(e) {}
}

// =================== ACHIEVEMENT REIVINDICACAO ===================

let _reivindicarAchId = null;
let _reivindicarAchNome = '';

function reivindicarAchievement(idAch, jogoNome) {
  _reivindicarAchId = idAch;
  _reivindicarAchNome = jogoNome;
  const modal = document.getElementById('auth-modal');
  modal.classList.remove('hidden');
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeReivindicarModal()">
      <div class="modal" onclick="event.stopPropagation()">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-orbitron font-bold" style="font-size:18px;">🎬 Reivindicar Achievement</h2>
          <button onclick="closeReivindicarModal()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:20px;">✕</button>
        </div>
        <div id="reivindicar-alert"></div>
        <p class="text-muted text-sm mb-3">Jogo: <span class="text-primary font-bold">${esc(jogoNome)}</span></p>
        <div class="mb-4"><label class="label">URL do vídeo de comprovação *</label><input class="input" type="url" id="reivindicar-video-url" placeholder="https://youtube.com/watch?v=..."></div>
        <div class="flex gap-2">
          <button class="btn btn-secondary" onclick="closeReivindicarModal()">Cancelar</button>
          <button class="btn btn-primary" onclick="enviarReivindicacao()">Enviar Reivindicação</button>
        </div>
      </div>
    </div>
  `;
}

function closeReivindicarModal() {
  document.getElementById('auth-modal').classList.add('hidden');
  _reivindicarAchId = null;
  _reivindicarAchNome = '';
}

async function enviarReivindicacao() {
  const video_url = document.getElementById('reivindicar-video-url').value.trim();
  if (!video_url) {
    document.getElementById('reivindicar-alert').innerHTML = '<div class="alert alert-error">O vídeo de comprovação é obrigatório</div>';
    return;
  }
  try {
    const res = await fetch('/api/achievements/reivindicar', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ id_achievement: _reivindicarAchId, video_url }) });
    const data = await res.json();
    if (data.error) { document.getElementById('reivindicar-alert').innerHTML = `<div class="alert alert-error">${esc(data.error)}</div>`; return; }
    closeReivindicarModal();
    showToast('Reivindicacao enviada! Aguarde a aprovacao de um administrador.');
    // Refresh current page to update UI
    if (currentPage === 'jogoDetail' && window._pageData) navigateTo('jogoDetail', window._pageData);
    else if (currentPage === 'achievements') navigateTo('achievements');
  } catch(e) { showToast('Erro ao enviar reivindicacao', 'error'); }
}

// =================== ACHIEVEMENT RANKING PAGE ===================

async function renderAchievementRanking(el) {
  const achId = window._pageData;
  showLoading();
  try {
    const res = await fetch(`/api/achievements/ranking/${achId}`);
    const data = await res.json();
    const a = data.achievement;

    let html = `<div class="animate-in" style="max-width:900px;margin:0 auto;">`;
    html += `<button class="btn btn-secondary btn-sm mb-4" onclick="navigateTo('achievements')">← Voltar aos Achievements</button>`;
    html += `<div class="card p-6 mb-6" style="border-top:3px solid var(--primary);">`;
    html += `<h2 class="font-orbitron font-black mb-2" style="font-size:22px;">🏆 ${esc(a.nome)}</h2>`;
    if (a.descricao) html += `<p class="text-muted text-sm mb-2">${esc(a.descricao)}</p>`;
    const db = a.dificuldade === 'facil' ? 'badge-easy' : a.dificuldade === 'medio' ? 'badge-medium' : 'badge-hard';
    const dl = a.dificuldade === 'facil' ? 'Facil' : a.dificuldade === 'medio' ? 'Medio' : 'Dificil';
    html += `<div class="flex gap-2"><span class="badge ${db}">${dl}</span><span class="badge badge-points">${a.pontos} pts</span><span class="badge badge-info">🎮 ${esc(a.jogo_nome||'Geral')}</span></div>`;
    html += `<div class="mt-3"><span class="badge badge-easy" style="padding:8px 14px;font-size:13px;">✅ ${data.totalConquistadores} jogadores conquistaram</span></div>`;
    html += `</div>`;

    // Ranking
    html += `<h3 class="font-orbitron font-bold mb-4" style="font-size:20px;">🏅 Ranking - Quem Conquistou Primeiro</h3>`;
    if (data.ranking.length > 0) {
      html += `<div class="card" style="overflow:hidden;"><div class="table-wrap"><table><thead><tr><th>#</th><th>Jogador</th><th>Data da Conquista</th></tr></thead><tbody>`;
      data.ranking.forEach((r, i) => {
        const rc = i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : '';
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i+1);
        html += `<tr><td class="font-orbitron font-black ${rc}" style="font-size:18px;">${medal}</td><td class="font-bold text-sm">${esc(r.nickname)}</td><td class="text-muted text-sm">${formatDate(r.data_conquista)}</td></tr>`;
      });
      html += `</tbody></table></div></div>`;
    } else {
      html += `<div class="text-center p-6 text-muted">Nenhum jogador conquistou ainda</div>`;
    }

    // Pending claims (admin only)
    const pendentesVisible = currentUser && currentUser.tipo === 'administrador';
    if (pendentesVisible) {
      html += `<h3 class="font-orbitron font-bold mb-4 mt-6" style="font-size:20px;">📋 Reivindicacoes Pendentes (${data.pendentes.length})</h3>`;
      if (data.pendentes.length > 0) {
        data.pendentes.forEach(r => {
          const claimId = r.id_usuario + '_' + r.id_achievement;
          html += `<div class="card p-4 mb-2 flex items-center justify-between"><div class="flex items-center gap-3"><div class="avatar avatar-sm gradient-main">${esc(r.nickname.charAt(0).toUpperCase())}</div><div><span class="font-bold text-sm">${esc(r.nickname)}</span><div class="text-xs text-muted">${formatDate(r.data_conquista)}${r.video_url ? ' • 🎬 Video enviado' : ''}</div></div></div><div class="flex gap-1"><button class="btn btn-sm" style="background:var(--success);color:#fff;padding:4px 8px;" onclick="adminReivindicar('${claimId}','aprovar')">✓</button><button class="btn btn-danger btn-sm" style="padding:4px 8px;" onclick="adminReivindicar('${claimId}','rejeitar')">✕</button></div></div>`;
        });
      } else {
        html += `<div class="text-center p-6 text-muted">Nenhuma reivindicacao pendente</div>`;
      }
    }

    html += `</div>`;
    el.innerHTML = html;
  } catch(e) { el.innerHTML = `<div class="text-center p-6 text-muted">Erro ao carregar ranking</div>`; }
  hideLoading();
}

async function adminReivindicar(id, acao) {
  try {
    const res = await fetch(`/api/admin/reivindicacoes/${id}`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ acao }) });
    const data = await res.json();
    if (data.error) { showToast(data.error, 'error'); return; }
    showToast(acao === 'aprovar' ? 'Reivindicacao aprovada!' : 'Reivindicacao rejeitada.');
    navigateTo('achievementRanking', window._pageData);
  } catch(e) { showToast('Erro ao processar reivindicacao', 'error'); }
}

// =================== ADMIN ADD JOGO/ACH ===================

async function adminAddJogo() {
  const nome = document.getElementById('admin-jogo-nome').value.trim();
  if (!nome) { showToast('Nome obrigatório', 'error'); return; }
  // Collect achievements
  const achievements = [];
  const rows = document.querySelectorAll('.admin-ach-row');
  rows.forEach(row => {
    const achNome = row.querySelector('.ach-row-nome')?.value.trim();
    if (achNome) {
      achievements.push({
        nome: achNome,
        descricao: row.querySelector('.ach-row-desc')?.value.trim() || '',
        dificuldade: row.querySelector('.ach-row-dif')?.value || 'medio',
        pontos: parseInt(row.querySelector('.ach-row-pontos')?.value) || 30
      });
    }
  });
  try {
    const res = await fetch('/api/admin/jogos', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({
      nome, desenvolvedor: document.getElementById('admin-jogo-dev').value.trim(),
      descricao: document.getElementById('admin-jogo-desc').value.trim(),
      imagem: document.getElementById('admin-jogo-img').value.trim(),
      achievements
    })});
    const data = await res.json();
    if (data.error) { showToast(data.error, 'error'); return; }
    showToast('Jogo criado com sucesso!');
    navigateTo('admin');
  } catch(e) { showToast('Erro ao criar jogo', 'error'); }
}

let _achRowCounter = 0;
function addAchRow() {
  _achRowCounter++;
  const container = document.getElementById('admin-ach-rows');
  if (!container) return;
  const id = _achRowCounter;
  const div = document.createElement('div');
  div.className = 'admin-ach-row card p-4 mb-2';
  div.id = `ach-row-${id}`;
  div.innerHTML = `
    <div class="flex items-center justify-between mb-2">
      <span class="text-xs text-muted font-bold">Achievement #${id}</span>
      <button class="btn btn-danger btn-sm" style="padding:2px 8px;font-size:11px;" onclick="removeAchRow(${id})">✕ Remover</button>
    </div>
    <div class="grid" style="grid-template-columns:1fr 1fr;gap:8px;">
      <div class="mb-2"><label class="label">Nome *</label><input class="input ach-row-nome" placeholder="Nome do achievement"></div>
      <div class="mb-2"><label class="label">Dificuldade</label><select class="input ach-row-dif"><option value="facil">Fácil</option><option value="medio">Médio</option><option value="dificil">Difícil</option></select></div>
      <div class="mb-2"><label class="label">Pontos</label><input class="input ach-row-pontos" type="number" min="1" value="30"></div>
      <div class="mb-2"><label class="label">Descrição</label><input class="input ach-row-desc" placeholder="Descrição"></div>
    </div>
  `;
  container.appendChild(div);
}

function removeAchRow(id) {
  const row = document.getElementById(`ach-row-${id}`);
  if (row) row.remove();
}

// =================== DENUNCIAS ===================

function denunciarUsuario(idDenunciado) {
  const modal = document.getElementById('auth-modal');
  modal.classList.remove('hidden');
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeDenunciaModal()">
      <div class="modal" onclick="event.stopPropagation()">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-orbitron font-bold" style="font-size:18px;">🚨 Denunciar Usuário</h2>
          <button onclick="closeDenunciaModal()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:20px;">✕</button>
        </div>
        <div id="denuncia-alert"></div>
        <div class="mb-3"><label class="label">Motivo *</label><select class="input" id="denuncia-motivo">
          <option value="">Selecione um motivo...</option>
          <option value="Comportamento Tóxico">Comportamento Tóxico</option>
          <option value="Cheating/Hack">Cheating/Hack</option>
          <option value="Spam">Spam</option>
          <option value="Assédio">Assédio</option>
          <option value="Conteúdo Inapropriado">Conteúdo Inapropriado</option>
          <option value="Outro">Outro</option>
        </select></div>
        <div class="mb-4"><label class="label">Descrição</label><textarea class="input" id="denuncia-desc" rows="3" placeholder="Descreva o problema..."></textarea></div>
        <div class="flex gap-2">
          <button class="btn btn-secondary" onclick="closeDenunciaModal()">Cancelar</button>
          <button class="btn btn-danger" onclick="enviarDenuncia(${idDenunciado})">Enviar Denúncia</button>
        </div>
      </div>
    </div>
  `;
}

function closeDenunciaModal() {
  document.getElementById('auth-modal').classList.add('hidden');
}

async function enviarDenuncia(idDenunciado) {
  const motivo = document.getElementById('denuncia-motivo').value;
  const descricao = document.getElementById('denuncia-desc').value.trim();
  if (!motivo) {
    document.getElementById('denuncia-alert').innerHTML = '<div class="alert alert-error">Selecione um motivo</div>';
    return;
  }
  try {
    const res = await fetch('/api/denunciar', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ id_denunciado: idDenunciado, motivo, descricao }) });
    const data = await res.json();
    if (data.error) { document.getElementById('denuncia-alert').innerHTML = `<div class="alert alert-error">${esc(data.error)}</div>`; return; }
    closeDenunciaModal();
    showToast('Denúncia enviada com sucesso!');
  } catch(e) { showToast('Erro ao enviar denúncia', 'error'); }
}

async function loadAdminDenuncias() {
  const container = document.getElementById('adm-denuncias');
  if (!container) return;
  try {
    const res = await fetch('/api/admin/denuncias');
    const denuncias = await res.json();
    if (denuncias.error) { container.innerHTML = `<p class="text-muted">Erro ao carregar</p>`; return; }
    if (denuncias.length === 0) {
      container.innerHTML = `<div class="card p-6 text-center text-muted">Nenhuma denúncia registrada</div>`;
      return;
    }
    let html = '';
    denuncias.forEach(d => {
      const estadoBadge = d.estado === 'pendente' ? 'badge-medium' : d.estado === 'resolvida' ? 'badge-easy' : 'badge-hard';
      const estadoText = d.estado === 'pendente' ? '⏳ Pendente' : d.estado === 'resolvida' ? '✅ Resolvida' : '❌ Rejeitada';
      html += `<div class="card p-4 mb-3" style="border-left:4px solid ${d.estado==='pendente'?'var(--accent)':d.estado==='resolvida'?'var(--success)':'var(--danger)'};">`;
      html += `<div class="flex items-center justify-between mb-2">`;
      html += `<div><span class="font-bold text-sm">🚨 ${esc(d.motivo)}</span> <span class="badge ${estadoBadge}">${estadoText}</span></div>`;
      html += `<span class="text-xs text-muted">${formatDate(d.created_at)}</span>`;
      html += `</div>`;
      html += `<p class="text-xs text-muted mb-1">Denunciante: <span class="text-primary font-bold">${esc(d.denunciante_nick)}</span> → Denunciado: <span class="text-danger font-bold">${esc(d.denunciado_nick)}</span></p>`;
      if (d.descricao) html += `<p class="text-sm text-muted mb-2">${esc(d.descricao)}</p>`;
      if (d.estado === 'pendente') {
        html += `<div class="flex gap-2 mt-2">`;
        html += `<button class="btn btn-sm" style="background:var(--success);color:#fff;padding:4px 12px;" onclick="adminResolverDenuncia(${d.id},'resolver')">✅ Resolver</button>`;
        html += `<button class="btn btn-danger btn-sm" style="padding:4px 12px;" onclick="adminResolverDenuncia(${d.id},'rejeitar')">❌ Rejeitar</button>`;
        html += `</div>`;
      }
      html += `</div>`;
    });
    container.innerHTML = html;
  } catch(e) { container.innerHTML = `<p class="text-muted">Erro ao carregar denúncias</p>`; }
}

async function adminResolverDenuncia(id, acao) {
  try {
    const res = await fetch(`/api/admin/denuncias/${id}`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ acao }) });
    const data = await res.json();
    if (data.error) { showToast(data.error, 'error'); return; }
    showToast(acao === 'resolver' ? 'Denúncia resolvida!' : 'Denúncia rejeitada.');
    loadAdminDenuncias();
  } catch(e) { showToast('Erro ao processar denúncia', 'error'); }
}

// =================== LOADING ===================
function showLoading() {
  let loader = document.getElementById('global-loader');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'global-loader';
    loader.innerHTML = `<div class="spinner"></div>`;
    document.body.appendChild(loader);
  }
  loader.classList.remove('hidden');
}
function hideLoading() {
  const loader = document.getElementById('global-loader');
  if (loader) loader.classList.add('hidden');
}

// =================== UTILS ===================
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const adjusted = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
  return adjusted.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : timeStr;
}

function showToast(msg, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function esc(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// =================== START ===================
init();
