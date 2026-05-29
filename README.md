# TE.CCTVDesign

A CCTV Design Tool built with React (frontend) and C# ASP.NET Core (backend).

## Requirements
- [.NET 10](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org/)
- [SQL Server Express](https://www.microsoft.com/en-us/sql-server/sql-server-downloads) (Basic installation only)
- [SQL Server Management Studio (SSMS)](https://learn.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms) (Optional — only needed if you want to inspect the database directly)

---

## First Time Setup

### Step 1: Find Your Machine Name

You will need your machine name to configure the database connection string.

1. Press **Windows + R**
2. Type `cmd` and press Enter
3. Type `hostname` and press Enter
4. Note down the name it returns (e.g. `CLIENT-PC`)

### Step 2: Configure appsettings.json

1. Navigate to the `Backend` folder
2. Copy `appsettings.example.json` and rename it to `appsettings.json`
3. Update the connection string with your machine name:
```json
"Default": "Server=YOUR-PC\\SQLEXPRESS;Database=cctvdesign;Trusted_Connection=True;TrustServerCertificate=True"
```
Replace `YOUR-PC` with the machine name from Step 1. That is the only thing that needs to change.

### Step 3: Start SQL Server Express

SQL Server Express should start automatically on boot. If it doesn't:

1. Press **Windows + R**
2. Type `services.msc` and press Enter
3. Find **SQL Server (SQLEXPRESS)** in the list
4. Right click it and select **Start**

### Step 4: Run the Installer

1. In the root of the project, double-click **`install.bat`**
2. This will automatically:
   - Install EF Core tools
   - Restore backend packages
   - Create the database and tables
   - Seed the 21 HikVision cameras
   - Install all frontend dependencies and build the frontend

---

## Running the Application

1. Double-click **`run.bat`**
2. A CMD window will open and start the application
3. The browser will open automatically at `http://localhost:5113`

To shut down, press **`Ctrl + C`** in the CMD window, press **`Y`** to confirm, then press any key to close the window.

---

## Receiving Updates

When a new version of the application is provided:

1. Replace the project files with the updated version
2. Double-click **`install.bat`** again to apply any database changes and rebuild the frontend
3. Double-click **`run.bat`** to start the application

---

## Database
- The database is created automatically when `install.bat` is run — no manual setup required
- Camera data (21 HikVision cameras) is automatically seeded into the database
- The only thing that changes between computers is the server name in the connection string

---

## Important Notes
- Never commit `appsettings.json` — it contains your server details and is excluded from Git
- Make sure SQL Server Express is running before starting the application
- The application runs on `http://localhost:5113`
- Swagger API documentation available at `http://localhost:5113/swagger`
- If Dotnet doesn't work in vscode terminal, change ASPNETCORE_ENVIRONMENT": "Production" to ASPNETCORE_ENVIRONMENT": "Development".
- ASPNETCORE_ENVIRONMENT": "Production" is a must so that project runs when install.bat and run.bat works
- YOU CAN'T update the Frontend of the project is its ran by install.bat and run.bat
