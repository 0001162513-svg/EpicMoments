@echo off
echo ============================================
echo   Epic Moments v2 - Instalacao e Setup
echo ============================================
echo.

:: Verifica Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao esta instalado!
    echo Baixe em: https://nodejs.org
    pause
    exit /b 1
)

:: Verifica se .env tem senha
findstr /C:"DB_PASS=" .env | findstr /V /C:"DB_PASS=sua_" >nul 2>nul
if %errorlevel% equ 0 (
    echo [AVISO] A senha do MySQL no .env parece estar vazia!
    echo.
    echo Por favor, abra o arquivo .env com o Bloco de Notas
    echo e coloque sua senha do MySQL apos DB_PASS=
    echo Exemplo: DB_PASS=suasenha123
    echo.
    pause
    exit /b 1
)

echo [1/3] Instalando dependencias...
call npm install
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao instalar dependencias!
    pause
    exit /b 1
)

echo.
echo [2/3] Dependencias instaladas com sucesso!
echo.
echo [3/3] Iniciando o servidor...
echo.
node server.js
pause
