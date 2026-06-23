@echo off
chcp 65001 >nul
echo ============================================================
echo  FIURJ Plataforma Academica -- Setup Fase 0
echo ============================================================
echo.

:: Verificar Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao encontrado. Instale em https://nodejs.org
    pause & exit /b 1
)
echo [OK] Node.js encontrado:
node --version

:: Verificar Docker
where docker >nul 2>&1
if %errorlevel% neq 0 (
    echo [AVISO] Docker nao encontrado. Instale Docker Desktop para subir o banco local.
    echo         Baixe em: https://www.docker.com/products/docker-desktop
    echo         Pulando etapa do banco...
    set DOCKER_OK=0
) else (
    echo [OK] Docker encontrado.
    set DOCKER_OK=1
)

echo.
echo [1/4] Subindo banco PostgreSQL + Redis (Docker)...
if "%DOCKER_OK%"=="1" (
    cd infra
    docker compose up -d
    if %errorlevel% neq 0 (
        echo [ERRO] Falha ao subir containers. Verifique se o Docker Desktop esta rodando.
        pause & exit /b 1
    )
    echo [OK] Containers rodando.
    cd ..
) else (
    echo [PULADO] Docker nao disponivel.
)

echo.
echo [2/4] Instalando dependencias do backend...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo [ERRO] Falha no npm install do backend.
    pause & exit /b 1
)
echo [OK] Backend instalado.

echo.
echo [3/4] Configurando .env do backend...
if not exist .env (
    copy .env.example .env
    echo [OK] .env criado a partir de .env.example
    echo [ACAO] Edite backend/.env e preencha DATABASE_URL e JWT_SECRET antes de continuar.
) else (
    echo [OK] .env ja existe, mantendo.
)

echo.
echo [4/4] Gerando Prisma Client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo [ERRO] Falha no prisma generate.
    pause & exit /b 1
)
echo [OK] Prisma Client gerado.

cd ..

echo.
echo [5/5] Instalando dependencias do frontend...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo [ERRO] Falha no npm install do frontend.
    pause & exit /b 1
)

if not exist .env.local (
    copy .env.example .env.local
    echo [OK] .env.local criado.
)

cd ..

echo.
echo ============================================================
echo  Setup concluido!
echo ============================================================
echo.
echo Proximos passos:
echo  1. Edite backend/.env com DATABASE_URL e JWT_SECRET
echo  2. Rode a migracao: cd backend ^&^& npx prisma migrate dev --name init
echo  3. Backend:  cd backend ^&^& npm run start:dev    (porta 3001)
echo  4. Frontend: cd frontend ^&^& npm run dev          (porta 3000)
echo  5. Swagger:  http://localhost:3001/api/docs
echo.
pause
