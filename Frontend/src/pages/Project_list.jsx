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

  // edit popup state
  const [editProject, setEditProject] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", address: "", description: "" });
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");

  // delete confirmation state
  const [deleteProjectId, setDeleteProjectId] = useState(null);

  // fetch all projects when the page loads
  useEffect(() => {
    fetchProjects();
  }, []);

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

  // open edit popup with current project details
  const handleEditClick = (project) => {
    setEditProject(project);
    setEditForm({
      title: project.title,
      address: project.address,
      description: project.description
    });
    setEditError("");
    setEditSuccess("");
  };

  // save edited project
  const handleEditSave = async () => {
    if (!editForm.title) return setEditError("Project name is required");
    if (!editForm.address) return setEditError("Address is required");

    try {
      await api.put(`/api/projects/${editProject.projectID}`, editForm);
      setEditSuccess("Project updated successfully!");

      // update the project in the list
      setProjects(prev => prev.map(p =>
        p.projectID === editProject.projectID
          ? { ...p, ...editForm }
          : p
      ));

      // close popup after 1.5 seconds
      setTimeout(() => {
        setEditProject(null);
        setEditSuccess("");
      }, 1500);
    } catch (err) {
      setEditError("Failed to update project");
    }
  };

  // delete project
  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/api/projects/${deleteProjectId}`);
      setProjects(prev => prev.filter(p => p.projectID !== deleteProjectId));
      setDeleteProjectId(null);
    } catch (err) {
      setError("Failed to delete project");
      setDeleteProjectId(null);
    }
  };

  return (
    <div className="project-dashboard">
      {/* Sidebar */}
      <aside className="project-sidebar">
        <img src={tePNGLogo} alt="Logo" className="project-logo" />

        <nav className="sidebar-nav">
          <button onClick={() => navigate("/app/dashboard")} className="sidebar-btn">
            ⬅ Back to Dashboard
          </button>
          <button
            onClick={() => navigate("/app/upload")}
            className={`sidebar-btn ${location.pathname === "/app/upload" ? "active" : ""}`}
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
                  <td style={{ display: "flex", gap: "8px" }}>
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
                      className="table-btn edit-btn"
                      onClick={() => handleEditClick(project)}
                    >
                      Edit
                    </button>
                    <button
                      className="table-btn delete-btn"
                      onClick={() => setDeleteProjectId(project.projectID)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>

      {/* Edit Popup */}
      {editProject && (
        <div style={overlayStyles.overlay}>
          <div style={overlayStyles.popup}>
            <h2>Edit Project</h2>

            <input
              type="text"
              placeholder="Project Name"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              style={overlayStyles.input}
            />
            <input
              type="text"
              placeholder="Address"
              value={editForm.address}
              onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
              style={overlayStyles.input}
            />
            <input
              type="text"
              placeholder="Description"
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              style={overlayStyles.input}
            />

            {editError && <p style={{ color: "red" }}>{editError}</p>}
            {editSuccess && <p style={{ color: "green" }}>{editSuccess}</p>}

            <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
              <button className="table-btn" onClick={handleEditSave}>
                Save
              </button>
              <button
                className="table-btn delete-btn"
                onClick={() => setEditProject(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Popup */}
      {deleteProjectId && (
        <div style={overlayStyles.overlay}>
          <div style={overlayStyles.popup}>
            <h2>Delete Project</h2>
            <p>Are you sure you want to delete this project? This cannot be undone.</p>

            <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
              <button className="table-btn delete-btn" onClick={handleDeleteConfirm}>
                Yes, Delete
              </button>
              <button className="table-btn" onClick={() => setDeleteProjectId(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const overlayStyles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000
  },
  popup: {
    backgroundColor: "white",
    color: "black",
    padding: "30px",
    borderRadius: "10px",
    width: "400px",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    fontSize: "14px",
    boxSizing: "border-box"
  }
};

export default ProjectList;