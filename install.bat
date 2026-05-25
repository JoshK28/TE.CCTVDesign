@echo off
echo ========================================
echo    TE.CCTVDesign - First Time Setup
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] Installing EF Core tools...
dotnet tool install --global dotnet-ef
echo.

echo [2/4] Restoring backend packages...
cd /d "%~dp0Backend"
dotnet restore
echo.

echo [3/4] Running database migrations + seeding cameras...
dotnet ef database update
echo.

echo [4/4] Installing and building frontend...
cd /d "%~dp0Frontend"
call npm install
call npm install axios
call npm install primereact
call npm install primeicons
call npm run build
echo.

echo Setup complete!
echo.
echo IMPORTANT: Before running the app, make sure you have:
echo   1. Renamed appsettings.example.json to appsettings.json
echo   2. Updated the Server name in appsettings.json to YOUR-PC\SQLEXPRESS
echo.
echo Run 'run.bat' to start the application.
pause