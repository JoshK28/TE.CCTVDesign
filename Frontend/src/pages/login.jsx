import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import '../page_styling/login.css';
import tePNGLogo from '../assets/logo.png';


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

  const formatApiError = (data) => {
    if (!data) return "Login failed";
    if (typeof data === "string") return data;
    if (typeof data === "object") {
      if (typeof data.message === "string") return data.message;
      if (typeof data.title === "string") return data.title;
    }
    return "Login failed";
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.password.trim()) {
      setError("Email and password are required");
      return;
    }
    if (!formData.email.includes("@")) {
      setError("Please enter a valid email address (the backend logs in with Email + Password).");
      return;
    }
    try {
      const res = await api.post("/api/auth/login", formData);
      
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("username", res.data.username);

      navigate("/app/dashboard");
    } catch (err) {
      setError(formatApiError(err.response?.data));
    }
  };
  return (
    <div className="auth-card">
      <div>
        <img src={tePNGLogo} className="logo"></img>
        <form style={{ display: "flex", gap: "20px", justifyContent: "center", marginTop: "30px" }} onSubmit={handleLogin} className="login-form">
          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            onChange={handleChange}
            className="login-input"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            onChange={handleChange}
            className="login-input"
          />
          <button type="submit" className="login-button">LOGIN</button>
          <br/>
          <a href="/register" className="forgot">Register</a>
        </form>

        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>
    </div>
  );
}

export default Login;
