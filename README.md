# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.



# TE.CCTVDesign

A CCTV Design Tool built with React (frontend) and C# ASP.NET Core (backend).

## Requirements
- [.NET 10](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org/)
- [SQL Server Express](https://www.microsoft.com/en-us/sql-server/sql-server-downloads)
- [SQL Server Management Studio (SSMS)](https://learn.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms)

## Backend Setup
1. Open a terminal and navigate to the Backend folder:
```
cd Backend
```
2. Install the EF Core tools:
```
dotnet tool install --global dotnet-ef
```
3. Copy `appsettings.example.json` and rename it to `appsettings.json`
4. Find your SQL Server instance name by opening SSMS and checking the Server name field (e.g. `YOUR-PC\SQLEXPRESS`)
5. Update the connection string in `appsettings.json` with your server name:
```
"Default": "Server=YOUR-PC\\SQLEXPRESS;Database=cctvdesign;Trusted_Connection=True;TrustServerCertificate=True"
```
6. Run the following commands:
```
dotnet restore
dotnet ef database update
dotnet run
```
7. Backend will run on `http://localhost:5113`
8. Swagger available at `http://localhost:5113/swagger`

## Frontend Setup
1. Open a new terminal and navigate to the Frontend folder:
```
cd Frontend
```
2. Install dependencies:
```
npm install
```
3. Start the frontend:
```
npm run dev
```
4. Open `http://localhost:5173` in your browser

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