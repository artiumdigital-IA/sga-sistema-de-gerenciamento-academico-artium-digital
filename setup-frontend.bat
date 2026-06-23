@echo off
chcp 65001 >nul
echo ============================================================
echo  FIURJ -- npm install frontend
echo ============================================================

cd /d "%~dp0frontend"
echo Instalando dependencias do frontend...
call npm install
if %errorlevel% neq 0 (
    echo [ERRO] Falha no npm install do frontend.
    pause & exit /b 1
)
echo [OK] Frontend instalado.

if not exist .env.local (
    if exist .env.example (
        copy .env.example .env.local
        echo [OK] .env.local criado.
    )
)

echo.
echo ============================================================
echo  Frontend pronto! Para rodar:
echo    cd frontend ^&^& npm run dev   (porta 3000)
echo ============================================================
pause
