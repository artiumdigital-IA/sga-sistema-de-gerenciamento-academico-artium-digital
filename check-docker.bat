@echo off
chcp 65001 >nul
set LOG=%~dp0docker-check.log
echo === DIAGNOSTICO DOCKER === > "%LOG%"
date /t >> "%LOG%"
time /t >> "%LOG%"

echo. >> "%LOG%"
echo --- docker version --- >> "%LOG%"
docker version >> "%LOG%" 2>&1

echo. >> "%LOG%"
echo --- docker ps --- >> "%LOG%"
docker ps >> "%LOG%" 2>&1

echo. >> "%LOG%"
echo --- docker compose (infra) --- >> "%LOG%"
cd /d "%~dp0infra"
docker compose ps >> "%LOG%" 2>&1

echo. >> "%LOG%"
echo --- subindo containers --- >> "%LOG%"
docker compose up -d >> "%LOG%" 2>&1

echo. >> "%LOG%"
echo --- aguardando 8s --- >> "%LOG%"
timeout /t 8 /nobreak >nul

echo. >> "%LOG%"
echo --- prisma migrate --- >> "%LOG%"
cd /d "%~dp0backend"
call npx prisma migrate dev --name init >> "%LOG%" 2>&1

echo. >> "%LOG%"
echo --- FIM --- >> "%LOG%"
echo Diagnostico salvo em docker-check.log
pause
