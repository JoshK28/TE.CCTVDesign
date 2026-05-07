import React, { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import ScaleCalibrator from "../Components/ScaleCalibrator";
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
    {
      file: null,
      preview: null,
      imageWidth: 80,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
      showGrid: false,
    },
  ]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showScalingStep, setShowScalingStep] = useState(false);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const dragState = useRef({ dragging: false, startX: 0, startY: 0, index: null });

  const handleAddLayer = () =>
    setFloorImages([
      ...floorImages,
      {
        file: null,
        preview: null,
        imageWidth: 80,
        offsetX: 0,
        offsetY: 0,
        rotation: 0,
        showGrid: false,
      },
    ]);

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
    updated[index] = {
      file,
      preview,
      imageWidth: 80,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
      showGrid: false,
    };
    setFloorImages(updated);
  };

  // ZOOM
  const handleZoomIn = (index) => {
    const updated = [...floorImages];
    updated[index].imageWidth = Math.min(updated[index].imageWidth + 10, 300);
    setFloorImages(updated);
  };

  const handleZoomOut = (index) => {
    const updated = [...floorImages];
    updated[index].imageWidth = Math.max(updated[index].imageWidth - 10, 10);
    setFloorImages(updated);
  };

  const handleResetZoom = (index) => {
    const updated = [...floorImages];
    updated[index].imageWidth = 80;
    updated[index].offsetX = 0;
    updated[index].offsetY = 0;
    updated[index].rotation = 0;
    setFloorImages(updated);
  };

  const handleAutoFit = (index) => {
    const updated = [...floorImages];
    updated[index].imageWidth = 100;
    updated[index].offsetX = 0;
    updated[index].offsetY = 0;
    setFloorImages(updated);
  };

  // ROTATION
  const handleRotateLeft = (index) => {
    const updated = [...floorImages];
    updated[index].rotation = (updated[index].rotation - 90 + 360) % 360;
    setFloorImages(updated);
  };

  const handleRotateRight = (index) => {
    const updated = [...floorImages];
    updated[index].rotation = (updated[index].rotation + 90) % 360;
    setFloorImages(updated);
  };

  // GRID
  const toggleGrid = (index) => {
    const updated = [...floorImages];
    updated[index].showGrid = !updated[index].showGrid;
    setFloorImages(updated);
  };

  // DRAG / PAN
  const startDrag = (e, index) => {
    dragState.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      index,
    };
  };

  const stopDrag = () => {
    dragState.current.dragging = false;
  };

  const onDrag = (e) => {
    if (!dragState.current.dragging) return;

    const { index, startX, startY } = dragState.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    const updated = [...floorImages];
    updated[index].offsetX += dx;
    updated[index].offsetY += dy;

    dragState.current.startX = e.clientX;
    dragState.current.startY = e.clientY;

    setFloorImages(updated);
  };

  // DOUBLE CLICK TO ZOOM
  const handleDoubleClick = (index) => {
    const updated = [...floorImages];
    updated[index].imageWidth = Math.min(updated[index].imageWidth + 20, 300);
    setFloorImages(updated);
  };

  const handleWheel = (event, index) => {
    event.preventDefault();
    if (event.deltaY < 0) handleZoomIn(index);
    else handleZoomOut(index);
  };

  // EXPORT EDITED IMAGE(S) AS PNG USING CANVAS
  const generateEditedBlobs = async () => {
    const promises = floorImages
      .filter((f) => f.file && f.preview)
      .map(
        (layer) =>
          new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
              const canvas = document.createElement("canvas");
              const ctx = canvas.getContext("2d");

              // Canvas size = viewport (crop to view)
              const viewportWidth = 1600;
              const viewportHeight = 900;
              canvas.width = viewportWidth;
              canvas.height = viewportHeight;

              ctx.fillStyle = "#ffffff";
              ctx.fillRect(0, 0, viewportWidth, viewportHeight);

              ctx.save();

              // Center canvas origin
              ctx.translate(viewportWidth / 2, viewportHeight / 2);

              // Apply rotation
              const rad = (layer.rotation * Math.PI) / 180;
              ctx.rotate(rad);

              // Apply zoom (imageWidth as percentage)
              const scale = layer.imageWidth / 100;
              ctx.scale(scale, scale);

              // Apply pan (offsetX/Y)
              ctx.translate(layer.offsetX, layer.offsetY);

              // Draw image centered
              ctx.drawImage(img, -img.width / 2, -img.height / 2);

              ctx.restore();

              canvas.toBlob((blob) => {
                if (!blob) reject(new Error("Failed to export image"));
                else resolve(blob);
              }, "image/png");
            };
            img.onerror = reject;
            img.src = layer.preview;
          })
      );

    return Promise.all(promises);
  };

  const handleSubmit = async () => {
    if (!form.projectName || !form.clientName || !form.address)
      return setError("Please fill all required fields.");

    if (floorImages.every((f) => !f.file))
      return setError("Please upload at least one floor image.");

    setLoading(true);
    setError("");

    try {
      const editedBlobs = await generateEditedBlobs();

      const formData = new FormData();
      formData.append("Title", form.projectName);
      formData.append("ClientName", form.clientName);
      formData.append("Address", form.address);
      formData.append("Description", form.description);
      formData.append("Scale", form.scale);
      editedBlobs.forEach((blob, idx) => {
        formData.append("FloorImages", blob, `floor_${idx + 1}.png`);
      });

      const res = await api.post("/api/projects/create", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess("Project created successfully!");

      setTimeout(() => {
        setShowScalingStep(false);
        navigate("/app/design", { state: { projectId: res.data.projectID } });
      }, 1000);
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

  const renderSetupSection = () => (
    <>
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

              <div className="zoom-controls">
                <button className="zoom-btn" onClick={() => handleZoomOut(index)}>
                  -
                </button>
                <button className="zoom-btn" onClick={() => handleZoomIn(index)}>
                  +
                </button>
                <button
                  className="zoom-btn reset-btn"
                  onClick={() => handleResetZoom(index)}
                >
                  Reset
                </button>
                <button className="zoom-btn" onClick={() => handleAutoFit(index)}>
                  Auto-fit
                </button>
                <button className="zoom-btn" onClick={() => handleRotateLeft(index)}>
                  Left
                </button>
                <button className="zoom-btn" onClick={() => handleRotateRight(index)}>
                  Right
                </button>
                <button
                  className={`zoom-btn ${layer.showGrid ? "grid-active" : ""}`}
                  onClick={() => toggleGrid(index)}
                >
                  Grid
                </button>
                <span className="zoom-percent">{layer.imageWidth}%</span>
              </div>

              <div
                className={`image-preview-container ${layer.showGrid ? "image-preview-grid" : ""}`}
                onMouseDown={(e) => startDrag(e, index)}
                onDoubleClick={() => handleDoubleClick(index)}
                onWheel={(e) => handleWheel(e, index)}
              >
                <img
                  src={layer.preview}
                  alt="Layer preview"
                  className="image-preview-img"
                  style={{
                    width: `${layer.imageWidth}%`,
                    transform: `translate(${layer.offsetX}px, ${layer.offsetY}px) rotate(${layer.rotation}deg)`,
                    transition: "width 0.15s ease",
                  }}
                  draggable={false}
                />
              </div>
            </div>
          )}
        </div>
      ))}

      <button onClick={handleAddLayer} className="add-layer-btn">
        ➕ Add New Layer
      </button>
    </>
  );

  const renderScalingSection = () => (
    <ScaleCalibrator
      layer={floorImages[0]}
      scale={form.scale}
      onScaleChange={(nextScale) => setField("scale", nextScale)}
    />
  );

  const renderStepActions = () => (
    <div className="form-actions">
      <button onClick={() => navigate("/app/dashboard")} className="cancel-btn">
        Cancel
      </button>
      {!showScalingStep ? (
        <button onClick={handleOpenScalingStep} className="create-btn">
          Configure Scaling
        </button>
      ) : (
        <>
          <button onClick={() => setShowScalingStep(false)} className="cancel-btn">
            Back
          </button>
          <button onClick={handleSubmit} disabled={loading} className="create-btn">
            {loading ? "Creating..." : "Create Project"}
          </button>
        </>
      )}
    </div>
  );

  return (
    <div className="upload-layout" onMouseMove={onDrag} onMouseUp={stopDrag}>
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

      <main className="upload-main">
        <h1>Create Project</h1>

        <div className={`form-container ${showScalingStep ? "form-container--scaling" : ""}`}>
          {showScalingStep ? renderScalingSection() : renderSetupSection()}

          {error && <p className="error">{error}</p>}
          {success && <p className="success">{success}</p>}

          {renderStepActions()}
        </div>
      </main>
    </div>
  );
}

export default ImageUploader;