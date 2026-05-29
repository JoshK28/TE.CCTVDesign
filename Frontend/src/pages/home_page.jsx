import { useNavigate } from "react-router-dom";
import "../page_styling/home_page.css";
import tePNGLogo from "../assets/logo.png";

/*
The Home component is the landing page for the CCTV Design Tool.
It matches the design of the login and register pages for a consistent UI.
*/

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="home-card">
        <img src={tePNGLogo} alt="CCTV Design Tool logo" className="home-logo" />
        <h1 className="home-title">CCTV Design Tool</h1>
        <p className="home-text">Please login or register to continue</p>

        <div className="home-buttons">
          <button
            onClick={() => navigate("/login")}
            className="home-login-button"
          >
            Login
          </button>

          <button
            onClick={() => navigate("/register")}
            className="home-register-button"
          >
            Register
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;
