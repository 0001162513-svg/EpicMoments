const path = require('path');

// Carrega .env ANTES de qualquer outro require
const dotenvPath = path.resolve(__dirname, '.env');
const fs = require('fs');
if (fs.existsSync(dotenvPath)) {
  require('dotenv').config({ path: dotenvPath });
  console.log('[.env] Arquivo .env carregado com sucesso de:', dotenvPath);
} else {
  console.log('[.env] AVISO: Arquivo .env NAO encontrado em:', dotenvPath);
}

const express = require('express');
const mysql = require('mysql2/promise');
const session = require('express-session');
const multer = require('multer');

const app = express();
const PORT = 3000;

// Configuracao do multer para upload de fotos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'public', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'epicmoments-secret-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Pool de conexao MySQL
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'root',
  database: process.env.DB_NAME || 'epicmoments',
  waitForConnections: true,
  connectionLimit: 10,
};

console.log('[DB] Configuracao do banco:');
console.log('  Host:', dbConfig.host);
console.log('  User:', dbConfig.user);
console.log('  Password:', dbConfig.password ? '***(' + dbConfig.password.length + ' chars)***' : '(VAZIA)');
console.log('  Database:', dbConfig.database);

// Testa conexao com o banco
async function testarConexao() {
  const mysql = require('mysql2/promise');
  try {
    const conn = await mysql.createConnection(dbConfig);
    console.log('[DB] Conexao com MySQL OK!');
    await conn.end();
  } catch (err) {
    console.log('[DB] ERRO de conexao:', err.message);
    console.log('');
    console.log('=== TENTATIVA SEM SENHA ===');
    try {
      const conn2 = await mysql.createConnection({
        host: dbConfig.host,
        user: dbConfig.user,
        password: '',
        database: dbConfig.database,
      });
      console.log('[DB] Conexao SEM senha funcionou!');
      console.log('   >>> Mude DB_PASS=  (vazio) no .env <<<');
      await conn2.end();
    } catch (err2) {
      console.log('[DB] ERRO sem senha tambem:', err2.message);
      console.log('');
      console.log('SOLUCAO: Abra o MySQL Workbench e execute:');
      console.log('  ALTER USER "root"@"localhost" IDENTIFIED BY "root";');
      console.log('  FLUSH PRIVILEGES;');
      console.log('');
      console.log('Ou se a senha for vazia, execute:');
      console.log('  ALTER USER "root"@"localhost" IDENTIFIED BY "";');
      console.log('  FLUSH PRIVILEGES;');
    }
  }
}
testarConexao();

const pool = mysql.createPool(dbConfig);

// =================== AUTH ===================

app.post('/api/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    const [rows] = await pool.query('SELECT * FROM usuario WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(404).json({ error: 'email_not_found', message: 'E-mail nao cadastrado. Deseja criar uma conta?' });
    const user = rows[0];
    if (user.banido) return res.status(403).json({ error: 'Usuario banido' });
    if (user.senha !== senha) return res.status(401).json({ error: 'wrong_password', message: 'Senha incorreta' });
    req.session.userId = user.id_usuario;
    res.json({ user: { id: user.id_usuario, nome: user.nome, nickname: user.nickname, email: user.email, descricao_perfil: user.descricao_perfil, foto_perfil: user.foto_perfil, cor_banner: user.cor_banner, pontos_usuario: user.pontos_usuario, tipo: user.tipo, banido: user.banido } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/register', async (req, res) => {
  try {
    const { nome, nickname, email, senha, cpf, dataNascimento, genero, aceitouTermos } = req.body;
    if (!aceitouTermos) return res.status(400).json({ error: 'Voce deve aceitar o Codigo de Conduta' });
    if (!nome || !nickname || !email || !senha) return res.status(400).json({ error: 'Preencha todos os campos obrigatorios' });
    if (senha.length < 4) return res.status(400).json({ error: 'Senha deve ter no minimo 4 caracteres' });
    if (!/[A-Z]/.test(senha)) return res.status(400).json({ error: 'Senha deve conter ao menos uma letra maiuscula' });

    const [existing] = await pool.query('SELECT id_usuario FROM usuario WHERE email = ? OR nickname = ?', [email, nickname]);
    if (existing.length > 0) return res.status(400).json({ error: 'E-mail ou nickname ja cadastrado' });

    const [result] = await pool.query(
      'INSERT INTO usuario (nome, nickname, email, senha, cpf, data_nascimento, genero, aceitou_termos) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
      [nome, nickname, email, senha, cpf || null, dataNascimento || null, genero || 'M']
    );
    const userId = result.insertId;
    req.session.userId = userId;
    res.json({ user: { id: userId, nome, nickname, email, descricao_perfil: null, foto_perfil: null, cor_banner: '#6366f1', pontos_usuario: 0, tipo: 'usuario', banido: false } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ ok: true });
});

app.get('/api/me', async (req, res) => {
  if (!req.session.userId) return res.json({ user: null });
  try {
    const [rows] = await pool.query('SELECT * FROM usuario WHERE id_usuario = ?', [req.session.userId]);
    if (rows.length === 0) return res.json({ user: null });
    const u = rows[0];
    res.json({ user: { id: u.id_usuario, nome: u.nome, nickname: u.nickname, email: u.email, descricao_perfil: u.descricao_perfil, foto_perfil: u.foto_perfil, cor_banner: u.cor_banner, pontos_usuario: u.pontos_usuario, tipo: u.tipo, banido: u.banido } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// =================== PERFIL ===================

app.put('/api/perfil', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Nao autenticado' });
  try {
    const { descricao_perfil, email, cor_banner, senha } = req.body;
    let query = 'UPDATE usuario SET descricao_perfil=?, email=?, cor_banner=?';
    let params = [descricao_perfil, email, cor_banner];
    if (senha && senha.length >= 4) { query += ', senha=?'; params.push(senha); }
    query += ' WHERE id_usuario=?';
    params.push(req.session.userId);
    await pool.query(query, params);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/perfil/foto', upload.single('foto'), async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Nao autenticado' });
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  try {
    const fotoUrl = '/uploads/' + req.file.filename;
    await pool.query('UPDATE usuario SET foto_perfil=? WHERE id_usuario=?', [fotoUrl, req.session.userId]);
    res.json({ foto_perfil: fotoUrl });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// =================== JOGOS ===================

app.get('/api/jogos', async (req, res) => {
  try {
    const [jogos] = await pool.query(`
      SELECT j.*, 
        (SELECT COUNT(*) FROM usuario_jogo uj WHERE uj.id_jogo = j.id_jogo) as totalJogadores,
        (SELECT COUNT(*) FROM achievement a WHERE a.id_jogo = j.id_jogo) as totalAchievements
      FROM jogo j ORDER BY j.nome
    `);
    res.json(jogos);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/jogos/vincular', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Nao autenticado' });
  try {
    await pool.query('INSERT IGNORE INTO usuario_jogo (id_usuario, id_jogo) VALUES (?, ?)', [req.session.userId, req.body.id_jogo]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// =================== ACHIEVEMENTS ===================

app.get('/api/achievements', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT a.*, j.nome as jogo_nome FROM achievement a LEFT JOIN jogo j ON a.id_jogo = j.id_jogo ORDER BY a.nome');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// =================== RANKING ===================

app.get('/api/ranking', async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id_usuario as id, nickname, pontos_usuario, foto_perfil FROM usuario WHERE tipo='usuario' AND banido=0 ORDER BY pontos_usuario DESC");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/ranking/amigos', async (req, res) => {
  if (!req.session.userId) return res.json([]);
  try {
    const [rows] = await pool.query(`
      SELECT u.id_usuario as id, u.nickname, u.pontos_usuario, u.foto_perfil FROM usuario u
      WHERE u.id_usuario = ? OR u.id_usuario IN (
        SELECT CASE WHEN id_usuario1 = ? THEN id_usuario2 ELSE id_usuario1 END
        FROM amizade WHERE (id_usuario1 = ? OR id_usuario2 = ?) AND estado = 'aceita'
      )
      ORDER BY u.pontos_usuario DESC
    `, [req.session.userId, req.session.userId, req.session.userId, req.session.userId]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// =================== AMIGOS ===================

app.get('/api/amigos', async (req, res) => {
  if (!req.session.userId) return res.json([]);
  try {
    const [rows] = await pool.query(`
      SELECT u.id_usuario as id, u.nickname, u.foto_perfil FROM usuario u
      INNER JOIN amizade a ON (a.id_usuario1 = u.id_usuario OR a.id_usuario2 = u.id_usuario)
      WHERE ((a.id_usuario1 = ? OR a.id_usuario2 = ?) AND a.estado = 'aceita')
      AND u.id_usuario != ?
    `, [req.session.userId, req.session.userId, req.session.userId]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/amigos/pendentes', async (req, res) => {
  if (!req.session.userId) return res.json([]);
  try {
    const [rows] = await pool.query(`
      SELECT a.id_amizade, u.id_usuario as id, u.nickname FROM usuario u
      INNER JOIN amizade a ON a.id_usuario1 = u.id_usuario
      WHERE a.id_usuario2 = ? AND a.estado = 'pendente'
    `, [req.session.userId]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/amigos/enviar', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Nao autenticado' });
  try {
    const [user] = await pool.query('SELECT id_usuario FROM usuario WHERE nickname = ?', [req.body.nickname]);
    if (user.length === 0) return res.status(404).json({ error: 'Usuario nao encontrado' });
    const targetId = user[0].id_usuario;
    if (targetId === req.session.userId) return res.status(400).json({ error: 'Voce nao pode adicionar a si mesmo' });
    await pool.query('INSERT IGNORE INTO amizade (id_usuario1, id_usuario2, estado) VALUES (?, ?, "pendente")', [req.session.userId, targetId]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/amigos/responder', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Nao autenticado' });
  try {
    const { id_amizade, aceitar } = req.body;
    const estado = aceitar ? 'aceita' : 'recusada';
    await pool.query('UPDATE amizade SET estado = ? WHERE id_amizade = ? AND id_usuario2 = ?', [estado, id_amizade, req.session.userId]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// =================== MENSAGENS ===================

app.get('/api/mensagens/:userId', async (req, res) => {
  if (!req.session.userId) return res.json([]);
  try {
    const [rows] = await pool.query(`
      SELECT m.*, u.nickname as remetente_nome FROM mensagem m
      INNER JOIN usuario u ON m.id_remetente = u.id_usuario
      WHERE (m.id_remetente = ? AND m.id_destinatario = ?) OR (m.id_remetente = ? AND m.id_destinatario = ?)
      ORDER BY m.created_at ASC LIMIT 50
    `, [req.session.userId, req.params.userId, req.params.userId, req.session.userId]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/mensagens', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Nao autenticado' });
  try {
    await pool.query('INSERT INTO mensagem (id_remetente, id_destinatario, texto) VALUES (?, ?, ?)', [req.session.userId, req.body.id_destinatario, req.body.texto]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// =================== COMUNIDADES ===================

app.get('/api/comunidades', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.*, u.nickname as criador_nome,
        (SELECT COUNT(*) FROM comunidade_membro cm WHERE cm.id_comunidade = c.id_comunidade AND cm.estado = 'aceito') as totalMembros
      FROM comunidade c INNER JOIN usuario u ON c.id_criador = u.id_usuario ORDER BY c.nome
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/comunidades/:id', async (req, res) => {
  try {
    const [com] = await pool.query('SELECT c.*, u.nickname as criador_nome FROM comunidade c INNER JOIN usuario u ON c.id_criador = u.id_usuario WHERE c.id_comunidade = ?', [req.params.id]);
    if (com.length === 0) return res.status(404).json({ error: 'Comunidade nao encontrada' });
    const [membros] = await pool.query(`
      SELECT cm.*, u.nickname, u.pontos_usuario FROM comunidade_membro cm
      INNER JOIN usuario u ON cm.id_usuario = u.id_usuario WHERE cm.id_comunidade = ? AND cm.estado = 'aceito'
    `, [req.params.id]);
    const [topicos] = await pool.query(`
      SELECT t.*, u.nickname as autor_nome FROM topico t
      INNER JOIN usuario u ON t.id_autor = u.id_usuario WHERE t.id_comunidade = ? ORDER BY t.created_at DESC
    `, [req.params.id]);
    for (let t of topicos) {
      const [respostas] = await pool.query(`
        SELECT r.*, u.nickname as autor_nome FROM resposta r
        INNER JOIN usuario u ON r.id_autor = u.id_usuario WHERE r.id_topico = ? ORDER BY r.created_at ASC
      `, [t.id_topico]);
      t.respostas = respostas;
    }
    // Check current user membership status
    let meuEstado = null;
    if (req.session.userId) {
      const [meuMembro] = await pool.query(
        'SELECT estado, papel FROM comunidade_membro WHERE id_comunidade = ? AND id_usuario = ?',
        [req.params.id, req.session.userId]
      );
      if (meuMembro.length > 0) meuEstado = { estado: meuMembro[0].estado, papel: meuMembro[0].papel };
    }
    res.json({ comunidade: com[0], membros, topicos, meuEstado });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/comunidades', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Nao autenticado' });
  try {
    const { nome, descricao } = req.body;
    const [result] = await pool.query('INSERT INTO comunidade (nome, descricao, id_criador) VALUES (?, ?, ?)', [nome, descricao, req.session.userId]);
    const comId = result.insertId;
    await pool.query('INSERT INTO comunidade_membro (id_comunidade, id_usuario, papel, estado) VALUES (?, ?, "criador", "aceito")', [comId, req.session.userId]);
    res.json({ id: comId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/comunidades/:id/pedir-entrada', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Nao autenticado' });
  try {
    await pool.query('INSERT IGNORE INTO comunidade_membro (id_comunidade, id_usuario, papel, estado) VALUES (?, ?, "membro", "pendente")', [req.params.id, req.session.userId]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/topicos', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Nao autenticado' });
  try {
    const { id_comunidade, titulo, conteudo } = req.body;
    await pool.query('INSERT INTO topico (id_comunidade, titulo, conteudo, id_autor) VALUES (?, ?, ?, ?)', [id_comunidade, titulo, conteudo, req.session.userId]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/respostas', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Nao autenticado' });
  try {
    const { id_topico, texto } = req.body;
    await pool.query('INSERT INTO resposta (id_topico, id_autor, texto) VALUES (?, ?, ?)', [id_topico, req.session.userId, texto]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// =================== ENQUETES ===================

app.get('/api/enquetes', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT e.*, j.nome as jogo_nome,
        (SELECT COUNT(*) FROM enquete_voto ev WHERE ev.id_enquete = e.id_enquete AND ev.voto = 'aprovar') as votos_aprovar,
        (SELECT COUNT(*) FROM enquete_voto ev WHERE ev.id_enquete = e.id_enquete AND ev.voto = 'rejeitar') as votos_rejeitar,
        (SELECT COUNT(*) FROM enquete_voto ev WHERE ev.id_enquete = e.id_enquete) as total_votos
      FROM enquete e LEFT JOIN jogo j ON e.id_jogo = j.id_jogo ORDER BY e.data_fim DESC
    `);
    rows.forEach(r => {
      r.percentual = r.total_votos > 0 ? Math.round((r.votos_aprovar / r.total_votos) * 100) : 0;
    });
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/enquetes/meus-votos', async (req, res) => {
  if (!req.session.userId) return res.json([]);
  try {
    const [rows] = await pool.query('SELECT id_enquete FROM enquete_voto WHERE id_usuario = ?', [req.session.userId]);
    res.json(rows.map(r => r.id_enquete));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/enquetes', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Nao autenticado' });
  try {
    const { nome_achievement, descricao, dificuldade, pontos, id_jogo, data_inicio, data_fim } = req.body;
    await pool.query(
      'INSERT INTO enquete (nome_achievement, descricao, dificuldade, pontos, id_jogo, id_criador, data_inicio, data_fim) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [nome_achievement, descricao, dificuldade, pontos, id_jogo, req.session.userId, data_inicio, data_fim]
    );
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/enquetes/:id/votar', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Nao autenticado' });
  try {
    await pool.query('INSERT IGNORE INTO enquete_voto (id_enquete, id_usuario, voto) VALUES (?, ?, ?)', [req.params.id, req.session.userId, req.body.voto]);
    // Check if approved (70%+ with 3+ votes)
    const [stats] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM enquete_voto WHERE id_enquete = ? AND voto = 'aprovar') as aprovar,
        (SELECT COUNT(*) FROM enquete_voto WHERE id_enquete = ?) as total
    `, [req.params.id, req.params.id]);
    const s = stats[0];
    if (s.total >= 3 && (s.aprovar / s.total) >= 0.7) {
      const [enq] = await pool.query('SELECT * FROM enquete WHERE id_enquete = ?', [req.params.id]);
      if (enq.length > 0) {
        const e = enq[0];
        const [existing] = await pool.query('SELECT * FROM achievement WHERE nome = ? AND id_jogo = ?', [e.nome_achievement, e.id_jogo]);
        if (existing.length === 0) {
          await pool.query('INSERT INTO achievement (nome, descricao, dificuldade, pontos, id_jogo) VALUES (?, ?, ?, ?, ?)',
            [e.nome_achievement, e.descricao, e.dificuldade, e.pontos, e.id_jogo]);
        }
      }
    }
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// =================== TORNEIOS ===================

app.get('/api/torneios', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT t.*, j.nome as jogo_nome, a.nome as achievement_nome,
        (SELECT COUNT(*) FROM torneio_inscricao ti WHERE ti.id_torneio = t.id_torneio) as inscritos
      FROM torneio t LEFT JOIN jogo j ON t.id_jogo = j.id_jogo LEFT JOIN achievement a ON t.id_achievement = a.id_achievement
      ORDER BY t.data_inicio DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/torneios/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT t.*, j.nome as jogo_nome, a.nome as achievement_nome
      FROM torneio t LEFT JOIN jogo j ON t.id_jogo = j.id_jogo LEFT JOIN achievement a ON t.id_achievement = a.id_achievement
      WHERE t.id_torneio = ?
    `, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Torneio nao encontrado' });
    const [mural] = await pool.query(`
      SELECT tm.*, u.nickname as autor_nome FROM torneio_mural tm
      INNER JOIN usuario u ON tm.id_autor = u.id_usuario WHERE tm.id_torneio = ? ORDER BY tm.created_at ASC
    `, [req.params.id]);
    const [participantes] = await pool.query(`
      SELECT ti.*, u.nickname, u.pontos_usuario FROM torneio_inscricao ti
      INNER JOIN usuario u ON ti.id_usuario = u.id_usuario WHERE ti.id_torneio = ? ORDER BY ti.posicao ASC, ti.tempo_conclusao ASC
    `, [req.params.id]);
    const [inscritos] = await pool.query('SELECT COUNT(*) as total FROM torneio_inscricao WHERE id_torneio = ?', [req.params.id]);
    // Check if user is inscribed
    let inscrito = false;
    if (req.session.userId) {
      const [check] = await pool.query('SELECT id FROM torneio_inscricao WHERE id_torneio = ? AND id_usuario = ?', [req.params.id, req.session.userId]);
      inscrito = check.length > 0;
    }
    res.json({ torneio: rows[0], mural, participantes, inscritos: inscritos[0].total, inscrito });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/torneios', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Nao autenticado' });
  try {
    const [user] = await pool.query('SELECT tipo FROM usuario WHERE id_usuario = ?', [req.session.userId]);
    if (user[0].tipo !== 'administrador') return res.status(403).json({ error: 'Apenas administradores podem criar torneios' });
    const { nome, descricao, id_jogo, id_achievement, taxa_inscricao, premio_1, premio_2, premio_3, max_participantes, data_inicio, hora_inicio, data_fim } = req.body;
    await pool.query(
      'INSERT INTO torneio (nome, descricao, id_jogo, id_achievement, taxa_inscricao, premio_1, premio_2, premio_3, max_participantes, data_inicio, hora_inicio, data_fim) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      [nome, descricao, id_jogo, id_achievement, taxa_inscricao, premio_1, premio_2, premio_3, max_participantes, data_inicio, hora_inicio, data_fim]
    );
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/torneios/:id/inscrever', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Nao autenticado' });
  try {
    await pool.query('INSERT IGNORE INTO torneio_inscricao (id_torneio, id_usuario) VALUES (?, ?)', [req.params.id, req.session.userId]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/torneios/:id/mural', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Nao autenticado' });
  try {
    const [user] = await pool.query('SELECT tipo FROM usuario WHERE id_usuario = ?', [req.session.userId]);
    if (user[0].tipo !== 'administrador') return res.status(403).json({ error: 'Apenas administradores' });
    await pool.query('INSERT INTO torneio_mural (id_torneio, texto, id_autor) VALUES (?, ?, ?)', [req.params.id, req.body.texto, req.session.userId]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// =================== PERFIL DE USUARIO ===================

app.get('/api/usuarios/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id_usuario as id, nickname, descricao_perfil, foto_perfil, cor_banner, pontos_usuario, tipo FROM usuario WHERE id_usuario = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario nao encontrado' });
    const [achs] = await pool.query(`
      SELECT a.*, ua.estado, j.nome as jogo_nome FROM usuario_achievement ua
      INNER JOIN achievement a ON ua.id_achievement = a.id_achievement
      LEFT JOIN jogo j ON a.id_jogo = j.id_jogo WHERE ua.id_usuario = ?
    `, [req.params.id]);
    const [games] = await pool.query(`
      SELECT j.* FROM usuario_jogo uj INNER JOIN jogo j ON uj.id_jogo = j.id_jogo WHERE uj.id_usuario = ?
    `, [req.params.id]);
    res.json({ user: rows[0], achievements: achs, jogos: games });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// =================== ADMIN ===================

app.get('/api/admin/usuarios', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Nao autenticado' });
  try {
    const [user] = await pool.query('SELECT tipo FROM usuario WHERE id_usuario = ?', [req.session.userId]);
    if (user[0].tipo !== 'administrador') return res.status(403).json({ error: 'Acesso negado' });
    const [rows] = await pool.query('SELECT id_usuario as id, nome, nickname, email, tipo, pontos_usuario, banido FROM usuario ORDER BY id_usuario');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/banir', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Nao autenticado' });
  try {
    if (req.body.id_usuario === req.session.userId) return res.status(403).json({ error: 'Voce nao pode se banir' });
    const [user] = await pool.query('SELECT tipo FROM usuario WHERE id_usuario = ?', [req.session.userId]);
    if (user[0].tipo !== 'administrador') return res.status(403).json({ error: 'Acesso negado' });
    await pool.query('UPDATE usuario SET banido = NOT banido WHERE id_usuario = ?', [req.body.id_usuario]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/promover', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Nao autenticado' });
  try {
    if (req.body.id_usuario === req.session.userId) return res.status(403).json({ error: 'Voce nao pode alterar seu proprio cargo' });
    const [user] = await pool.query('SELECT tipo FROM usuario WHERE id_usuario = ?', [req.session.userId]);
    if (user[0].tipo !== 'administrador') return res.status(403).json({ error: 'Acesso negado' });
    await pool.query("UPDATE usuario SET tipo = CASE WHEN tipo = 'usuario' THEN 'administrador' ELSE 'usuario' END WHERE id_usuario = ?", [req.body.id_usuario]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/jogos/:id', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Nao autenticado' });
  try {
    const [user] = await pool.query('SELECT tipo FROM usuario WHERE id_usuario = ?', [req.session.userId]);
    if (user[0].tipo !== 'administrador') return res.status(403).json({ error: 'Acesso negado' });
    await pool.query('DELETE FROM jogo WHERE id_jogo = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/achievements/:id', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Nao autenticado' });
  try {
    const [user] = await pool.query('SELECT tipo FROM usuario WHERE id_usuario = ?', [req.session.userId]);
    if (user[0].tipo !== 'administrador') return res.status(403).json({ error: 'Acesso negado' });
    await pool.query('DELETE FROM achievement WHERE id_achievement = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// =================== ADMIN: ADD GAME ===================

app.post('/api/admin/jogos', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Nao autenticado' });
  try {
    const [user] = await pool.query('SELECT tipo FROM usuario WHERE id_usuario = ?', [req.session.userId]);
    if (user[0].tipo !== 'administrador') return res.status(403).json({ error: 'Acesso negado' });
    const { nome, desenvolvedor, descricao, imagem, achievements } = req.body;
    const [result] = await pool.query('INSERT INTO jogo (nome, desenvolvedor, descricao, imagem) VALUES (?, ?, ?, ?)', [nome, desenvolvedor || '', descricao || '', imagem || '']);
    const jogoId = result.insertId;
    // Insert achievements if provided
    if (Array.isArray(achievements) && achievements.length > 0) {
      for (const ach of achievements) {
        if (ach.nome && ach.nome.trim()) {
          await pool.query('INSERT INTO achievement (nome, descricao, dificuldade, pontos, id_jogo) VALUES (?, ?, ?, ?, ?)',
            [ach.nome.trim(), ach.descricao || '', ach.dificuldade || 'medio', parseInt(ach.pontos) || 30, jogoId]);
        }
      }
    }
    res.json({ id: jogoId, ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// =================== ADMIN: ADD ACHIEVEMENT ===================

app.post('/api/admin/achievements', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Nao autenticado' });
  try {
    const [user] = await pool.query('SELECT tipo FROM usuario WHERE id_usuario = ?', [req.session.userId]);
    if (user[0].tipo !== 'administrador') return res.status(403).json({ error: 'Acesso negado' });
    const { nome, descricao, dificuldade, pontos, id_jogo } = req.body;
    const [result] = await pool.query('INSERT INTO achievement (nome, descricao, dificuldade, pontos, id_jogo) VALUES (?, ?, ?, ?, ?)', [nome, descricao, dificuldade || 'medio', pontos || 30, id_jogo || null]);
    res.json({ id: result.insertId, ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// =================== JOGOS VINCULADOS ===================

app.get('/api/jogos/vinculados', async (req, res) => {
  if (!req.session.userId) return res.json([]);
  try {
    const [rows] = await pool.query('SELECT id_jogo FROM usuario_jogo WHERE id_usuario = ?', [req.session.userId]);
    res.json(rows.map(r => r.id_jogo));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// =================== ACHIEVEMENT REIVINDICACAO ===================

app.post('/api/achievements/reivindicar', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Nao autenticado' });
  try {
    const { id_achievement, video_url } = req.body;
    if (!video_url || !video_url.trim()) return res.status(400).json({ error: 'O video de comprovacao e obrigatorio' });
    // Check if user already claimed
    const [existing] = await pool.query('SELECT id_usuario FROM usuario_achievement WHERE id_usuario = ? AND id_achievement = ?', [req.session.userId, id_achievement]);
    if (existing.length > 0) return res.status(400).json({ error: 'Voce ja enviou uma reivindicacao para este achievement' });
    // Check if user has the game linked
    const [ach] = await pool.query('SELECT id_jogo FROM achievement WHERE id_achievement = ?', [id_achievement]);
    if (ach.length > 0 && ach[0].id_jogo) {
      const [hasGame] = await pool.query('SELECT id_usuario FROM usuario_jogo WHERE id_usuario = ? AND id_jogo = ?', [req.session.userId, ach[0].id_jogo]);
      if (hasGame.length === 0) return res.status(400).json({ error: 'Voce precisa vincular o jogo deste achievement antes de reivindicar' });
    }
    await pool.query('INSERT INTO usuario_achievement (id_usuario, id_achievement, estado, video_url) VALUES (?, ?, "pendente", ?)', [req.session.userId, id_achievement, video_url.trim()]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// =================== ADMIN: REIVINDICACOES ===================

app.post('/api/admin/reivindicacoes/:id', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Nao autenticado' });
  try {
    const [user] = await pool.query('SELECT tipo FROM usuario WHERE id_usuario = ?', [req.session.userId]);
    if (user[0].tipo !== 'administrador') return res.status(403).json({ error: 'Acesso negado' });
    const { acao } = req.body; // 'aprovar' or 'rejeitar'
    const estado = acao === 'aprovar' ? 'aprovado' : 'rejeitado';
    // Parse id from route param: expect format "uid_achid"
    const ids = req.params.id.split('_');
    const claimUid = parseInt(ids[0]);
    const claimAchId = parseInt(ids[1]);
    await pool.query('UPDATE usuario_achievement SET estado = ? WHERE id_usuario = ? AND id_achievement = ?', [estado, claimUid, claimAchId]);
    // If approved, add points to user
    if (acao === 'aprovar') {
      const [claim] = await pool.query('SELECT ua.id_usuario, a.pontos FROM usuario_achievement ua INNER JOIN achievement a ON ua.id_achievement = a.id_achievement WHERE ua.id_usuario = ? AND ua.id_achievement = ?', [claimUid, claimAchId]);
      if (claim.length > 0) {
        await pool.query('UPDATE usuario SET pontos_usuario = pontos_usuario + ? WHERE id_usuario = ?', [claim[0].pontos, claim[0].id_usuario]);
      }
    }
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/reivindicacoes', async (req, res) => {
  if (!req.session.userId) return res.json([]);
  try {
    const [user] = await pool.query('SELECT tipo FROM usuario WHERE id_usuario = ?', [req.session.userId]);
    if (user[0].tipo !== 'administrador') return res.status(403).json({ error: 'Acesso negado' });
    const [rows] = await pool.query(`
      SELECT ua.id_usuario, ua.id_achievement, ua.estado, ua.video_url, ua.data_conquista,
        u.nickname, u.foto_perfil,
        a.nome as achievement_nome, a.pontos, j.nome as jogo_nome
      FROM usuario_achievement ua
      INNER JOIN usuario u ON ua.id_usuario = u.id_usuario
      INNER JOIN achievement a ON ua.id_achievement = a.id_achievement
      LEFT JOIN jogo j ON a.id_jogo = j.id_jogo
      WHERE ua.estado = 'pendente'
      ORDER BY ua.data_conquista DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// =================== ACHIEVEMENT RANKING ===================

app.get('/api/achievements/ranking/:id', async (req, res) => {
  try {
    const achId = req.params.id;
    const [ach] = await pool.query('SELECT a.*, j.nome as jogo_nome FROM achievement a LEFT JOIN jogo j ON a.id_jogo = j.id_jogo WHERE a.id_achievement = ?', [achId]);
    if (ach.length === 0) return res.status(404).json({ error: 'Achievement nao encontrado' });
    // First completers (approved, ordered by date)
    const [ranking] = await pool.query(`
      SELECT ua.id_usuario, ua.data_conquista, u.nickname, u.foto_perfil
      FROM usuario_achievement ua
      INNER JOIN usuario u ON ua.id_usuario = u.id_usuario
      WHERE ua.id_achievement = ? AND ua.estado = 'aprovado'
      ORDER BY ua.data_conquista ASC
    `, [achId]);
    // Pending claims
    const [pendentes] = await pool.query(`
      SELECT ua.id_usuario, ua.id_achievement, ua.data_conquista, u.nickname, u.foto_perfil
      FROM usuario_achievement ua
      INNER JOIN usuario u ON ua.id_usuario = u.id_usuario
      WHERE ua.id_achievement = ? AND ua.estado = 'pendente'
      ORDER BY ua.data_conquista DESC
    `, [achId]);
    const [total] = await pool.query('SELECT COUNT(*) as c FROM usuario_achievement WHERE id_achievement = ? AND estado = "aprovado"', [achId]);
    res.json({ achievement: ach[0], ranking, pendentes, totalConquistadores: total[0].c });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// =================== DENUNCIAS ===================

app.post('/api/denunciar', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Nao autenticado' });
  try {
    const { id_denunciado, motivo, descricao } = req.body;
    if (!id_denunciado || !motivo) return res.status(400).json({ error: 'Preencha o motivo da denuncia' });
    if (id_denunciado === req.session.userId) return res.status(400).json({ error: 'Voce nao pode denunciar a si mesmo' });
    await pool.query('INSERT INTO denuncia (id_denunciante, id_denunciado, motivo, descricao) VALUES (?, ?, ?, ?)',
      [req.session.userId, id_denunciado, motivo, descricao || '']);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/denuncias', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Nao autenticado' });
  try {
    const [user] = await pool.query('SELECT tipo FROM usuario WHERE id_usuario = ?', [req.session.userId]);
    if (user[0].tipo !== 'administrador') return res.status(403).json({ error: 'Acesso negado' });
    const [rows] = await pool.query(`
      SELECT d.*, u1.nickname as denunciante_nick, u2.nickname as denunciado_nick
      FROM denuncia d
      INNER JOIN usuario u1 ON d.id_denunciante = u1.id_usuario
      INNER JOIN usuario u2 ON d.id_denunciado = u2.id_usuario
      ORDER BY d.created_at DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/denuncias/:id', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Nao autenticado' });
  try {
    const [user] = await pool.query('SELECT tipo FROM usuario WHERE id_usuario = ?', [req.session.userId]);
    if (user[0].tipo !== 'administrador') return res.status(403).json({ error: 'Acesso negado' });
    const { acao } = req.body;
    const estado = acao === 'resolver' ? 'resolvida' : 'rejeitada';
    await pool.query('UPDATE denuncia SET estado = ? WHERE id = ?', [estado, req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// =================== CATCH ALL ===================

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Epic Moments rodando em http://localhost:${PORT}`);
  console.log('Certifique-se de que o MySQL esta rodando e o banco "epicmoments" foi criado.');
});
