import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Toolbar, Equipment, EquipmentSelector, AttributesBar } from '../Components/index';
import api from '../services/api';

function Workspace({ imageSrc }) {
  const [activeTool, setActiveTool] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [itemSelected, setSelectedItem] = useState(null);
  const [displaySelector, setDisplaySelector] = useState(false);

  const [showCameraModal, setShowCameraModal] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState(null);

  const mockCameraSpecs = {
    camera: {
      model: "Generic Camera",
      resolution: "2688 × 1520",
      fov: { h: [103, 55], v: [83, 45], d: [120, 53] },
      focalLength: "2.8mm"
    }
  };

  const handleCameraDoubleClick = (id) => {
    const item = equipment.find(e => e.id === id);
    if (!item) return;

    const camData = mockCameraSpecs[item.type] || mockCameraSpecs.camera;

    setSelectedCamera({
      ...camData,
      x: item.x,
      y: item.y
    });

    setShowCameraModal(true);
  };

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
    setEquipment(prev => [...prev, { id: newId, type: toolToPlace, x, y }]);
    setActiveTool(null);
    setDisplaySelector(true);
  };

  const handleUpdatePosition = (id, newX, newY) => {
    setEquipment(prev =>
      prev.map(item =>
        item.id === id ? { ...item, x: newX, y: newY } : item
      )
    );
  };

  return (
    <div className="design-workspace">
      <div className="toolbar-sidebar">
        <Toolbar onSelectTool={setActiveTool} />
      </div>

      <div
        className="image-fullscreen-wrapper"
        onClick={handleNewItem}
        onDrop={handleNewItem}
        onDragOver={(e) => e.preventDefault()}
      >
        <img
          src={imageSrc}
          alt="Full-screen design layout"
          className="fullscreen-image"
          draggable="false"
        />

        {equipment.map(item => (
          <Equipment
            key={item.id}
            id={item.id}
            type={item.type}
            x={item.x}
            y={item.y}
            onSelect={setSelectedItem}
            onUpdatePosition={handleUpdatePosition}
            onDoubleClick={handleCameraDoubleClick}
          />
        ))}

        <p className="item-count">Items Placed: {equipment.length}</p>
      </div>

      <EquipmentSelector
        visible={displaySelector}
        onHide={() => setDisplaySelector(false)}
      />

      <AttributesBar
        selectedItemId={itemSelected}
        equipment={equipment}
      />

      {showCameraModal && selectedCamera && (
        <div
          style={{
            position: "absolute",
            left: selectedCamera.x + 40,
            top: selectedCamera.y - 20,
            width: "260px",
            height: "160px",
            background: "white",
            border: "1px solid #ccc",
            borderRadius: "6px",
            padding: "10px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 999
          }}
        >
          <h4 style={{ margin: "0 0 8px 0" }}>Camera View</h4>

          <div
            style={{
              width: "100%",
              height: "90px",
              background: "#000",
              borderRadius: "4px",
              marginBottom: "8px"
            }}
          />

          <div style={{ fontSize: "12px", color: "#444" }}>
            <div><strong>Model:</strong> {selectedCamera.model}</div>
            <div><strong>FOV:</strong> {selectedCamera.fov.h[0]}°</div>
          </div>

          <button
            onClick={() => setShowCameraModal(false)}
            style={{
              marginTop: "8px",
              width: "100%",
              padding: "4px",
              fontSize: "12px",
              cursor: "pointer"
            }}
          >
            Close
          </button>
        </div>
      )}
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

  return (
    <div className="design-page-container">
      <div className="design-topbar">
        <button onClick={() => navigate('/app/projects')} className="back-button">
          &larr; Back to Project List
        </button>
      </div>

      <Workspace imageSrc={currentImageSrc} />

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