@echo off
echo Iniciando a versao web do Gnosis Instrutores...
echo.

echo Verificando se as dependencias estao instaladas...
if not exist "node_modules" (
    echo Instalando dependencias...
    npm install
    echo.
)

echo Iniciando servidor de desenvolvimento...
echo.
echo Acesse: http://localhost:3000
echo.
echo Pressione Ctrl+C para parar o servidor
echo.

npm run dev 