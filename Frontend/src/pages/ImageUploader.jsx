import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import "../page_styling/imageUploader.css";
import tePNGLogo from "../assets/logo.png";

function ImageUploader({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [projectName, setProjectName] = useState("");
  const [clientName, setClientName] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [scale, setScale] = useState("1:100");
  const [floorImages, setFloorImages] = useState([
    { file: null, preview: null, imageWidth: 80 },
  ]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddLayer = () =>
    setFloorImages([...floorImages, { file: null, preview: null, imageWidth: 80 }]);

  const handleRemoveLayer = (index) =>
    setFloorImages(floorImages.filter((_, i) => i !== index));

  const handleImageChange = (event, index) => {
    const file = event.target.files[0];
    if (!file) return;
    if (file.type !== "image/png" && file.type !== "image/jpeg") {
      alert("Please select a .png or .jpg file only.");
      return;
    }
    const preview = URL.createObjectURL(file);
    const updated = [...floorImages];
    updated[index] = { file, preview, imageWidth: 80 };
    setFloorImages(updated);
  };

  const handleWheel = (event, index) => {
    const zoomSpeed = 5;
    const updated = [...floorImages];
    updated[index].imageWidth = Math.max(
      10,
      Math.min(
        300,
        updated[index].imageWidth + (event.deltaY < 0 ? zoomSpeed : -zoomSpeed)
      )
    );
    setFloorImages(updated);
  };

  const handleSubmit = async () => {
    if (!projectName || !clientName || !address)
      return setError("Please fill all required fields.");
    if (floorImages.every((f) => !f.file))
      return setError("Please upload at least one floor image.");

    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("Title", projectName);
      formData.append("ClientName", clientName);
      formData.append("Address", address);
      formData.append("Description", description);
      formData.append("Scale", scale);
      floorImages.forEach((f) => f.file && formData.append("FloorImages", f.file));

      const res = await api.post("/api/projects/create", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess("Project created successfully!");
      setTimeout(() => {
        navigate("/app/design", { state: { projectId: res.data.projectID } });
      }, 1500);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.title ||
          "Failed to create project"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-layout">
      {/* Sidebar */}
      <aside className="upload-sidebar">
        <img src={tePNGLogo} alt="Logo" className="upload-logo" />
        <nav className="sidebar-nav">
          <button onClick={() => navigate("/app/dashboard")} className="sidebar-btn">📂 Dashboard</button>
          <button onClick={() => navigate("/app/upload")} className={`sidebar-btn ${location.pathname === "/app/upload" ? "active" : ""}`}>➕ New Project</button>
          <button onClick={() => navigate("/app/projects")} className="sidebar-btn">📂 View Projects</button>
        </nav>
        <button onClick={onLogout} className="logout-button">Logout</button>
      </aside>

      {/* Main Content */}
      <main className="upload-main">
        <h1>Create New Design Project</h1>

        <div className="upload-card">
          <h3>Project Specifications</h3>
          <div className="form-grid">
            <div className="input-group">
              <label>Project Name *</label>
              <input type="text" placeholder="e.g. Warehouse Security" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Client Name *</label>
              <input type="text" placeholder="e.g. Acme Corp" value={clientName} onChange={(e) => setClientName(e.target.value)} />
            </div>
          </div>

          <div className="input-group">
            <label>Site Address *</label>
            <textarea placeholder="Full site location" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          <div className="form-grid">
            <div className="input-group">
              <label>Description</label>
              <input type="text" placeholder="Optional notes" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Initial Scale</label>
              <input type="text" placeholder="1:100" value={scale} onChange={(e) => setScale(e.target.value)} />
            </div>
          </div>

          <hr className="form-divider" />

          <h3>Floor Plans & Layers</h3>
          {floorImages.map((layer, index) => (
            <div key={index} className="layer-section">
              <div className="layer-header">
                <span>Floor Level / Layer {index + 1}</span>
                <div className="layer-actions">
                  <input type="file" accept="image/png, image/jpeg" id={`file-${index}`} onChange={(e) => handleImageChange(e, index)} style={{ display: "none" }} />
                  <label htmlFor={`file-${index}`} className="file-label">Choose File</label>
                  {floorImages.length > 1 && (
                    <button onClick={() => handleRemoveLayer(index)} className="remove-btn">Remove</button>
                  )}
                </div>
              </div>

              {layer.preview && (
                <div className="image-preview-container">
                  <p className="hint">Scroll on image to resize preview</p>
                  <img src={layer.preview} alt="Preview" style={{ width: `${layer.imageWidth}%` }} onWheel={(e) => handleWheel(e, index)} />
                </div>
              )}
            </div>
          ))}

          <button onClick={handleAddLayer} className="add-layer-btn">➕ Add Another Floor</button>

          {error && <div className="error-box">{error}</div>}
          {success && <div className="success-box">{success}</div>}

          <div className="form-footer">
            <button onClick={handleSubmit} disabled={loading} className="submit-btn">
              {loading ? "Processing..." : "Generate Project"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ImageUploader;