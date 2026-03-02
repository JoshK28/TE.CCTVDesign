import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>CCTV Design Tool</h1>
      <p>Please login or register to continue</p>
      <div style={{ display: "flex", gap: "20px", justifyContent: "center", marginTop: "30px" }}>
        <button onClick={() => navigate("/login")} style={{ padding: "10px 30px", fontSize: "16px" }}>
          Login
        </button>
        <button onClick={() => navigate("/register")} style={{ padding: "10px 30px", fontSize: "16px" }}>
          Register
        </button>
      </div>
    </div>
  );
}

export default Home;