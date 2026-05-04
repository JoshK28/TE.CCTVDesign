import { useLocation, useNavigate } from "react-router-dom";
import "../page_styling/dashboard.css";
import tePNGLogo from "../assets/logo.png";

function Dashboard({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="dashboard-layout">
      {/* Fixed Sidebar Navigation */}
      <aside className="dashboard-sidebar">
        <div className="logo-container">
          <img src={tePNGLogo} alt="Logo" className="dashboard-logo" />
        </div>

        <nav className="dashboard-nav">
          <button 
            onClick={() => navigate("/app/projects")} 
            className={`sidebar-btn ${location.pathname.includes("projects") ? "active" : ""}`}
          >
            📂 Projects
          </button>
          
          <button 
            onClick={() => navigate("/app/calculator")} 
            className={`sidebar-btn ${location.pathname.includes("calculator") ? "active" : ""}`}
          >
            📊 Storage Calculator
          </button>

          <button 
            onClick={() => navigate("/app/ups")} 
            className={`sidebar-btn ${location.pathname.includes("ups") ? "active" : ""}`}
          >
            🔋 UPS Calculator
          </button>

          <button 
            onClick={() => navigate("/app/bom")} 
            className={`sidebar-btn ${location.pathname.includes("bom") ? "active" : ""}`}
          >
            📦 Bill of Materials
          </button>
        </nav>

        <button onClick={onLogout} className="logout-button">
          Logout
        </button>
      </aside>

      {/* Main Content Area */}
      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="status-badge">System Ready</div>
        </header>

        <section className="dashboard-content">
          <div className="welcome-card">
            <h1>CCTV Design Suite</h1>
            <p>Welcome back. Select a tool from the sidebar to start your system calculations or manage existing projects.</p>
            
            <div className="quick-actions">
              <button onClick={() => navigate("/app/calculator")} className="action-card">
                <h3>New Calculation</h3>
                <p>Estimate storage & bandwidth</p>
              </button>
              <button onClick={() => navigate("/app/bom")} className="action-card">
                <h3>Generate BOM</h3>
                <p>Create a Bill of Materials</p>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;