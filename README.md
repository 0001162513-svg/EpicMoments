# Epic Moments v2.0 - Plataforma Gamer

## Pré-requisitos

1. **Node.js** (versão 14+) - Baixe em https://nodejs.org (não requer permissão de administrador se usar a versão portable/zip)
2. **MySQL** (via MySQL Workbench) - Já deve estar instalado e rodando

## Passo a Passo para Rodar Localmente

### 1. Configurar o Banco de Dados

1. Abra o **MySQL Workbench**
2. Conecte ao seu servidor MySQL local
3. Abra o arquivo `database.sql`
4. Execute o script completo (Ctrl+Shift+Enter ou botão de raio ⚡)
5. Verifique que o banco `epicmoments` foi criado com todas as tabelas

### 2. Configurar a Conexão com o Banco

Edite o arquivo `.env` na raiz do projeto com suas credenciais MySQL:

```
DB_HOST=localhost
DB_USER=root
DB_PASS=sua_senha_aqui
DB_NAME=epicmoments
```

### 3. Instalar Dependências

Abra o terminal/CMD na pasta do projeto e execute:

```bash
npm install
```

### 4. Iniciar o Servidor

```bash
npm start
```

O servidor será iniciado em `http://localhost:3000`

### 5. Acessar a Plataforma

Abra o navegador e acesse: **http://localhost:3000**

## Contas de Teste

| Tipo | E-mail | Senha |
|------|--------|-------|
| Admin | admin@epicmoments.com | Admin1 |
| Usuário | joao@email.com | Joao1 |
| Usuário | maria@email.com | Maria1 |
| Usuário | pedro@email.com | Pedro1 |
| Usuário | lucas@email.com | Lucas1 |

## Funcionalidades

- **Cadastro/Login** - Registro com aceitação obrigatória do Código de Conduta
- **Jogos** - Catálogo de jogos com vinculação ao perfil e achievements
- **Achievements** - Lista completa com filtro por dificuldade
- **Ranking** - Global e entre amigos
- **Comunidades** - Fórum com tópicos, respostas e gerenciamento de membros
- **Enquetes** - Proposição de novos achievements com votação (70%+ = aprovado)
- **Torneios** - Inscrição, mural administrativo e ranking por tempo
- **Amigos** - Enviar/aceitar pedidos, chat em tempo real
- **Perfil** - Edição completa com upload de foto
- **Admin** - Dashboard para gerenciar usuários, jogos e achievements

## Estrutura do Projeto

```
epicmoments/
├── server.js          # Servidor Node.js/Express com todas as APIs
├── database.sql       # Script SQL completo para MySQL Workbench
├── package.json       # Dependências do projeto
├── .env               # Configuração do banco de dados
├── README.md          # Este arquivo
└── public/
    ├── index.html     # Frontend SPA (Single Page Application)
    ├── style.css      # Estilos CSS
    ├── app.js         # Lógica JavaScript do frontend
    ├── img/           # Imagens dos jogos e logo
    └── uploads/       # Fotos de perfil dos usuários
```

## Notas

- Senhas armazenadas em texto plano (sem criptografia, conforme requisito)
- O projeto roda 100% localmente, sem necessidade de hospedagem externa
- Não requer permissões de administrador do Windows para instalar ou executar
