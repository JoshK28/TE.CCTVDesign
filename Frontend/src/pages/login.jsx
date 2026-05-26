import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import '../page_styling/login.css';
import tePNGLogo from '../assets/logo.png';

/*
The Login component renders the login form, authenticates the user against the
backend, stores the returned token/username in localStorage, and notifies the
parent (App) so it can flip the app into the logged-in state.
*/
function Login({ onLogin }) {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Keep the form state in sync with the controlled email/password inputs.
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Submits credentials to /api/auth/login, persists the JWT token on success
  // and navigates the user to the dashboard. Any error from the API is shown
  // beneath the form.
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/api/auth/login", formData);
      
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("username", res.data.username);

      onLogin();
      navigate("/app/dashboard");
    } catch (err) {
      setError(err.response?.data || "Login failed");
    }
  };
  return (
    <div className="auth-card">
      <div>
        <img src={tePNGLogo} className="logo" />
        <form onSubmit={handleLogin} className="login-form">
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
          <button type="submit" className="login-button">LOGIN</button>
          <button type="button" onClick={() => navigate('/')} className="back-to-home-button">
            &larr; BACK TO HOME
          </button>
        </form>

        {error && <p style={{ color: "red" }}>{error}</p>}
        <a href="register" className="forgot">Forgot Password?</a>
      </div>
    </div>
  );
}

export default Login;