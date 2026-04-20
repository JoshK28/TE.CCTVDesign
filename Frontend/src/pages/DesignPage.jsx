import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Toolbar, Equipment, EquipmentSelector, AttributesBar, WallDrawingLayer } from '../Components/index';
import api from '../services/api';

const DEFAULT_CAMERA_SETTINGS = {
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
};

const FOV_SENSOR_WIDTH = 6.4;
const FOV_MAX_DISTANCE = 300;
const FOV_RAY_COUNT = 48;
const RAY_EPSILON = 1e-6;

const updateItemById = (items, id, patch) =>
  items.map((item) => (item.id === id ? { ...item, ...patch } : item));

const updateItemAttributesById = (items, id, attributesPatch) =>
  items.map((item) =>
    item.id === id
      ? { ...item, attributes: { ...(item.attributes ?? {}), ...attributesPatch } }
      : item
  );

const createDevice = (tool, x, y) => ({
  id: Date.now(),
  kind: tool,
  type: tool,
  x,
  y,
  ...DEFAULT_CAMERA_SETTINGS,
});

const getRayWallIntersection = (origin, direction, maxDistance, wall) => {
  const sx = wall.x2 - wall.x1;
  const sy = wall.y2 - wall.y1;
  const cross = direction.x * sy - direction.y * sx;

  if (Math.abs(cross) < RAY_EPSILON) return null;

  const qpx = wall.x1 - origin.x;
  const qpy = wall.y1 - origin.y;
  const t = (qpx * sy - qpy * sx) / cross;
  const u = (qpx * direction.y - qpy * direction.x) / cross;

  if (t < 0 || t > maxDistance || u < 0 || u > 1) return null;

  return {
    x: origin.x + direction.x * t,
    y: origin.y + direction.y * t,
    distance: t,
  };
};

const castRayWithWalls = (origin, angle, maxDistance, walls) => {
  const direction = { x: Math.cos(angle), y: Math.sin(angle) };
  let closest = {
    x: origin.x + direction.x * maxDistance,
    y: origin.y + direction.y * maxDistance,
    distance: maxDistance,
  };

  for (const wall of walls) {
    const hit = getRayWallIntersection(origin, direction, maxDistance, wall);
    if (hit && hit.distance < closest.distance) {
      closest = hit;
    }
  }

  return closest;
};

const calculateFovPolygon = (item, walls) => {
  const x = item.x ?? 0;
  const y = item.y ?? 0;
  const rotation = item.rotation ?? 0;
  const focalLength = item.focalLength ?? DEFAULT_CAMERA_SETTINGS.focalLength;
  const hfov = 2 * Math.atan(FOV_SENSOR_WIDTH / (2 * focalLength)) * (180 / Math.PI);
  const halfAngle = hfov / 2;
  const leftAngle = (rotation - halfAngle) * (Math.PI / 180);
  const rightAngle = (rotation + halfAngle) * (Math.PI / 180);
  const origin = { x, y };

  const points = [`${x},${y}`];
  for (let i = 0; i <= FOV_RAY_COUNT; i += 1) {
    const ratio = i / FOV_RAY_COUNT;
    const angle = leftAngle + (rightAngle - leftAngle) * ratio;
    const hitPoint = castRayWithWalls(origin, angle, FOV_MAX_DISTANCE, walls);
    points.push(`${hitPoint.x},${hitPoint.y}`);
  }

  return points.join(' ');
};

function Workspace({ imageSrc }) {
  const [activeTool, setActiveTool] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [walls, setWalls] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [displaySelector, setDisplaySelector] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!activeTool) return;
      if (event.key === 'Escape' || event.key === 'Enter') {
        setActiveTool(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTool]);

  const updatePlacement = (id, patch) => {
    setEquipment((prev) => updateItemById(prev, id, patch));
  };

  const updatePlacementAttributes = (id, attributesPatch) => {
    setEquipment((prev) => updateItemAttributesById(prev, id, attributesPatch));
  };

  const handleAddWall = (wall) => {
    setWalls((prev) => [...prev, wall]);
  };

  const selectedItem = equipment.find((item) => item.id === selectedItemId);
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

    const newDevice = createDevice(toolToPlace, x, y);
    setEquipment((prev) => [...prev, newDevice]);
    setSelectedItemId(newDevice.id);
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
              points={calculateFovPolygon(item, walls)}
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
        <WallDrawingLayer activeTool={activeTool} walls={walls} onAddWall={handleAddWall} />
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