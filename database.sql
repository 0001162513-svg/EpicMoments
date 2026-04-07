-- =========================================================
-- Epic Moments - Banco de Dados MySQL
-- Execute este arquivo no MySQL Workbench para criar o banco
-- =========================================================

DROP DATABASE IF EXISTS epicmoments;
CREATE DATABASE epicmoments CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE epicmoments;

-- Tabela de Usuarios (admin e usuario no mesmo lugar)
CREATE TABLE usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    nickname VARCHAR(25) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(100) NOT NULL,
    cpf VARCHAR(11),
    data_nascimento DATE,
    genero ENUM('M','F','O','N') DEFAULT 'M',
    descricao_perfil TEXT,
    foto_perfil VARCHAR(500),
    cor_banner VARCHAR(7) DEFAULT '#6366f1',
    pontos_usuario INT DEFAULT 0,
    tipo ENUM('usuario','administrador') DEFAULT 'usuario',
    banido TINYINT(1) DEFAULT 0,
    aceitou_termos TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Jogos
CREATE TABLE jogo (
    id_jogo INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    desenvolvedor VARCHAR(100),
    descricao TEXT,
    imagem VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Achievements
CREATE TABLE achievement (
    id_achievement INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    dificuldade ENUM('facil','medio','dificil') DEFAULT 'medio',
    pontos INT DEFAULT 30,
    id_jogo INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_jogo) REFERENCES jogo(id_jogo) ON DELETE CASCADE
);

-- Vinculacao usuario-jogo
CREATE TABLE usuario_jogo (
    id_usuario INT,
    id_jogo INT,
    PRIMARY KEY (id_usuario, id_jogo),
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_jogo) REFERENCES jogo(id_jogo) ON DELETE CASCADE
);

-- Achievements conquistados
CREATE TABLE usuario_achievement (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT,
    id_achievement INT,
    estado ENUM('pendente','aprovado','rejeitado') DEFAULT 'pendente',
    video_url VARCHAR(500) NOT NULL DEFAULT'https://www.youtube.com/',
    data_conquista TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_achievement) REFERENCES achievement(id_achievement) ON DELETE CASCADE
);

-- Amizades
CREATE TABLE amizade (
    id_amizade INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario1 INT NOT NULL,
    id_usuario2 INT NOT NULL,
    estado ENUM('pendente','aceita','recusada') DEFAULT 'pendente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario1) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario2) REFERENCES usuario(id_usuario) ON DELETE CASCADE
);

-- Mensagens de chat
CREATE TABLE mensagem (
    id_mensagem INT AUTO_INCREMENT PRIMARY KEY,
    id_remetente INT NOT NULL,
    id_destinatario INT NOT NULL,
    texto TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_remetente) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_destinatario) REFERENCES usuario(id_usuario) ON DELETE CASCADE
);

-- Comunidades
CREATE TABLE comunidade (
    id_comunidade INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    id_criador INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_criador) REFERENCES usuario(id_usuario) ON DELETE CASCADE
);

-- Membros de comunidade
CREATE TABLE comunidade_membro (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_comunidade INT NOT NULL,
    id_usuario INT NOT NULL,
    papel ENUM('criador','moderador','membro') DEFAULT 'membro',
    estado ENUM('pendente','aceito','recusado') DEFAULT 'aceito',
    FOREIGN KEY (id_comunidade) REFERENCES comunidade(id_comunidade) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    UNIQUE KEY unique_membro (id_comunidade, id_usuario)
);

-- Topicos do forum
CREATE TABLE topico (
    id_topico INT AUTO_INCREMENT PRIMARY KEY,
    id_comunidade INT NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    conteudo TEXT,
    id_autor INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_comunidade) REFERENCES comunidade(id_comunidade) ON DELETE CASCADE,
    FOREIGN KEY (id_autor) REFERENCES usuario(id_usuario) ON DELETE CASCADE
);

-- Respostas de topicos
CREATE TABLE resposta (
    id_resposta INT AUTO_INCREMENT PRIMARY KEY,
    id_topico INT NOT NULL,
    id_autor INT NOT NULL,
    texto TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_topico) REFERENCES topico(id_topico) ON DELETE CASCADE,
    FOREIGN KEY (id_autor) REFERENCES usuario(id_usuario) ON DELETE CASCADE
);

-- Enquetes
CREATE TABLE enquete (
    id_enquete INT AUTO_INCREMENT PRIMARY KEY,
    nome_achievement VARCHAR(100) NOT NULL,
    descricao TEXT,
    dificuldade ENUM('facil','medio','dificil') DEFAULT 'medio',
    pontos INT DEFAULT 30,
    id_jogo INT,
    id_criador INT NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_jogo) REFERENCES jogo(id_jogo) ON DELETE SET NULL,
    FOREIGN KEY (id_criador) REFERENCES usuario(id_usuario) ON DELETE CASCADE
);

-- Votos de enquetes
CREATE TABLE enquete_voto (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_enquete INT NOT NULL,
    id_usuario INT NOT NULL,
    voto ENUM('aprovar','rejeitar') NOT NULL,
    FOREIGN KEY (id_enquete) REFERENCES enquete(id_enquete) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    UNIQUE KEY unique_voto (id_enquete, id_usuario)
);

-- Torneios
CREATE TABLE torneio (
    id_torneio INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    descricao TEXT,
    id_jogo INT,
    id_achievement INT,
    taxa_inscricao DECIMAL(10,2) DEFAULT 0,
    premio_1 DECIMAL(10,2) DEFAULT 0,
    premio_2 DECIMAL(10,2) DEFAULT 0,
    premio_3 DECIMAL(10,2) DEFAULT 0,
    max_participantes INT DEFAULT 32,
    data_inicio DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    data_fim DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_jogo) REFERENCES jogo(id_jogo) ON DELETE SET NULL,
    FOREIGN KEY (id_achievement) REFERENCES achievement(id_achievement) ON DELETE SET NULL
);

-- Inscricoes em torneios
CREATE TABLE torneio_inscricao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_torneio INT NOT NULL,
    id_usuario INT NOT NULL,
    tempo_conclusao TIME,
    posicao INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_torneio) REFERENCES torneio(id_torneio) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    UNIQUE KEY unique_inscricao (id_torneio, id_usuario)
);

-- Mural do torneio
CREATE TABLE torneio_mural (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_torneio INT NOT NULL,
    texto TEXT NOT NULL,
    id_autor INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_torneio) REFERENCES torneio(id_torneio) ON DELETE CASCADE,
    FOREIGN KEY (id_autor) REFERENCES usuario(id_usuario) ON DELETE CASCADE
);

-- Denuncias de usuarios
CREATE TABLE denuncia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_denunciante INT NOT NULL,
    id_denunciado INT NOT NULL,
    motivo VARCHAR(50) NOT NULL,
    descricao TEXT,
    estado ENUM('pendente','resolvida','rejeitada') DEFAULT 'pendente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_denunciante) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_denunciado) REFERENCES usuario(id_usuario) ON DELETE CASCADE
);

-- =========================================================
-- DADOS INICIAIS
-- =========================================================

-- Usuarios (senhas sem criptografia)
INSERT INTO usuario (nome, nickname, email, senha, cpf, genero, descricao_perfil, cor_banner, pontos_usuario, tipo, aceitou_termos) VALUES
('Guilherme Admin', 'admin', 'admin@epicmoments.com', 'Admin1', '12345678901', 'M', 'Administrador da plataforma Epic Moments', '#6366f1', 0, 'administrador', 1),
('Joao Silva', 'ProGamer99', 'joao@email.com', 'Joao1', '98765432100', 'M', 'Amante de FPS competitivo. CS2 e Valorant main.', '#f59e0b', 145, 'usuario', 1),
('Maria Santos', 'MariGamer', 'maria@email.com', 'Maria1', '11122233344', 'F', 'Streamer e gamer casual. LoL e Fortnite!', '#ec4899', 95, 'usuario', 1),
('Pedro Costa', 'PedroCS', 'pedro@email.com', 'Pedro1', '55566677788', 'M', 'Apaixonado por FPS taticos. Valorant main.', '#10b981', 65, 'usuario', 1),
('Lucas Oliveira', 'NovoPlayer', 'lucas@email.com', 'Lucas1', '99988877766', 'M', 'Novo na plataforma, explorando!', '#8b5cf6', 10, 'usuario', 1);

-- Jogos
INSERT INTO jogo (nome, desenvolvedor, descricao, imagem) VALUES
('Counter-Strike 2', 'Valve', 'O lendario FPS tatico da Valve retorna com graficos aprimorados, novo sistema de fumaca volumetrica e jogabilidade refinada. CS2 redefine o padrao dos shooters competitivos com mapas redesenhados e mecanicas modernizadas.', '/img/cs2.jpg'),
('League of Legends', 'Riot Games', 'O MOBA mais jogado do mundo. Escolha entre mais de 160 campeoes, domine as lanes e destrua o Nexus inimigo. Com torneios mundiais e uma comunidade vibrante, LoL continua sendo referencia em esports.', '/img/lol.jpg'),
('Valorant', 'Riot Games', 'Shooter tatico 5v5 que combina mecanicas precisas de tiro com habilidades unicas de agentes. Cada round e uma mistura estrategica de gunplay e poderes especiais.', '/img/valorant.jpg'),
('Fortnite', 'Epic Games', 'O battle royale que revolucionou o genero com mecanicas de construcao unicas. 100 jogadores competem em uma ilha que encolhe, combinando tiro, construcao e estrategia.', '/img/fortnite.jpg'),
('Minecraft', 'Mojang Studios', 'O jogo sandbox mais vendido da historia. Explore, construa e sobreviva em mundos infinitos feitos de blocos. Modo criativo, sobrevivencia e multiplayer.', '/img/minecraft.jpg'),
('Apex Legends', 'Respawn Entertainment', 'Battle royale com sistema de legends - personagens com habilidades unicas. Trios competem em mapas dinamicos com mecanicas de movimento avancadas.', '/img/apex.jpg');

-- Achievements
INSERT INTO achievement (nome, descricao, dificuldade, pontos, id_jogo) VALUES
('Primeira Vitoria', 'Venca sua primeira partida competitiva', 'facil', 15, 1),
('Ace Master', 'Faca um ace (5 kills no round) em partida competitiva', 'dificil', 50, 1),
('Pentakill', 'Consiga um pentakill em uma partida ranqueada', 'dificil', 50, 2),
('Primeiro Sangue', 'Consiga o primeiro abate da partida', 'facil', 15, 2),
('Clutch 1v5', 'Venca um round 1v5 no competitivo', 'dificil', 50, 3),
('Victory Royale', 'Venca uma partida solo', 'medio', 30, 4),
('Dragao do Ender', 'Derrote o Ender Dragon no modo sobrevivencia', 'medio', 30, 5),
('Diamante Puro', 'Minere 100 diamantes em uma unica partida', 'facil', 15, 5),
('Campeao da Arena', 'Venca 10 partidas seguidas no modo ranked', 'dificil', 50, 6);

-- Vinculacao usuario-jogo
INSERT INTO usuario_jogo (id_usuario, id_jogo) VALUES
(2, 1), (2, 2), (2, 3),
(3, 2), (3, 4),
(4, 1), (4, 3),
(5, 5);

-- Achievements conquistados
INSERT INTO usuario_achievement (id_usuario, id_achievement, estado) VALUES
(2, 1, 'aprovado'), (2, 2, 'aprovado'), (2, 3, 'aprovado'),
(3, 3, 'aprovado'), (3, 4, 'aprovado'), (3, 6, 'pendente'),
(4, 1, 'aprovado'), (4, 5, 'pendente');

-- Amizades
INSERT INTO amizade (id_usuario1, id_usuario2, estado) VALUES
(2, 3, 'aceita'), (2, 4, 'aceita'), (3, 4, 'aceita'),
(5, 2, 'pendente');

-- Comunidades
INSERT INTO comunidade (nome, descricao, id_criador) VALUES
('CS2 Brasil', 'Comunidade brasileira de Counter-Strike 2. Dicas, estrategias e discussoes sobre o competitivo.', 2),
('LoL Ranqueada', 'Discussoes sobre ranqueada de League of Legends. Tier lists, meta e builds.', 3),
('Valorant Brasil', 'Tudo sobre Valorant: agentes, mapas, estrategias e clips incriveis.', 4);

-- Membros de comunidade
INSERT INTO comunidade_membro (id_comunidade, id_usuario, papel, estado) VALUES
(1, 2, 'criador', 'aceito'), (1, 3, 'moderador', 'aceito'), (1, 4, 'membro', 'aceito'),
(2, 3, 'criador', 'aceito'), (2, 2, 'membro', 'aceito'),
(3, 4, 'criador', 'aceito'), (3, 2, 'membro', 'aceito'), (3, 3, 'membro', 'aceito'), (3, 5, 'membro', 'aceito');

-- Topicos do forum
INSERT INTO topico (id_comunidade, titulo, conteudo, id_autor) VALUES
(1, 'Dicas para subir de rank no CS2', 'Compartilhem suas dicas para melhorar no competitivo! Acho que treinar aim e aprender smokes faz muita diferenca.', 2),
(1, 'Qual a melhor arma custo-beneficio?', 'Na minha opiniao a AK-47 continua sendo a melhor. One tap garantido se acertar a cabeca.', 4),
(2, 'Melhor champion para subir de elo?', 'Estou preso no Gold e preciso de dicas. Qual champion voces recomendam?', 3),
(3, 'Tier list de agentes atualizada', 'Alguem tem uma tier list atualizada dos agentes? Quero saber quem esta meta no competitivo.', 4);

-- Respostas
INSERT INTO resposta (id_topico, id_autor, texto) VALUES
(1, 4, 'Concordo! Treinar no Aim Lab ajuda bastante tambem.'),
(1, 3, 'Assistir demos dos pros ajuda muito a entender posicionamento.'),
(3, 2, 'Joga de Annie mid, e simples e eficiente!');

-- Enquetes
INSERT INTO enquete (nome_achievement, descricao, dificuldade, pontos, id_jogo, id_criador, data_inicio, data_fim) VALUES
('Defuse Ninja', 'Desarme a bomba com todos os inimigos vivos no site', 'dificil', 50, 1, 2, '2026-03-20', '2026-04-05'),
('Penta no Baron', 'Consiga um pentakill durante luta de Baron Nashor', 'dificil', 50, 2, 3, '2026-03-25', '2026-04-10'),
('Construtor Supremo', 'Construa uma estrutura de 100 blocos de altura no modo sobrevivencia', 'medio', 30, 5, 4, '2026-03-28', '2026-04-12');

-- Votos de enquetes
INSERT INTO enquete_voto (id_enquete, id_usuario, voto) VALUES
(1, 2, 'aprovar'), (1, 3, 'aprovar'), (1, 4, 'aprovar'), (1, 5, 'aprovar'),
(2, 2, 'aprovar'), (2, 3, 'rejeitar'), (2, 4, 'aprovar'),
(3, 2, 'aprovar'), (3, 3, 'aprovar'), (3, 4, 'aprovar'), (3, 5, 'aprovar');

-- Torneios
INSERT INTO torneio (nome, descricao, id_jogo, id_achievement, taxa_inscricao, premio_1, premio_2, premio_3, max_participantes, data_inicio, hora_inicio, data_fim) VALUES
('Torneio CS2 Master Cup', 'Campeonato de CS2 com premiacao em dinheiro. Mostre suas habilidades e conquiste o topo!', 1, 2, 25.00, 500.00, 250.00, 100.00, 32, '2026-04-15', '19:00:00', '2026-04-15'),
('Valorant Clutch Challenge', 'Quem consegue o clutch 1v5 mais rapido? O cronometro nao perdoa!', 3, 5, 15.00, 300.00, 150.00, 75.00, 16, '2026-04-20', '20:00:00', '2026-04-20'),
('Minecraft Speed Challenge', 'Derrote o Ender Dragon no menor tempo possivel! Speedrun competitivo.', 5, 7, 10.00, 200.00, 100.00, 50.00, 24, '2026-05-01', '14:00:00', '2026-05-01');

-- Mural dos torneios
INSERT INTO torneio_mural (id_torneio, texto, id_autor) VALUES
(1, 'Bem-vindos ao Torneio CS2 Master Cup! Regras: Bo3, mapas definidos por veto. O achievement alvo e Ace Master - quem conseguir mais rapido, ganha!', 1),
(1, 'Lembrem-se: check-in obrigatorio 30 minutos antes do inicio as 19:00!', 1),
(2, 'O torneio sera transmitido ao vivo! Link de stream sera divulgado no dia.', 1),
(3, 'Seed sera revelada 5 minutos antes do inicio. Glitches permitidos!', 1);

-- Inscricoes em torneios
INSERT INTO torneio_inscricao (id_torneio, id_usuario, tempo_conclusao, posicao) VALUES
(1, 2, '00:45:23', 1), (1, 3, '01:12:45', 2), (1, 4, '01:30:10', 3);

-- Mensagens
INSERT INTO mensagem (id_remetente, id_destinatario, texto) VALUES
(2, 3, 'E ai Mari, bora jogar CS2 hoje?'),
(3, 2, 'Bora! Que horas?'),
(2, 3, 'As 20h ta bom?'),
(3, 2, 'Perfeito, te vejo la!');
