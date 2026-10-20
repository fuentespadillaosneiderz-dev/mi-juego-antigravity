@echo off
title El Vengador del Desierto - Servidor Virtual
color 0A
echo ================================================================
echo    EL VENGADOR DEL DESIERTO: LA FURIA DE LOS 3 OJOS
echo ================================================================
echo Iniciando servidor en el entorno virtual (.venv)...
echo.
if not exist ".venv\Scripts\python.exe" (
    echo [INFO] Creando entorno virtual .venv...
    python -m venv .venv
    .venv\Scripts\pip install -r requirements.txt
)
start http://localhost:5000
.venv\Scripts\python.exe server.py
pause
