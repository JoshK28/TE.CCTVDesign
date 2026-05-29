import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import AppLayout from "../Components/AppLayout";
import "../page_styling/projectList.css";

const NAV = [
  { label: "⬅ Back to Dashboard", to: "/app/dashboard" },
  { label: "📁 New Project", to: "/app/upload" },
];

const parseLastEdited = (value) => {
  if (value == null || value === "") return null;
  const text = String(value).trim();
  if (!text) return null;
  // API stores UTC; naive timestamps without offset must be parsed as UTC, not local
  const hasOffset = /[Zz]$|[+-]\d{2}:\d{2}$/.test(text);
  const date = new Date(hasOffset ? text : `${text}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatLastEdited = (value) => {
  const date = parseLastEdited(value);
  if (!date) return "—";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

/*
The ProjectList component fetches the current user's projects from the backend
and renders them in a table. From here a user can open a project in the design
page, edit project metadata via a popup, or delete a project after confirmation.
*/
function ProjectList({ onLogout }) {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editProject, setEditProject] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    clientName: "",
    address: "",
    description: "",
    scale: "1:100",
  });
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [deleteProjectId, setDeleteProjectId] = useState(null);

  useEffect(() => {
    void fetchProjects();
  }, []);

  // Loads the list of projects belonging to the authenticated user. Called on
  // first render and whenever the project list needs to be refreshed.
  const fetchProjects = async () => {
    try {
      const res = await api.get("/api/projects");
      setProjects(res.data);
    } catch {
      setError("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  // Opens the edit modal pre-populated with the selected project's details.
  const handleEditClick = (project) => {
    setEditProject(project);
    setEditForm({
      title: project.title,
      clientName: project.clientName ?? "",
      address: project.address,
      description: project.description,
      scale: project.scale ?? "1:100",
    });
    setEditError("");
    setEditSuccess("");
  };

  const closeEditModal = () => {
    setEditProject(null);
    setEditError("");
    setEditSuccess("");
  };

  // Validates required fields, PUTs the updated project to the backend and
  // patches the local list so the UI reflects the change without a full reload.
  const handleEditSave = async () => {
    if (!editForm.title) return setEditError("Project name is required");
    if (!editForm.clientName) return setEditError("Client name is required");
    if (!editForm.address) return setEditError("Address is required");

    try {
      const res = await api.put(`/api/projects/${editProject.projectID}`, editForm);
      setEditSuccess("Project updated successfully!");
      setProjects((prev) =>
        prev.map((p) =>
          p.projectID === editProject.projectID
            ? { ...p, ...editForm, lastEditedAt: res.data?.lastEditedAt ?? p.lastEditedAt }
            : p
        )
      );
      setTimeout(closeEditModal, 1500);
    } catch {
      setEditError("Failed to update project");
    }
  };

  // Deletes the project identified by `deleteProjectId` after the user
  // confirms in the delete-confirmation popup, then removes it from local state.
  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/api/projects/${deleteProjectId}`);
      setProjects((prev) => prev.filter((p) => p.projectID !== deleteProjectId));
      setDeleteProjectId(null);
    } catch {
      setError("Failed to delete project");
      setDeleteProjectId(null);
    }
  };

  return (
    <AppLayout nav={NAV} onLogout={onLogout} mainClassName="project-main">
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
              <th>Last edited</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.projectID}>
                <td>{project.title}</td>
                <td>{project.address}</td>
                <td>{project.description}</td>
                <td>{formatLastEdited(project.lastEditedAt)}</td>
                <td style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
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
                    type="button"
                    className="table-btn edit-btn"
                    onClick={() => handleEditClick(project)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
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

      {editProject && (
        <div style={overlayStyles.overlay}>
          <div style={overlayStyles.popup}>
            <h2>Edit Project</h2>
            <label style={overlayStyles.label}>Project Name *</label>
            <input
              type="text"
              placeholder="Project Name"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              style={overlayStyles.input}
            />
            <label style={overlayStyles.label}>Client Name *</label>
            <input
              type="text"
              placeholder="Client Name"
              value={editForm.clientName}
              onChange={(e) => setEditForm({ ...editForm, clientName: e.target.value })}
              style={overlayStyles.input}
            />
            <label style={overlayStyles.label}>Address *</label>
            <textarea
              placeholder="Address"
              value={editForm.address}
              onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
              style={{ ...overlayStyles.input, height: "80px", resize: "vertical" }}
            />
            <label style={overlayStyles.label}>Description</label>
            <input
              type="text"
              placeholder="Description (optional)"
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              style={overlayStyles.input}
            />
            <label style={overlayStyles.label}>Scale</label>
            <input
              type="text"
              placeholder="Scale e.g. 1:100"
              value={editForm.scale}
              onChange={(e) => setEditForm({ ...editForm, scale: e.target.value })}
              style={overlayStyles.input}
            />
            {editError && <p style={{ color: "red" }}>{editError}</p>}
            {editSuccess && <p style={{ color: "green" }}>{editSuccess}</p>}
            <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
              <button type="button" className="table-btn" onClick={handleEditSave}>
                Save
              </button>
              <button
                type="button"
                className="table-btn delete-btn"
                onClick={closeEditModal}
                style={{ color: "black" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteProjectId && (
        <div style={overlayStyles.overlay}>
          <div style={overlayStyles.popup}>
            <h2>Delete Project</h2>
            <p>Are you sure you want to delete this project? This cannot be undone.</p>
            <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
              <button
                type="button"
                className="table-btn delete-btn"
                onClick={handleDeleteConfirm}
                style={{ color: "black" }}
              >
                Yes, Delete
              </button>
              <button
                type="button"
                className="table-btn"
                onClick={() => setDeleteProjectId(null)}
                style={{ color: "black" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
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
    zIndex: 2000,
  },
  popup: {
    backgroundColor: "white",
    color: "black",
    padding: "30px",
    borderRadius: "10px",
    width: "500px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    maxHeight: "80vh",
    overflowY: "auto",
  },
  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    fontSize: "14px",
    boxSizing: "border-box",
    color: "black",
  },
  label: {
    fontSize: "13px",
    fontWeight: "bold",
    color: "#333",
  },
};

export default ProjectList;
