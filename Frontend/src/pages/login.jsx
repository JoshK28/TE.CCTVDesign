import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import './login.css';
import tePNGLogo from '../assets/tepng_logo.jpg';


/*
The login component provides an interface for users to login and access the project program. It sends the login details to the backend through an API call.
*/

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/api/auth/login", formData);
      
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("username", res.data.username);

      navigate("/app/dashboard");
    } catch (err) {
      setError(err.response?.data || "Login failed");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "250px" }}>
      <img src={tePNGLogo} width="750" height="300"></img>
      <h2>Login</h2>
      <form style={{ display: "flex", gap: "20px", justifyContent: "center", marginTop: "30px" }} onSubmit={handleLogin} className="login-form">
        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleChange}
          className="login-input"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          className="login-input"
        />
        <button type="submit" className="login-button">Login</button>
        <a href="register">Forgot Password</a>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

export default Login;
