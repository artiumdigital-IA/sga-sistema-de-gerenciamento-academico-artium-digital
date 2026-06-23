@echo off
chcp 65001 >nul
echo ============================================================
echo  FIURJ -- Docker + Prisma Migrate
echo ============================================================

:: Subir PostgreSQL + Redis
echo [1/2] Subindo containers (PostgreSQL + Redis)...
cd /d "%~dp0infra"
docker compose up -d
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao subir containers.
    echo Verifique se o Docker Desktop esta rodando.
    pause & exit /b 1
)
echo [OK] Containers rodando.

:: Aguardar PostgreSQL estar pronto
echo Aguardando PostgreSQL ficar pronto...
timeout /t 5 /nobreak >nul

:: Rodar migração
echo [2/2] Rodando prisma migrate dev...
cd /d "%~dp0backend"
call npx prisma migrate dev --name init
if %errorlevel% neq 0 (
    echo [ERRO] Falha na migração.
    pause & exit /b 1
)

echo.
echo ============================================================
echo  Banco configurado!
echo  Para iniciar o backend: npm run start:dev (porta 3001)
echo  Swagger: http://localhost:3001/api/docs
echo ============================================================
pause
