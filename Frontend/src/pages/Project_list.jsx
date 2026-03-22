import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function ProjectList({ onLogout }) {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // fetch all projects from the backend when the page loads
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get("/api/projects");
        setProjects(res.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to load projects");
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return (
    <div style={styles.container}>

      {/* top bar */}
      <div style={styles.topBar}>
        <button onClick={() => navigate("/app/dashboard")} style={styles.backButton}>
          &larr; Back
        </button>
        <button onClick={onLogout} style={styles.logoutButton}>
          Logout
        </button>
      </div>

      {/* main content */}
      <div style={styles.content}>
        <h2 style={styles.title}>Projects</h2>

        {/* loading state */}
        {loading && <p>Loading projects...</p>}

        {/* error state */}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {/* empty state */}
        {!loading && projects.length === 0 && (
          <p>No projects found. Create a new project to get started!</p>
        )}

        {/* projects list */}
        <div style={styles.projectGrid}>
          {projects.map((project) => (
            <button
              key={project.projectID}
              onClick={() => navigate("/app/design", { state: { projectId: project.projectID } })}
              style={styles.projectCard}
            >
              <span style={styles.projectTitle}>{project.title}</span>
              <span style={styles.projectDetail}>{project.address}</span>
              <span style={styles.projectDetail}>{project.description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column"
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 20px"
  },
  backButton: {
    padding: "8px 20px",
    backgroundColor: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "14px"
  },
  logoutButton: {
    padding: "8px 20px",
    backgroundColor: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "14px"
  },
  content: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "20px",
    gap: "20px"
  },
  title: {
    fontSize: "24px",
    color: "#333"
  },
  projectGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "20px",
    justifyContent: "center"
  },
  projectCard: {
    width: "200px",
    height: "150px",
    backgroundColor: "#f0f0f0",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
  },
  projectTitle: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#333"
  },
  projectDetail: {
    fontSize: "13px",
    color: "#666"
  }
};

export default ProjectList;