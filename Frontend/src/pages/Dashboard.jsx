import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>Dashboad</h1>
      <p>Select Project</p>
      <div style={{ display: "flex", gap: "20px", justifyContent: "center", marginTop: "30px" }}>
        <button onClick={() => navigate("/login")} style={{ padding: "10px 30px", fontSize: "16px" }}>
          back
        </button>
        <button onClick={() => navigate("/ImageUploader")} style={{ padding: "10px 30px", fontSize: "16px" }}>
          Create Project
        </button>
      </div>
    </div>
  );
}

export default Home;