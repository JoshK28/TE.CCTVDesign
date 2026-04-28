import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../page_styling/login.css"; // ⬅️ use the same CSS file as Login
import tePNGLogo from "../assets/logo.png";

/*
The Register component allows users to create a new account.
It reuses the same layout and styles as the Login component.
*/

function Register() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: ""
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.email.trim() || !formData.password.trim()) {
      setError("Username, email and password are required");
      setSuccess("");
      return;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      setSuccess("");
      return;
    }
    try {
      const res = await api.post("/api/auth/register", formData);
      setSuccess(res.data?.message || "Registration successful! Redirecting...");
      setError("");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
      setSuccess("");
    }
  };

  return (
    <div className="auth-card">
      <div>
        <img src={tePNGLogo} alt="Logo" className="logo" />
        <h2>Register</h2>

        <form className="login-form" onSubmit={handleRegister}>
          <input
            type="text"
            name="username"
            placeholder="Username"
            required
            onChange={handleChange}
            className="login-input"
          />
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
            minLength={8}
            onChange={handleChange}
            className="login-input"
          />
          <button type="submit" className="login-button">REGISTER</button>

          <br />
          <a href="/login" className="forgot">Already have an account? Login</a>
        </form>

        {error && <p style={{ color: "red" }}>{error}</p>}
        {success && <p style={{ color: "green" }}>{success}</p>}
      </div>
    </div>
  );
}

export default Register;
