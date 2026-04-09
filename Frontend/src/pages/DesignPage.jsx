import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Toolbar, Equipment, EquipmentSelector, AttributesBar } from '../Components/index';
import api from '../services/api';

function Workspace({ imageSrc, floorId, onUnsavedChanges }) {
  const [activeTool, setActiveTool] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [itemSelected, setSelectedItem] = useState(null);
  const [displaySelector, setDisplaySelector] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    if (!floorId) return;

    const fetchPlacements = async () => {
      try {
        const res = await api.get(`/api/camerplacements/${floorId}`);
        const loaded = res.data.map(p => ({
          id: p.placementID,
          type: p.type,
          x: p.x,
          y: p.y,
          rotation: p.rotation
        }));
        setEquipment(loaded);
      } catch (err) {
        console.error("Failed to load placements", err);
      }
    };

    fetchPlacements();
  }, [floorId]);

  const handleNewItem = (event) => {
    event.preventDefault();

    const toolToPlace = event.dataTransfer ? event.dataTransfer.getData('tool') : activeTool;

    if (!toolToPlace) {
      setSelectedItem(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const newId = Date.now();
    setEquipment(prev => [...prev, { id: newId, type: toolToPlace, x, y, rotation: 0 }]);
    setActiveTool(null);
    setDisplaySelector(true);

    // mark unsaved changes
    onUnsavedChanges(true);
  };

  const handleUpdatePosition = (id, newX, newY) => {
    setEquipment(prev => prev.map(item =>
      item.id === id ? { ...item, x: newX, y: newY } : item
    ));

    // mark unsaved changes
    onUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!floorId) {
      setSaveMessage("No floor layout selected");
      return;
    }

    setSaving(true);
    setSaveMessage("");

    try {
      const placements = equipment.map(item => ({
        floorID: floorId,
        x: item.x,
        y: item.y,
        rotation: item.rotation || 0,
        type: item.type
      }));

      await api.post(`/api/camerplacements/save/${floorId}`, placements);
      setSaveMessage("Saved successfully!");

      // clear unsaved changes after saving
      onUnsavedChanges(false);

      setTimeout(() => setSaveMessage(""), 3000);
    } catch (err) {
      setSaveMessage("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="design-workspace">
      {/* Left Toolbar */}
      <div className="toolbar-sidebar">
        <Toolbar onSelectTool={setActiveTool} />
      </div>

      {/* Main Image Area */}
      <div
        className="image-fullscreen-wrapper"
        onClick={handleNewItem}
        onDrop={handleNewItem}
        onDragOver={(e) => { e.preventDefault(); }}
      >
        <img
          src={imageSrc}
          alt="Full-screen design layout"
          className="fullscreen-image"
          draggable="false"
        />
        {equipment.map(equipment => (
          <Equipment
            key={equipment.id}
            id={equipment.id}
            type={equipment.type}
            x={equipment.x}
            y={equipment.y}
            onSelect={setSelectedItem}
            onUpdatePosition={handleUpdatePosition}
          />
        ))}
        <p className="item-count">Items Placed: {equipment.length}</p>

        {/* save button and message */}
        <div style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "5px",
          zIndex: 1005
        }}>
          <button
            onClick={(e) => { e.stopPropagation(); handleSave(); }}
            disabled={saving}
            style={{
              padding: "8px 20px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: saving ? "not-allowed" : "pointer",
              fontSize: "14px"
            }}
          >
            {saving ? "Saving..." : "Save"}
          </button>
          {saveMessage && (
            <p style={{
              backgroundColor: saveMessage.includes("Failed") ? "rgba(255,0,0,0.7)" : "rgba(0,0,0,0.6)",
              color: "white",
              padding: "5px 10px",
              borderRadius: "5px",
              fontSize: "13px",
              margin: 0
            }}>
              {saveMessage}
            </p>
          )}
        </div>
      </div>

      {/* DB Equipment Selector */}
      <EquipmentSelector visible={displaySelector} onHide={() => {
        setDisplaySelector(false);
      }} />

      {/* Right Attributes Bar */}
      <AttributesBar
        selectedItemId={itemSelected}
        equipment={equipment}
      />
    </div>
  );
}

function DesignPage({ onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  const projectId = location.state?.projectId;
  const imageSrcFromState = location.state?.imageSrc;

  const [floorLayouts, setFloorLayouts] = useState([]);
  const [selectedLayer, setSelectedLayer] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (imageSrcFromState) {
      setLoading(false);
      return;
    }

    if (!projectId) {
      navigate('/app/upload');
      return;
    }

    const fetchFloorLayouts = async () => {
      try {
        const res = await api.get(`/api/floorlayouts/${projectId}`);
        setFloorLayouts(res.data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch floor layouts", err);
        setLoading(false);
      }
    };

    fetchFloorLayouts();
  }, [projectId, imageSrcFromState, navigate]);

  if (loading) return <p>Loading floor layouts...</p>;

  const currentImageSrc = imageSrcFromState
    ? imageSrcFromState
    : floorLayouts.length > 0
      ? `http://localhost:5113/api/floorlayouts/image/${floorLayouts[selectedLayer]?.floorID}`
      : null;

  if (!currentImageSrc) return <p>No floor layouts found for this project.</p>;

  const currentFloorId = floorLayouts.length > 0
    ? floorLayouts[selectedLayer]?.floorID
    : null;

  const handleBackButton = () => {
    if (hasUnsavedChanges) {
      const confirm = window.confirm("You have unsaved changes. Do you want to leave without saving?");
      if (confirm) navigate('/app/projects');
    } else {
      navigate('/app/projects');
    }
  };

  return (
    <div className="design-page-container">

      {/* top bar with back button */}
      <div className="design-topbar">
        <button onClick={handleBackButton} className="back-button">
          &larr; Back to Project List
        </button>
      </div>

      {/* image workspace area */}
      <Workspace
        imageSrc={currentImageSrc}
        floorId={currentFloorId}
        onUnsavedChanges={setHasUnsavedChanges}
      />

      {/* layer selector at bottom center */}
      {floorLayouts.length > 1 && (
        <div style={{
          position: "fixed",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "10px",
          backgroundColor: "rgba(0,0,0,0.6)",
          padding: "10px 20px",
          borderRadius: "30px",
          zIndex: 1000
        }}>
          {floorLayouts.map((layout, index) => (
            <button
              key={layout.floorID}
              onClick={() => setSelectedLayer(index)}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                border: "none",
                cursor: "pointer",
                backgroundColor: selectedLayer === index ? "#007bff" : "#fff",
                color: selectedLayer === index ? "#fff" : "#000",
                fontWeight: selectedLayer === index ? "bold" : "normal"
              }}
            >
              Layer {layout.layer}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default DesignPage;