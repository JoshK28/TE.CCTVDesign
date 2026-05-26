@echo off
echo ========================================
echo    TE.CCTVDesign - Starting Application
echo ========================================
echo.

cd /d "%~dp0Backend"

echo Starting TE.CCTVDesign...
start "TE.CCTVDesign" cmd /k "dotnet run & pause & exit"

echo Waiting for application to start...
timeout /t 6 /nobreak > nul

start "" "http://localhost:5113"

exit