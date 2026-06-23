@echo off
title FIURJ Backend (porta 3001)
cd /d "%~dp0backend"
echo Iniciando backend NestJS...
echo Swagger: http://localhost:3001/api/docs
echo.
call npm run start:dev
