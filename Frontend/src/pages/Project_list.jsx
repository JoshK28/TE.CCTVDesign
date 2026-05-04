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
  const [deletingId, setDeletingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [page, setPage] = useState(1);

  const PAGE_SIZE = 8;

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

  const totalPages = Math.max(1, Math.ceil(projects.length / PAGE_SIZE));
  const pagedProjects = projects.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDeleteProject = async (projectId) => {
    const confirmed = window.confirm("Delete this project? This action cannot be undone.");
    if (!confirmed) return;

    setDeletingId(projectId);
    setError("");
    try {
      await api.delete(`/api/projects/${projectId}`);
      setProjects((prev) => {
        const updated = prev.filter((p) => p.projectID !== projectId);
        const updatedTotalPages = Math.max(1, Math.ceil(updated.length / PAGE_SIZE));
        if (page > updatedTotalPages) setPage(updatedTotalPages);
        return updated;
      });
    } catch (err) {
      setError("Failed to delete project");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditProject = async (project) => {
    const title = window.prompt("Project title", project.title ?? "");
    if (title === null) return;
    const address = window.prompt("Project address", project.address ?? "");
    if (address === null) return;
    const description = window.prompt("Project description", project.description ?? "");
    if (description === null) return;

    setEditingId(project.projectID);
    try {
      const res = await api.put(`/api/projects/${project.projectID}`, { title, address, description });
      setProjects((prev) =>
        prev.map((item) =>
          item.projectID === project.projectID ? { ...item, ...res.data } : item
        )
      );
    } catch (err) {
      setError("Failed to update project");
    } finally {
      setEditingId(null);
    }
  };

  return (
    <div className="project-layout">
      {/* Sidebar - Consistent with Dashboard */}
      <aside className="project-sidebar">
        <img src={tePNGLogo} alt="Logo" className="project-logo" />
        <nav className="sidebar-nav">
          <button onClick={() => navigate("/app/dashboard")} className="sidebar-btn">📂 Dashboard</button>
          <button onClick={() => navigate("/app/upload")} className="sidebar-btn active">➕ New Project</button>
          <button onClick={() => navigate("/app/calculator")} className="sidebar-btn">📊 Storage Calculator</button>
          <button onClick={() => navigate("/app/ups")} className="sidebar-btn">🔋 UPS Calculator</button>
        </nav>
        <button onClick={onLogout} className="logout-button">Logout</button>
      </aside>

      {/* Main content offset for fixed sidebar */}
      <main className="project-main">
        <h1>Project Management</h1>

        {error && <p className="error-message">{error}</p>}

        <div className="project-card-container">
          {loading ? (
            <p>Loading projects...</p>
          ) : projects.length === 0 ? (
            <p>No projects found. Create a new project to get started!</p>
          ) : (
            <>
              <table className="project-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Address</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedProjects.map((project) => (
                    <tr key={project.projectID}>
                      <td className="bold-text">{project.title}</td>
                      <td>{project.address}</td>
                      <td>{project.description}</td>
                      <td className="table-actions">
                        <button className="open-btn" onClick={() => navigate("/app/design", { state: { projectId: project.projectID } })}>Open</button>
                        <button className="edit-btn" onClick={() => handleEditProject(project)} disabled={editingId === project.projectID}>{editingId === project.projectID ? "..." : "Edit"}</button>
                        <button className="delete-btn" onClick={() => handleDeleteProject(project.projectID)} disabled={deletingId === project.projectID}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="pagination">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</button>
                <span>Page {page} of {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default ProjectList;