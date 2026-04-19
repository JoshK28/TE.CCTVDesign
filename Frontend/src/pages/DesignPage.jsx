import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Toolbar, Equipment, EquipmentSelector, AttributesBar } from '../Components/index';
import api from '../services/api';

function Workspace({ imageSrc }) {
  const [activeTool, setActiveTool] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [itemSelected, setSelectedItem] = useState(null);
  const [displaySelector, setDisplaySelector] = useState(false);

  // -------------------------------------------------------
  // FOV MATH (SVG polygon points)
  // -------------------------------------------------------
  function calculateFOVPoints(item) {
    const { x, y, rotation, focalLength } = item;

    const sensorWidth = 6.4;
    const hfov = 2 * (Math.atan(sensorWidth / (2 * focalLength))) * (180 / Math.PI);
    const halfAngle = hfov / 2;
    const length = 300;

    const leftAngle = (rotation - halfAngle) * (Math.PI / 180);
    const rightAngle = (rotation + halfAngle) * (Math.PI / 180);

    const x1 = x + length * Math.cos(leftAngle);
    const y1 = y + length * Math.sin(leftAngle);

    const x2 = x + length * Math.cos(rightAngle);
    const y2 = y + length * Math.sin(rightAngle);

    return `${x},${y} ${x1},${y1} ${x2},${y2}`;
  }

  // -------------------------------------------------------
  // PLACE NEW CAMERA
  // -------------------------------------------------------
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
    setEquipment(prev => [
      ...prev,
      {
        id: newId,
        type: toolToPlace,
        x,
        y,
        name: "",
        focalLength: 2.8,
        height: 3,
        tilt: 0,
        rotation: 0,
        resolution: "1080p",
        irRange: 30,
        notes: "",
        fovColor: "rgba(0, 150, 255, 0.3)"   // default FOV colour
      }
    ]);

    setActiveTool(null);
    setDisplaySelector(true);
  };

  // -------------------------------------------------------
  // UPDATE POSITION
  // -------------------------------------------------------
  const handleUpdatePosition = (id, newX, newY) => {
    setEquipment(prev =>
      prev.map(item =>
        item.id === id ? { ...item, x: newX, y: newY } : item
      )
    );
  };

  // -------------------------------------------------------
  // UPDATE SETTINGS (Sidebar)
  // -------------------------------------------------------
  const handleUpdateSettings = (id, field, value) => {
    setEquipment(prev =>
      prev.map(item =>
        item.id === id ? { ...item, [field]: value } : item
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
        onClick={() => setSelectedItem(null)}
        onDrop={handleNewItem}
        onDragOver={(e) => e.preventDefault()}
      >
        <img
          src={imageSrc}
          alt="Full-screen design layout"
          className="fullscreen-image"
          draggable="false"
        />

        {/* -------------------------------------------------------
            SVG FOV OVERLAY (draws the cone)
        -------------------------------------------------------- */}
        <svg className="fov-overlay">
          {equipment.map(item => (
            <polygon
              key={item.id}
              points={calculateFOVPoints(item)}
              fill={item.fovColor}
              stroke={item.fovColor}
              strokeWidth="2"
            />
          ))}
        </svg>



        {/* CAMERA ICONS */}
        {equipment.map(item => (
          <Equipment
            key={item.id}
            id={item.id}
            type={item.type}
            x={item.x}
            y={item.y}
            onSelect={setSelectedItem}
            onUpdatePosition={handleUpdatePosition}
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
        onClose={() => setSelectedItem(null)}
        onUpdateSettings={handleUpdateSettings}
      />
    </div>
  );
}

function DesignPage() {
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