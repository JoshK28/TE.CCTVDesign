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
        if (page > updatedTotalPages) {
          setPage(updatedTotalPages);
        }
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
    setError("");
    try {
      const res = await api.put(`/api/projects/${project.projectID}`, {
        title,
        address,
        description,
      });

      setProjects((prev) =>
        prev.map((item) =>
          item.projectID === project.projectID
            ? {
                ...item,
                title: res.data.title,
                address: res.data.address,
                description: res.data.description,
              }
            : item
        )
      );
    } catch (err) {
      setError("Failed to update project");
    } finally {
      setEditingId(null);
    }
  };

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
              {pagedProjects.map((project) => (
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
                    <button
                      className="table-btn"
                      onClick={() => handleEditProject(project)}
                      disabled={editingId === project.projectID}
                      style={{ marginLeft: "8px" }}
                    >
                      {editingId === project.projectID ? "Saving..." : "Edit"}
                    </button>
                    <button
                      className="table-btn"
                      onClick={() => handleDeleteProject(project.projectID)}
                      disabled={deletingId === project.projectID}
                      style={{ marginLeft: "8px" }}
                    >
                      {deletingId === project.projectID ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && projects.length > 0 && (
          <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "16px" }}>
            <button
              className="table-btn"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <span style={{ alignSelf: "center" }}>
              Page {page} of {totalPages}
            </span>
            <button
              className="table-btn"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default ProjectList;
