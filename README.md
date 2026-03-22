# TE.CCTVDesign

A CCTV Design Tool built with React (frontend) and C# ASP.NET Core (backend).

## Requirements
- [.NET 10](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org/)
- [SQL Server Express](https://www.microsoft.com/en-us/sql-server/sql-server-downloads) (Basic installation only)
- [SQL Server Management Studio (SSMS)](https://learn.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms) (Basic installation only)

## Backend Setup

### Step 1: Start SQL Server Express

Open SQL Server - if that doesnt work check do this

1. Press **Windows + R**
2. Type `services.msc` and press Enter
3. Find **SQL Server (SQLEXPRESS)** in the list
4. Right click it and select **Start**

### Step 2: Connect to SQL Server in SSMS
1. Open **SQL Server Management Studio (SSMS)**
2. When the Connect to Server window opens:
   - Click **Browse Network** to find your server
   - Select your server which will be named `YOUR-PC\SQLEXPRESS`
3. Under connection properties - then under encrypt - Check **Trust Server Certificate**
4. Click **Connect**

If you are unable to see the the SQL server in SQL server Mangemnet Studio you might have the wrong SQL server installed. Make sure its SQL Server Express

### Step 3: Set Up the Backend
1. Open a terminal and navigate to the Backend folder:
```
cd Backend
```
2. Install the EF Core tools:
```
dotnet tool install --global dotnet-ef
```
3. Copy `appsettings.example.json` and rename it to `appsettings.json`
4. Update the connection string in `appsettings.json` with your server name:
```
"Default": "Server=YOUR-PC\\SQLEXPRESS;Database=cctvdesign;Trusted_Connection=True;TrustServerCertificate=True"
Just need to change the "Server=YOUR-PC" Part 
```
5. Run the following commands:
```
dotnet restore
dotnet ef database update
dotnet run
```
6. Backend will run on `http://localhost:5113`
7. Swagger available at `http://localhost:5113/swagger`

## Frontend Setup
1. Open a new terminal and navigate to the Frontend folder:
```
cd Frontend
```
2. Install dependencies:
```
npm install

```
3. Install Dependencies 
```
(Only when for first install)
npm install axios 
npm install primereact
npm install primeicons

```
4. Start the frontend:
```
npm run dev
```
5. Open `http://localhost:5173` in your browser

## Database
- Running `dotnet ef database update` will automatically create the database and tables
- Camera data (21 HikVision cameras) will be automatically seeded into the database
- No manual data entry required

## Important Notes
- Never commit `appsettings.json` as it contains your server details
- The only thing that changes between computers is the server name in the connection string
- Backend runs on port 5113, frontend runs on port 5173 — do not change these
- Make sure both backend and frontend are running at the same time
- Make sure SQL Server is running before starting the backend