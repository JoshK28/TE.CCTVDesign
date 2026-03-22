import { useNavigate } from "react-router-dom";

function Dashboard({ onLogout }) {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>

      {/* logout button top right */}
      <div style={styles.topBar}>
        <button onClick={onLogout} style={styles.logoutButton}>
          Logout
        </button>
      </div>

      {/* main content */}
      <div style={styles.content}>
        <h2 style={styles.title}>Select Project</h2>

        {/* buttons container */}
        <div style={styles.buttonContainer}>

          {/* new project button */}
          <button onClick={() => navigate("/app/upload")} style={styles.projectButton}>
            <span style={styles.buttonTitle}>New Project</span>
            <span style={styles.buttonSubtitle}>Start a new Project</span>
          </button>

          {/* open project button */}
          <button onClick={() => navigate("/app/projects")} style={styles.projectButton}>
            <span style={styles.buttonTitle}>Open Project</span>
            <span style={styles.buttonSubtitle}>Open an existing Project</span>
          </button>

        </div>
      </div>
    </div>
  );
}

/* INLINE STYLE FOR NOW WILL GET CHANGE TO A SPEREATE FILE LATER */
const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column"
  },
  topBar: {
    display: "flex",
    justifyContent: "flex-end",
    padding: "10px 20px"
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
    justifyContent: "center",
    gap: "30px"
  },
  title: {
    fontSize: "24px",
    color: "#ffffff"
  },
  buttonContainer: {
    display: "flex",
    gap: "30px",
    justifyContent: "center"
  },
  projectButton: {
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
    gap: "10px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
  },
  buttonTitle: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#333"
  },
  buttonSubtitle: {
    fontSize: "14px",
    color: "#666"
  }
};

export default Dashboard;