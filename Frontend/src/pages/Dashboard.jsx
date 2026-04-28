import { useLocation, useNavigate } from "react-router-dom";
import "../page_styling/dashboard.css";
import tePNGLogo from "../assets/logo.png";

function Dashboard({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="dashboard-layout">
      {/* Sidebar navigation */}
      <aside className="dashboard-sidebar">
        <img src={tePNGLogo} alt="Logo" className="dashboard-logo" />

        <nav className="dashboard-nav">
          
      {/* Sidebar navigation
          <button
            onClick={() => navigate("/app/upload")}
            className="sidebar-btn"
          >
            📁 New Project
          </button>
           */}
          <button
            onClick={() => navigate("/app/projects")}
            className="sidebar-btn"
          >
            📂 Projects
          </button>
          <button
            onClick={() => navigate("/app/calculator")}
            className={`sidebar-btn ${location.pathname === "/app/calculator" ? "active" : ""}`}
          >
            📊 Storage Calculator
          </button>

          <button
            onClick={() => navigate("/app/ups")}
            className={`sidebar-btn ${location.pathname === "/app/ups" ? "active" : ""}`}
          >
            🔋 UPS Calculator
          </button>
          <button
            onClick={() => navigate("/app/bom")}
            className={`sidebar-btn ${location.pathname === "/app/bom" ? "active" : ""}`}
          >
            📦 Bill of Materials
          </button>

        </nav>
      </aside>

      {/* Main content area */}
      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <button onClick={onLogout} className="logout-button">
            Logout
          </button>
        </header>

        <section className="dashboard-content">
          <h1>Welcome to the CCTV Design Tool</h1>
          <p>Select an option from the side menu to begin.</p>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
