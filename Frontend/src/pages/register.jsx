import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import './page_styling/register.css';
import tePNGLogo from '../assets/tepng_logo.jpg';

/*The Register component provides an interface for users to register and create an account for the CCTV Design Tool. It sends the registration details to the backend through an API call.
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
    try {
      const res = await api.post("/api/auth/register", formData);
      setSuccess(res.data);
      setError("");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.response?.data || "Registration failed");
      setSuccess("");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "250px" }}>
      <img src={tePNGLogo} width="750" height="300"></img>
      <h2>Register</h2>
      <form style={{ display: "flex", gap: "20px", justifyContent: "center", marginTop: "30px" }} onSubmit={handleRegister} className="register-form">
        <input
          type="text"
          name="username"
          placeholder="Username"
          onChange={handleChange}
          className="register-input1"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleChange}
          className="register-input2"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          className="register-input3"
        />
        <button type="submit" className="register-button">Register</button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}
    </div>
  );
}

export default Register;