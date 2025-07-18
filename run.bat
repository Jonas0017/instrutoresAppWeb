@echo off
echo ========================================
echo    GNOSIS INSTRUTORES - WEB VERSION
echo ========================================
echo.
echo Escolha uma opcao:
echo.
echo 1. Desenvolvimento (npm run dev)
echo 2. Preview do Build (npm run preview)
echo 3. Build de Producao (npm run build:prod)
echo 4. Testes (npm run test)
echo 5. Analise do Bundle (npm run analyze)
echo 6. Limpar Cache (npm run clean)
echo 7. Verificar Tipos (npm run type-check)
echo 8. Formatar Codigo (npm run format)
echo 9. Lint e Corrigir (npm run lint:fix)
echo 0. Sair
echo.
set /p choice="Digite sua escolha (0-9): "

if "%choice%"=="1" goto dev
if "%choice%"=="2" goto preview
if "%choice%"=="3" goto build
if "%choice%"=="4" goto test
if "%choice%"=="5" goto analyze
if "%choice%"=="6" goto clean
if "%choice%"=="7" goto typecheck
if "%choice%"=="8" goto format
if "%choice%"=="9" goto lint
if "%choice%"=="0" goto exit
goto invalid

:dev
echo.
echo Iniciando servidor de desenvolvimento...
echo URL: http://localhost:3000
echo.
npm run dev
goto end

:preview
echo.
echo Iniciando preview do build...
echo URL: http://localhost:4173
echo.
npm run preview
goto end

:build
echo.
echo Criando build de producao...
npm run build:prod
if %errorlevel% equ 0 (
    echo ✓ Build criado com sucesso!
    echo Arquivos gerados em: dist/
) else (
    echo ✗ Erro ao criar build!
)
pause
goto end

:test
echo.
echo Executando testes...
npm run test
goto end

:analyze
echo.
echo Analisando bundle...
npm run analyze
goto end

:clean
echo.
echo Limpando cache e arquivos temporarios...
npm run clean
echo ✓ Cache limpo!
pause
goto end

:typecheck
echo.
echo Verificando tipos TypeScript...
npm run type-check
if %errorlevel% equ 0 (
    echo ✓ Tipos verificados com sucesso!
) else (
    echo ✗ Erros de tipo encontrados!
)
pause
goto end

:format
echo.
echo Formatando codigo...
npm run format
echo ✓ Codigo formatado!
pause
goto end

:lint
echo.
echo Executando lint e corrigindo...
npm run lint:fix
echo ✓ Lint executado!
pause
goto end

:invalid
echo.
echo Opcao invalida! Digite um numero de 0 a 9.
pause
goto end

:exit
echo.
echo Saindo...
exit /b 0

:end
echo.
echo Pressione qualquer tecla para continuar...
pause >nul 