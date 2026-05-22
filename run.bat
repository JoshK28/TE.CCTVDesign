@echo off
echo ========================================
echo    TE.CCTVDesign - Starting Application
echo ========================================
echo.

cd /d "%~dp0"

set ASPNETCORE_ENVIRONMENT=Development

echo Starting TE.CCTVDesign...
cd Backend
dotnet run

pause