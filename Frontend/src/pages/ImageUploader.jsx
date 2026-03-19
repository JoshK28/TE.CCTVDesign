import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function ImageUploader({ onLogout }) {
  const navigate = useNavigate();

  // project details state
  const [projectName, setProjectName] = useState("");
  const [clientName, setClientName] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [scale, setScale] = useState("1:100");

  // floor images state - supports multiple layers
  const [floorImages, setFloorImages] = useState([{ file: null, preview: null, imageWidth: 80 }]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // handles adding a new layer
  const handleAddLayer = () => {
    setFloorImages([...floorImages, { file: null, preview: null, imageWidth: 80 }]);
  };

  // handles removing a layer
  const handleRemoveLayer = (index) => {
    const updated = floorImages.filter((_, i) => i !== index);
    setFloorImages(updated);
  };

  // handles image selection for a specific layer
  const handleImageChange = (event, index) => {
    const file = event.target.files[0];

    if (!file) return;

    if (file.type !== 'image/png' && file.type !== 'image/jpeg') {
      alert('Please select a .png or .jpg file only.');
      event.target.value = null;
      return;
    }

    const preview = URL.createObjectURL(file);
    const updated = [...floorImages];
    updated[index] = { file, preview, imageWidth: 80 };
    setFloorImages(updated);
  };

  // handles zoom on scroll for a specific layer
  const handleWheel = (event, index) => {
    const zoomSpeed = 5;
    const updated = [...floorImages];

    if (event.deltaY < 0) {
      updated[index].imageWidth = Math.min(updated[index].imageWidth + zoomSpeed, 300);
    } else {
      updated[index].imageWidth = Math.max(updated[index].imageWidth - zoomSpeed, 10);
    }
    setFloorImages([...updated]);
  };

  // handles form submission - creates project and uploads floor images
  const handleSubmit = async () => {
    // validate required fields
    if (!projectName) return setError("Project name is required");
    if (!clientName) return setError("Client name is required");
    if (!address) return setError("Address is required");
    if (floorImages.every(f => !f.file)) return setError("Please upload at least one floor image");

    setLoading(true);
    setError("");

    try {
      // build the form data to send to the backend
      const formData = new FormData();
      formData.append("Title", projectName);
      formData.append("ClientName", clientName);
      formData.append("Address", address);
      formData.append("Description", description);
      formData.append("Scale", scale);

      // add each floor image to the form data
      floorImages.forEach((layer) => {
        if (layer.file) {
          formData.append("FloorImages", layer.file);
        }
      });

      // send the create project request to the backend
      const res = await api.post("/api/projects/create", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setSuccess("Project created successfully!");

      // navigate to wall identifier page with the project id
      setTimeout(() => {
        navigate("/app/DesignPage", { state: { projectId: res.data.projectID } });
      }, 1500);

    } catch (err) {
      setError(err.response?.data || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  // handles cancel button
  const handleCancel = () => {
    navigate("/app");
  };

  return (
    <div className="upload-view">
      <header className="App-header">
        <h1>CCTV Design Tool</h1>
        <button onClick={onLogout} className="logout-button">
          Logout
        </button>
      </header>

      <div className="create-project-form">
        <h2>Create Project</h2>

        {/* project details */}
        <input
          type="text"
          placeholder="Project Name"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="form-input"
        />
        <input
          type="text"
          placeholder="Client Name"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          className="form-input"
        />
        <input
          type="text"
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="form-input"
        />
        <input
          type="text"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="form-input"
        />
        <input
          type="text"
          placeholder="Scale e.g. 1:100"
          value={scale}
          onChange={(e) => setScale(e.target.value)}
          className="form-input"
        />

        {/* floor image layers */}
        {floorImages.map((layer, index) => (
          <div key={index} className="layer-container">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <p>Layer {index + 1}</p>

              {/* file upload button */}
              <input
                type="file"
                id={`floorImage-${index}`}
                accept="image/png, image/jpeg"
                onChange={(e) => handleImageChange(e, index)}
                className="hidden-input"
              />
              <label htmlFor={`floorImage-${index}`} className="upload-button">
                Upload Floor Image
              </label>

              {/* remove layer button - only show if more than one layer */}
              {floorImages.length > 1 && (
                <button onClick={() => handleRemoveLayer(index)} className="remove-button">
                  ✕
                </button>
              )}
            </div>

            {/* image preview with zoom */}
            {layer.preview && (
              <div className="image-preview-container">
                <p>Layer {index + 1} preview:</p>
                <img
                  src={layer.preview}
                  alt={`Layer ${index + 1} preview`}
                  className="image-preview"
                  onWheel={(e) => handleWheel(e, index)}
                  style={{ width: `${layer.imageWidth}%`, maxWidth: '800px', height: 'auto' }}
                />
              </div>
            )}
          </div>
        ))}

        {/* add new layer button */}
        <button onClick={handleAddLayer} className="add-layer-button">
          Add New Layer
        </button>

        {/* error and success messages */}
        {error && <p style={{ color: "red" }}>{error}</p>}
        {success && <p style={{ color: "green" }}>{success}</p>}

        {/* cancel and submit buttons */}
        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <button onClick={handleCancel} className="cancel-button">
            Cancel
          </button>
          <button onClick={handleSubmit} className="upload-button" disabled={loading}>
            {loading ? "Creating..." : "Create Project"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImageUploader;