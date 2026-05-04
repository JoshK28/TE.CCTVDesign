import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import "../page_styling/imageUploader.css";
import tePNGLogo from "../assets/logo.png";

function ImageUploader({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    projectName: "",
    clientName: "",
    address: "",
    description: "",
    scale: "1:100",
  });
  const [floorImages, setFloorImages] = useState([
    { file: null, preview: null, imageWidth: 80 },
  ]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showScalingStep, setShowScalingStep] = useState(false);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

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
    if (!form.projectName || !form.clientName || !form.address)
      return setError("Please fill all required fields.");
    if (floorImages.every((f) => !f.file))
      return setError("Please upload at least one floor image.");

    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("Title", form.projectName);
      formData.append("ClientName", form.clientName);
      formData.append("Address", form.address);
      formData.append("Description", form.description);
      formData.append("Scale", form.scale);
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

  const handleOpenScalingStep = () => {
    if (!form.projectName || !form.clientName || !form.address) {
      setError("Please fill all required fields.");
      return;
    }
    if (floorImages.every((f) => !f.file)) {
      setError("Please upload at least one floor image.");
      return;
    }
    setError("");
    setShowScalingStep(true);
  };

  return (
    <div className="upload-layout">
      {/* Sidebar */}
      <aside className="upload-sidebar">
        <img src={tePNGLogo} alt="Logo" className="upload-logo" />

        <nav className="sidebar-nav">
          
          <button
            onClick={() => navigate("/app/dashboard")}
            className="sidebar-btn"
          >
            ⬅ Back to Dashboard
          </button>
          
          <button
            onClick={() => navigate("/app/upload")}
            className={`sidebar-btn ${
              location.pathname === "/app/upload" ? "active" : ""
            }`}
          >
            📁 New Project
          </button>

          <button
            onClick={() => navigate("/app/projects")}
            className={`sidebar-btn ${
              location.pathname === "/app/projects" ? "active" : ""
            }`}
          >
            📂 View Projects
          </button>
        </nav>

        <button onClick={onLogout} className="logout-button">
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="upload-main">
        <h1>Create Project</h1>

        <div className="form-container">
          {/* Project details */}
          <div className="form-row">
            <input
              type="text"
              placeholder="Project Name"
              value={form.projectName}
              onChange={(e) => setField("projectName", e.target.value)}
            />
            <input
              type="text"
              placeholder="Client Name"
              value={form.clientName}
              onChange={(e) => setField("clientName", e.target.value)}
            />
          </div>

          <textarea
            placeholder="Address"
            value={form.address}
            onChange={(e) => setField("address", e.target.value)}
          />

          <div className="form-row">
            <input
              type="text"
              placeholder="Description (optional)"
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
            />
          </div>

          {/* Floor layers */}
          {floorImages.map((layer, index) => (
            <div key={index} className="layer-section">
              <div className="layer-header">
                <p>Layer {index + 1}</p>
                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  id={`file-${index}`}
                  onChange={(e) => handleImageChange(e, index)}
                  style={{ display: "none" }}
                />
                <label htmlFor={`file-${index}`} className="upload-btn">
                  Upload Floor Image
                </label>
                {floorImages.length > 1 && (
                  <button
                    onClick={() => handleRemoveLayer(index)}
                    className="remove-layer-btn"
                  >
                    ✕
                  </button>
                )}
              </div>

              {layer.preview && (
                <div className="image-preview">
                  <p>Preview:</p>
                  <img
                    src={layer.preview}
                    alt="Layer preview"
                    style={{ width: `${layer.imageWidth}%` }}
                    onWheel={(e) => handleWheel(e, index)}
                  />
                </div>
              )}
            </div>
          ))}

          <button onClick={handleAddLayer} className="add-layer-btn">
            ➕ Add New Layer
          </button>

          {showScalingStep && (
            <div className="scaling-section">
              <h3>Scaling</h3>
              <p className="scaling-help">
                Set the project scale before creating the project.
              </p>
              <input
                type="text"
                placeholder="Scale (e.g. 1:100)"
                value={form.scale}
                onChange={(e) => setField("scale", e.target.value)}
              />
            </div>
          )}

          {error && <p className="error">{error}</p>}
          {success && <p className="success">{success}</p>}

          <div className="form-actions">
            <button onClick={() => navigate("/app/dashboard")} className="cancel-btn">
              Cancel
            </button>
            {!showScalingStep ? (
              <button onClick={handleOpenScalingStep} className="create-btn">
                Configure Scaling
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading} className="create-btn">
                {loading ? "Creating..." : "Create Project"}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default ImageUploader;
