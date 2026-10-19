@echo off
title El Vengador del Desierto - Servidor Virtual
color 0A
echo ================================================================
echo    EL VENGADOR DEL DESIERTO: LA FURIA DE LOS 3 OJOS
echo ================================================================
echo Iniciando servidor en el entorno virtual (.venv)...
echo.
if not exist ".venv\Scripts\python.exe" (
    echo [ERROR] No se encontro el entorno virtual en .venv
    echo Creando entorno virtual...
    python -m venv .venv
    .venv\Scripts\pip install -r requirements.txt
)
.venv\Scripts\python.exe server.py
pause
