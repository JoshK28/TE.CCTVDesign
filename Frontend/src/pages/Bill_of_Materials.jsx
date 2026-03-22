import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>Bill of Materials</h1>
      <div style={{ display: "flex", gap: "20px", justifyContent: "center", marginTop: "30px" }}>
        <button onClick={() => navigate("/DesignPage")} style={{ padding: "10px 30px", fontSize: "16px" }}>
          Design Page
        </button>
      </div>
    </div>
  );
}

export default Home;