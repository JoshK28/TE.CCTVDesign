@echo off
echo ========================================
echo    TE.CCTVDesign - First Time Setup
echo ========================================
echo.

cd /d "%~dp0"

echo [1/5] Installing EF Core tools...
dotnet tool install --global dotnet-ef
echo.

echo [2/5] Restoring backend packages...
cd Backend
dotnet restore
echo.

echo [3/5] Running database migrations + seeding cameras...
dotnet ef database update
echo.

echo [4/5] Installing frontend dependencies...
cd ..\Frontend
npm install
npm install axios
npm install primereact
npm install primeicons
echo.

echo [5/5] Setup complete!
echo.
echo IMPORTANT: Before running the app, make sure you have:
echo   1. Renamed appsettings.example.json to appsettings.json
echo   2. Updated the Server name in appsettings.json to YOUR-PC\SQLEXPRESS
echo.
echo Run 'run.bat' to start the application.
pause