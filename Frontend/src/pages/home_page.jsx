import { useNavigate } from "react-router-dom";
import './home_page.css';
import tePNGLogo from '../assets/tepng_logo.jpg';

/*
The Home component serves as the landing page for the CCTV Design Tool, providing users with options to navigate to the login or registration pages. 
*/

function Home() {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: "center", marginTop: "200px" }}>
      <img src={tePNGLogo} width="750" height="300" ></img> 
      <h1>CCTV Design Tool</h1>
      <p>Please login or register to continue</p>
      <div style={{ display: "flex", gap: "50px", justifyContent: "center", marginTop: "30px" }}>
        
        <button 
        onClick={() => navigate("/login")}  
        className="login-nav-button"
        style={{ padding: "10px 30px", fontSize: "16px"  }} > 
          Login
        </button>
        
        <button 
        onClick={() => navigate("/register")}
        className="register-nav-button" 
        style={{ padding: "10px 30px", fontSize: "16px" }} >
          Register
        </button>


        {/*testing purposes only, to be removed in final version*/}
        <button onClick={() => navigate("/imageUploader")} style={{ padding: "10px 30px", fontSize: "16px" }}>
          Testing button to image Uploader
        </button>
      </div>
    </div>
  );
}

export default Home;