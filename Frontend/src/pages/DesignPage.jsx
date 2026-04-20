import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Toolbar, Equipment, EquipmentSelector, AttributesBar, WallDrawingLayer } from '../Components/index';
import api from '../services/api';

function Workspace({ imageSrc }) {
  const [activeTool, setActiveTool] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [displaySelector, setDisplaySelector] = useState(false);

  const updatePlacement = (id, patch) => {
    setEquipment((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  const updatePlacementAttributes = (id, attributesPatch) => {
    setEquipment((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              attributes: { ...(item.attributes ?? {}), ...attributesPatch },
            }
          : item
      )
    );
  };

  const selectedItem = equipment.find((item) => item.id === selectedItemId);
  const calculateFOVPoints = (item) => {
    const x = item.x ?? 0;
    const y = item.y ?? 0;
    const rotation = item.rotation ?? 0;
    const focalLength = item.focalLength ?? 2.8;
    const sensorWidth = 6.4;
    const hfov = 2 * Math.atan(sensorWidth / (2 * focalLength)) * (180 / Math.PI);
    const halfAngle = hfov / 2;
    const length = 300;

    const leftAngle = (rotation - halfAngle) * (Math.PI / 180);
    const rightAngle = (rotation + halfAngle) * (Math.PI / 180);

    const x1 = x + length * Math.cos(leftAngle);
    const y1 = y + length * Math.sin(leftAngle);
    const x2 = x + length * Math.cos(rightAngle);
    const y2 = y + length * Math.sin(rightAngle);

    return `${x},${y} ${x1},${y1} ${x2},${y2}`;
  };
  const handleNewItem = (event) => {
    event.preventDefault();

    const toolToPlace = event.dataTransfer ? event.dataTransfer.getData('tool') : activeTool;
    if (toolToPlace === 'wall') return;
    if (!toolToPlace) {
      setSelectedItemId(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const newId = Date.now();
    setEquipment((prev) => [
      ...prev,
      {
        id: newId,
        kind: toolToPlace,
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
        fovOpacity: 0.3,
        fovColor: "rgba(0, 150, 255, 0.3)",
        attributes: {},
      },
    ]);
    setSelectedItemId(newId);
    setActiveTool(null);
    setDisplaySelector(true);
  };

  const handleSelectCamera = (camera) => {
    const targetId = selectedItemId ?? equipment[equipment.length - 1]?.id;
    if (!targetId) return;

    updatePlacement(targetId, {
      name: camera.modelNumber ?? '',
      resolution: camera.resolution ?? '1080p',
    });

    updatePlacementAttributes(targetId, {
      cameraId: camera.id,
      cameraModel: camera.modelNumber,
      brand: camera.brand,
      resolution: camera.resolution,
      cameraType: camera.type,
    });
  };

  const handleUpdateSettings = (id, field, value) => {
    updatePlacement(id, { [field]: value });
  };

  return (
    <div className="design-workspace">

      <div className="toolbar-sidebar">
        <Toolbar onSelectTool={setActiveTool} />
      </div>

      <div
        className="image-fullscreen-wrapper"
        onClick={() => setSelectedItemId(null)}
        onDrop={handleNewItem}
        onDragOver={(e) => e.preventDefault()}
      >
        <img
          src={imageSrc}
          alt="Full-screen design layout"
          className="fullscreen-image"
          draggable="false"
        />
        <svg className="fov-overlay">
          {equipment
            .filter((item) => (item.kind ?? item.type) === 'camera')
            .map((item) => (
            <polygon
              key={item.id}
              points={calculateFOVPoints(item)}
              fill={item.fovColor ?? 'rgba(0, 150, 255, 0.3)'}
              stroke={item.fovColor ?? 'rgba(0, 150, 255, 0.3)'}
              strokeWidth="2"
            />
          ))}
        </svg>

        {equipment.map((item) => (
          <Equipment
            key={item.id}
            deviceInstance={item}
            onSelect={setSelectedItemId}
            onUpdatePlacement={updatePlacement}
          />
        ))}
        <WallDrawingLayer activeTool={activeTool} />
        <p className="item-count">Items Placed: {equipment.length}</p>
      </div>

      <EquipmentSelector
        visible={displaySelector}
        onHide={() => {
          setDisplaySelector(false);
        }}
        onSelectCamera={handleSelectCamera}
      />
      <AttributesBar
        selectedItemId={selectedItem?.id}
        equipment={equipment}
        onClose={() => setSelectedItemId(null)}
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