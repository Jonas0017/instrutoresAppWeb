@echo off
echo ========================================
echo    GNOSIS INSTRUTORES - WEB VERSION
echo ========================================
echo.
echo Instalando dependencias e configurando o projeto...
echo.

REM Verificar se o Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Node.js nao encontrado!
    echo Por favor, instale o Node.js 16+ em: https://nodejs.org/
    pause
    exit /b 1
)

REM Verificar se o npm está instalado
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: npm nao encontrado!
    echo Por favor, instale o npm 8+ junto com o Node.js
    pause
    exit /b 1
)

echo ✓ Node.js e npm encontrados
echo.

REM Limpar cache do npm
echo Limpando cache do npm...
npm cache clean --force

REM Instalar dependências
echo Instalando dependencias...
npm install

if %errorlevel% neq 0 (
    echo ERRO: Falha ao instalar dependencias!
    echo Tentando com --legacy-peer-deps...
    npm install --legacy-peer-deps
    
    if %errorlevel% neq 0 (
        echo ERRO: Falha ao instalar dependencias mesmo com --legacy-peer-deps!
        pause
        exit /b 1
    )
)

echo ✓ Dependencias instaladas com sucesso!
echo.

REM Verificar configuração do Firebase
if not exist "src\firebaseConfig.ts" (
    echo AVISO: Arquivo firebaseConfig.ts nao encontrado!
    echo Por favor, configure o Firebase antes de executar o projeto.
    echo.
    echo 1. Crie um projeto no Firebase Console
    echo 2. Ative o Firestore Database
    echo 3. Copie as credenciais para src/firebaseConfig.ts
    echo.
)

REM Verificar variáveis de ambiente
if not exist ".env.local" (
    echo AVISO: Arquivo .env.local nao encontrado!
    echo Criando arquivo .env.local de exemplo...
    echo VITE_FIREBASE_API_KEY=sua-api-key > .env.local
    echo VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com >> .env.local
    echo VITE_FIREBASE_PROJECT_ID=seu-projeto >> .env.local
    echo VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com >> .env.local
    echo VITE_FIREBASE_MESSAGING_SENDER_ID=123456789 >> .env.local
    echo VITE_FIREBASE_APP_ID=seu-app-id >> .env.local
    echo ✓ Arquivo .env.local criado
    echo.
)

REM Verificar TypeScript
echo Verificando configuração TypeScript...
npx tsc --noEmit

if %errorlevel% neq 0 (
    echo AVISO: Erros de TypeScript encontrados!
    echo Execute 'npm run lint:fix' para corrigir automaticamente.
    echo.
)

echo ========================================
echo    INSTALACAO CONCLUIDA!
echo ========================================
echo.
echo Para iniciar o projeto:
echo   npm run dev
echo.
echo Para build de producao:
echo   npm run build:prod
echo.
echo Para executar testes:
echo   npm run test
echo.
echo Para analisar o bundle:
echo   npm run analyze
echo.
echo ========================================
pause 