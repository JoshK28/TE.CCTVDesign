import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import "../page_styling/projectList.css";
import tePNGLogo from "../assets/logo.png";

function ProjectList({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch all projects when the page loads
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get("/api/projects");
        setProjects(res.data);
      } catch (err) {
        setError("Failed to load projects");
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  return (
    <div className="project-dashboard">
      {/* Sidebar */}
      <aside className="project-sidebar">
        <img src={tePNGLogo} alt="Logo" className="project-logo" />

        <nav className="sidebar-nav">
          <button
            onClick={() => navigate("/app/dashboard")}
            className="sidebar-btn"
          >
            ⬅ Back to Dashboard
          </button>
          <button
            onClick={() => navigate("/app/upload")}
            className={`sidebar-btn ${
              location.pathname === "/app/upload" ? "active" : ""
            }`}
          >
            📁 New Project
          </button>
        </nav>

        <button onClick={onLogout} className="logout-button">
          Logout
        </button>
      </aside>

      {/* Main content */}
      <main className="project-main">
        <h1>Projects</h1>

        {loading && <p>Loading projects...</p>}
        {error && <p className="error">{error}</p>}

        {!loading && projects.length === 0 && (
          <p>No projects found. Create a new project to get started!</p>
        )}

        {!loading && projects.length > 0 && (
          <table className="project-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Address</th>
                <th>Description</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.projectID}>
                  <td>{project.title}</td>
                  <td>{project.address}</td>
                  <td>{project.description}</td>
                  <td>
                    <button
                      className="table-btn"
                      onClick={() =>
                        navigate("/app/design", {
                          state: { projectId: project.projectID },
                        })
                      }
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}

export default ProjectList;
